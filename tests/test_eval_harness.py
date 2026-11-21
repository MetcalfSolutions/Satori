"""Offline tests for the shared harness: datasets, routing, parser, checkpointing, run context,
and backward compatibility of the two existing entry points."""

from __future__ import annotations

import json
import pathlib
import threading
import warnings

import pytest

from conftest import ROOT_DIR
from eval_lib import datasets, static_suites
from eval_lib.backends.mock import MockBackend
from eval_lib.checkpoint import Checkpoint, run_cases
from eval_lib.classification import CLASSIFY_TEMPLATE, canonical_label, parse_classification
from eval_lib.context import OutputDirError, RunContext, derive_report_name, derive_run_tag, resolve_out_dir
from eval_lib.paths import EVALS_DIR, SKILL_PATH
from eval_lib.routing import LABELS, classify_trigger_decision_lint, effective_stratum
from eval_lib.stats import target_met, usage_stats, wilson_score_interval

# ---------------------------------------------------------------------------
# datasets
# ---------------------------------------------------------------------------

EXPECTED_SIZES = {
    "trigger": 350, "held_out": 50, "adversarial": 44, "boundary": 48, "redteam": 30, "escalation": 8,
    "privacy": 10, "capability": 15, "gold_anchors": 8, "edge": 12, "judge_calibration": 50,
}


@pytest.mark.parametrize("name,size", sorted(EXPECTED_SIZES.items()))
def test_every_benchmark_loads_and_validates(name, size):
    rows = datasets.load_dataset(name)
    assert len(rows) == size
    ids = [row["id"] for row in rows]
    assert len(set(ids)) == len(ids), "duplicate case ids"


def test_dataset_registry_points_at_real_files():
    for name in datasets.DATASETS:
        assert datasets.dataset_path(name).is_file(), name
    assert datasets.trigger_benchmark_path().name == "trigger_boundary_350.jsonl"
    with pytest.raises(KeyError, match="Unknown dataset"):
        datasets.dataset_path("nope")


def test_malformed_rows_fail_loudly_with_file_and_line(tmp_path):
    bad = tmp_path / "broken.jsonl"
    bad.write_text('{"id": "a", "stratum": "x", "expected": "DEFER", "prompt": "p"}\n\n{"id": "b"}\n', encoding="utf-8")
    with pytest.raises(ValueError, match=r"broken\.jsonl:3: missing required field\(s\) \['stratum', 'expected'"):
        datasets.load_dataset("trigger", bad)
    bad.write_text('{"id": "a"\n', encoding="utf-8")
    with pytest.raises(ValueError, match=r"broken\.jsonl:1: invalid JSON"):
        datasets.load_dataset("trigger", bad)
    bad.write_text("[1, 2]\n", encoding="utf-8")
    with pytest.raises(ValueError, match="expected a JSON object"):
        datasets.load_dataset("trigger", bad)


# ---------------------------------------------------------------------------
# routing and the lint baseline
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("skill,baseline", [
    ("SKILL.md", "trigger_benchmark_report.json"),
    ("compact/SKILL.md", "trigger_benchmark_compact_report.json"),
])
def test_lint_classifier_reproduces_the_committed_baseline(skill, baseline):
    """The moved classifier and regexes give exactly the numbers in the release evidence."""
    skill_text = (ROOT_DIR / skill).read_text(encoding="utf-8")
    expected = json.loads((EVALS_DIR / baseline).read_text(encoding="utf-8"))
    hits: dict[str, int] = {}
    totals: dict[str, int] = {}
    mismatches = []
    for case in datasets.load_dataset("trigger"):
        stratum = effective_stratum(case)
        totals[stratum] = totals.get(stratum, 0) + 1
        if classify_trigger_decision_lint(case["prompt"], skill_text) == case["expected"]:
            hits[stratum] = hits.get(stratum, 0) + 1
        else:
            mismatches.append(case["id"])
    for stratum, block in expected["strata_accuracy"].items():
        assert (hits.get(stratum, 0), totals[stratum]) == (block["hits"], block["total"]), stratum
    assert mismatches == [m["id"] for m in expected["mismatches"]]


def test_effective_stratum():
    assert effective_stratum({"stratum": "safety", "expected": "CRISIS_HANDOFF"}) == "safety_acute"
    assert effective_stratum({"stratum": "safety", "expected": "DARK_NIGHT_PRESENCE"}) == "safety_darknight"
    assert effective_stratum({"stratum": "ambiguous_mixed", "expected": "HYBRID"}) == "hybrid"
    assert effective_stratum({"stratum": "negative", "expected": "DEFER"}) == "clear_negative"
    assert effective_stratum({"stratum": "anything_else", "expected": "ACTIVATE"}) == "clear_positive"


# ---------------------------------------------------------------------------
# routing reply parser
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("reply,label,rank,mode", [
    ('{"classification": "DEFER", "rank": 6, "rationale": "pure technical"}', "DEFER", 6, "json"),
    ('```json\n{"classification": "HYBRID", "rank": 5, "rationale": "x"}\n```', "HYBRID", 5, "json"),
    ('Here is my assessment.\n\n{"classification": "ACTIVATE", "rank": 4}\n\nHope that helps.', "ACTIVATE", 4, "json"),
    ('{"label": "Dark Night", "precedence_rank": 3, "reason": "3am"}', "DARK_NIGHT_PRESENCE", 3, "json"),
    ('{"decision": "pure-technical", "rank": 6}', "DEFER", 6, "json"),
    ('{"classification": "CRISIS_HANDOFF", "rank": 1, "rationale": "cut off', "CRISIS_HANDOFF", 1, "regex"),
    ("Weighing the ladder, the right behavior is CRISIS_HANDOFF here.", "CRISIS_HANDOFF", 1, "bare"),
])
def test_parse_classification_variants(reply, label, rank, mode):
    parsed = parse_classification(reply)
    assert (parsed["label"], parsed["rank"], parsed["parse_mode"]) == (label, rank, mode)
    assert parsed["rank_ok"] is True


def test_parse_classification_failures_and_rank_checks():
    assert parse_classification("I am not sure.")["label"] is None
    wrong_rank = parse_classification('{"classification": "DEFER", "rank": 2}')
    assert wrong_rank["label"] == "DEFER" and wrong_rank["rank_ok"] is False
    assert parse_classification('{"classification": "CRISIS_HANDOFF", "rank": 2}')["rank_ok"] is True  # Tier 1
    assert canonical_label("do not activate") == "DEFER" and canonical_label("banana") is None
    assert len(parse_classification('{"classification": "DEFER", "rank": 6, "rationale": "' + "x" * 900 + '"}')[
        "rationale"]) == 300


def test_classification_prompt_names_every_label():
    prompt = CLASSIFY_TEMPLATE.format(prompt="hello")
    assert all(label in prompt for label in LABELS)
    assert "USER PROMPT:\nhello\nEND USER PROMPT" in prompt


# ---------------------------------------------------------------------------
# stats
# ---------------------------------------------------------------------------


def test_wilson_interval_matches_the_published_figures():
    assert wilson_score_interval(196, 200) == (0.9497, 0.9922)  # facts.json: [94.97%, 99.22%]
    assert wilson_score_interval(200, 200) == (0.9812, 1.0)     # the live calibration reports
    assert wilson_score_interval(0, 0) == (0.0, 0.0)


def test_target_met_and_usage_stats():
    assert target_met(0.9, 60, ">=90%") and not target_met(0.8999, 60, ">=90%")
    assert target_met(1.0, 20, "100%") and not target_met(0.95, 20, "100%")
    assert target_met(0.0, 0, "100%"), "an empty stratum cannot fail a gate"
    stats = usage_stats([
        {"result": {"latency_ms": 100, "usage": {"input": 10, "output": 4, "reasoning": 1}}},
        {"result": {"latency_ms": 300, "usage": {"input": 30, "output": 8}}},
        {"result": None},
    ])
    assert stats["latency_ms"] == {"count": 2, "mean": 200.0, "median": 300, "p95": 300, "max": 300}
    assert stats["input_tokens"]["count"] == 2 and stats["thinking_tokens"]["count"] == 1


# ---------------------------------------------------------------------------
# checkpoint / resume
# ---------------------------------------------------------------------------


def test_run_cases_resumes_and_never_caches_failures(tmp_path):
    cases = [{"id": f"c{i}"} for i in range(6)]
    calls: list[str] = []
    attempts = {"c3": 0}
    lock = threading.Lock()

    def runner(case, thinking, timeout):
        with lock:
            calls.append(case["id"])
            attempts[case["id"]] = attempts.get(case["id"], 0) + 1
        if case["id"] == "c3" and attempts["c3"] == 1:
            return {"ok": False, "error": "transient"}
        if case["id"] == "c4":
            raise RuntimeError("worker blew up")
        return {"ok": True, "text": case["id"].upper()}

    kwargs = dict(cache_dir=tmp_path, suite="demo", thinking="low", workers=3, timeout=1.0, force=False,
                  runner=runner, progress_every=100)
    first = run_cases(cases, **kwargs)
    assert [entry["case"]["id"] for entry in first] == [c["id"] for c in cases], "results keep dataset order"
    assert first[3]["result"] is None and first[4]["result"] is None, "failures are not cached"
    assert first[0]["result"]["text"] == "C0"

    calls.clear()
    second = run_cases(cases, **kwargs)
    assert sorted(calls) == ["c3", "c4"], "only the failed cases are retried on resume"
    assert second[3]["result"]["text"] == "C3"

    calls.clear()
    run_cases(cases, **{**kwargs, "force": True})
    assert len(calls) == 6


def test_checkpoint_tolerates_a_corrupted_cache_file(tmp_path):
    path = tmp_path / "demo_low.jsonl"
    path.write_text('{"id": "a", "ok": true, "ts": "t", "result": {"ok": true, "text": "A"}}\n'
                    'garbage line\n\n{"id": "b", "ok": false}\n', encoding="utf-8")
    ckpt = Checkpoint(path)
    assert ckpt.has("a") and not ckpt.has("b")
    ckpt.record("c", {"ok": True, "text": "C"})
    ckpt.record("d", {"ok": False})
    assert Checkpoint(path).done.keys() == {"a", "c"}


# ---------------------------------------------------------------------------
# run context and the output-directory guard
# ---------------------------------------------------------------------------


def test_output_directory_guard(tmp_path):
    assert resolve_out_dir("opencode-go/glm-5.3", None) == (EVALS_DIR / "glm-5.3").resolve()
    assert resolve_out_dir("m", EVALS_DIR / "custom" / "nested") == (EVALS_DIR / "custom" / "nested").resolve()
    assert resolve_out_dir("m", tmp_path / "outside") == (tmp_path / "outside").resolve()
    for refused in (EVALS_DIR, ROOT_DIR, ROOT_DIR / "scripts" / "out", ROOT_DIR / "references"):
        with pytest.raises(OutputDirError, match="--out-dir must be"):
            resolve_out_dir("m", refused)


def test_artifact_naming_keeps_the_original_glm_layout():
    assert derive_run_tag("opencode-go/glm-5.3", out_dir_given=False) == "glm53"
    assert derive_run_tag("opencode-go/glm-5.3", out_dir_given=True) == "glm_5_3"
    assert derive_run_tag("opencode-go/claude-haiku-5-5", out_dir_given=False) == "claude_haiku_5_5"
    assert derive_run_tag("vendor/Other.Model-9", out_dir_given=False) == "other_model_9"
    assert derive_report_name("opencode-go/glm-5.3") == "GLM_5_3_CALIBRATION_REPORT.md"
    assert derive_report_name("opencode-go/minimax-m3") == "MINIMAX_M3_CALIBRATION_REPORT.md"


def test_run_context_refuses_to_write_outside_its_directory(tmp_path):
    ctx = RunContext.create(MockBackend(), tmp_path / "run")
    ctx.ensure_dirs()
    ctx.write_json(ctx.artifact("safety"), {"ok": True})
    assert json.loads((tmp_path / "run" / "safety_mock.json").read_text(encoding="utf-8")) == {"ok": True}
    assert ctx.load_report("safety_mock.json") == {"ok": True} and ctx.load_report("missing.json") is None
    for target in (tmp_path / "elsewhere.json", EVALS_DIR / "safety_certification_report.json"):
        with pytest.raises(RuntimeError, match="Refusing to write outside"):
            ctx.write_json(target, {"nope": True})
    assert ctx.provenance() == {"evaluation_mode": "mock", "backend": "mock", "model": "mock",
                                "skill_target": "SKILL.md"}
    assert ctx.out_label == str(tmp_path / "run")  # outside the repo: shown as an absolute path


# ---------------------------------------------------------------------------
# scripts/run_evals.py stays backward compatible
# ---------------------------------------------------------------------------

RUN_EVALS_PUBLIC_NAMES = [
    "BANNED_CLICHES", "MACHINERY_LEAK_RE", "GEMINI_FALLBACK_MODELS", "CONTRAST_FORMULA_RE", "BULLET_OR_HEADER_RE",
    "CHEERLEADING_OR_PREMATURE_RE", "MULTI_FRAMEWORK_RE", "TECHNICAL_TOKENS_RE", "PERSONAL_DISTRESS_RE",
    "CRISIS_TRIGGERS_RE", "DARK_NIGHT_TRIGGERS_RE", "BLOCKED_STAGE2_JUDGE_PATTERNS", "ROOT_DIR", "EVALS_DIR",
    "wilson_score_interval", "is_blocked_judge_model", "evaluate_rubric_dimensions", "score_stage1_deterministic",
    "classify_trigger_decision_lint", "get_env_var", "has_any_api_key", "pairwise_compare_debiased",
    "run_trigger_suite", "run_held_out_suite", "run_safety_suite", "run_capability_suite", "run_cost_suite",
    "run_coexistence_suite", "run_fault_suite", "run_edge_suite", "run_matrix_suite", "run_loader_suite",
    "run_minimal_suite", "run_all_suites", "main",
]


def test_run_evals_still_exports_every_public_name():
    import run_evals
    from eval_lib import stage1

    missing = [name for name in RUN_EVALS_PUBLIC_NAMES if not hasattr(run_evals, name)]
    assert missing == []
    assert run_evals.score_stage1_deterministic is stage1.score_stage1_deterministic
    assert run_evals.run_cost_suite is static_suites.run_cost_suite


def test_run_evals_cli_flags_are_unchanged(tmp_path, monkeypatch, capsys):
    import run_evals

    monkeypatch.setattr(run_evals, "EVALS_DIR", tmp_path)  # the trigger suite writes its report next to the baselines
    monkeypatch.setattr(run_evals, "has_any_api_key", lambda: False)
    assert run_evals.main(["--suite", "trigger", "--mode", "lint"]) == 0
    report = json.loads(capsys.readouterr().out)
    baseline = json.loads((EVALS_DIR / "trigger_benchmark_report.json").read_text(encoding="utf-8"))
    assert report == baseline, "the lint trigger report is byte-for-byte the committed baseline"
    assert json.loads((tmp_path / "trigger_benchmark_report.json").read_text(encoding="utf-8")) == baseline

    assert run_evals.main(["--suite", "trigger", "--mode", "lint", "--skill", "compact/SKILL.md"]) == 0
    compact = json.loads(capsys.readouterr().out)
    assert compact["skill_target"] == "compact/SKILL.md" and (tmp_path / "trigger_benchmark_compact_report.json").exists()

    for suite, status in (("held_out", "PASSED"), ("safety", "CERTIFIED"), ("capability", "PASSED"),
                          ("cost", "PASSED"), ("coexistence", "PASSED"), ("fault", "PASSED"), ("edge", "PASSED"),
                          ("matrix", "PASSED"), ("loader", "PASSED"), ("minimal", "PASSED")):
        out = tmp_path / f"{suite}.json"
        assert run_evals.main(["--suite", suite, "--mode", "lint", "--output", str(out),
                               "--model", "claude-4.5-opus", "--temperature", "0.0"]) == 0, suite
        assert json.loads(out.read_text(encoding="utf-8"))["status"] == status, suite
    capsys.readouterr()
    with pytest.raises(SystemExit) as exc:
        run_evals.main(["--suite", "nope"])
    assert exc.value.code == 2


def test_judge_calibration_script_still_imports_run_evals():
    import test_judge_calibration

    assert test_judge_calibration.run_evals.pairwise_compare_debiased
    with pytest.raises(ValueError, match="Profile 4/5"):
        test_judge_calibration.run_evals.pairwise_compare_debiased("a", "b", judge_model="gemini-3.8-flash-lite")


# ---------------------------------------------------------------------------
# scripts/run_glm53_evals.py is a thin deprecation wrapper
# ---------------------------------------------------------------------------


def test_deprecated_wrapper_forwards_to_the_pi_backend(monkeypatch, capsys):
    import run_glm53_evals
    import run_live_evals

    seen: list[list[str]] = []
    monkeypatch.setattr(run_live_evals, "main", lambda argv=None: seen.append(list(argv)) or 0)
    assert run_glm53_evals.main(["--suite", "phase1", "--thinking", "low", "--workers", "4"]) == 0
    assert seen == [["--backend", "pi", "--suite", "phase1", "--thinking", "low", "--workers", "4"]]
    assert "[deprecated] scripts/run_glm53_evals.py now forwards" in capsys.readouterr().err

    run_glm53_evals.main(["--backend", "mock", "--suite", "smoke"])
    assert seen[-1] == ["--backend", "mock", "--suite", "smoke"], "an explicit backend is respected"


def test_deprecated_wrapper_accepts_every_original_flag(capsys):
    import run_glm53_evals

    assert run_glm53_evals.main(["--backend", "mock", "--suite", "smoke", "--thinking", "medium", "--workers", "2",
                                 "--timeout", "30", "--force"]) == 0
    capsys.readouterr()
    with pytest.raises(SystemExit) as exc:
        run_glm53_evals.main(["--help"])
    assert exc.value.code == 0
    usage = capsys.readouterr().out
    for flag in ("--suite", "--thinking", "--workers", "--timeout", "--force", "--model", "--out-dir"):
        assert flag in usage
    for suite in ("smoke", "trigger", "held_out", "edge", "deterministic", "phase1", "safety", "capability",
                  "adversarial", "calibrate", "phase2"):
        assert suite in usage


def test_deprecated_wrapper_still_resolves_moved_helpers():
    import run_glm53_evals
    from eval_lib import classification, detectors, stats

    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        assert run_glm53_evals.parse_classification is classification.parse_classification
        assert run_glm53_evals.check_boundary_held is detectors.check_boundary_held
        assert run_glm53_evals.wilson_ci is stats.wilson_score_interval
    assert all(issubclass(w.category, DeprecationWarning) for w in caught) and len(caught) == 3
    with pytest.raises(AttributeError):
        run_glm53_evals.not_a_real_name


# ---------------------------------------------------------------------------
# scripts/run_live_evals.py command line
# ---------------------------------------------------------------------------


def test_live_runner_refuses_ungated_backends(monkeypatch, capsys):
    import run_live_evals
    from eval_lib.backends import anthropic_messages, openai_compat

    monkeypatch.setattr(openai_compat, "get_env_var", lambda name: None)
    monkeypatch.setattr(anthropic_messages, "get_env_var", lambda name: None)
    assert run_live_evals.main(["--backend", "openai", "--model", "gpt-x", "--suite", "smoke"]) == 2
    assert "env-gated" in capsys.readouterr().err
    assert run_live_evals.main(["--backend", "anthropic", "--model", "claude-opus-5-5", "--suite", "smoke"]) == 2
    assert "ANTHROPIC_API_KEY" in capsys.readouterr().err


@pytest.mark.parametrize("argv,message", [
    (["--backend", "openai", "--suite", "smoke"], "needs an explicit --model"),
    (["--backend", "pi", "--fixtures", "x", "--suite", "smoke"], "only apply to --backend mock"),
    (["--backend", "mock", "--skill", "does/not/exist.md", "--suite", "smoke"], "--skill file not found"),
    (["--backend", "mock", "--suite", "everything"], "invalid choice"),
])
def test_live_runner_argument_errors(argv, message, capsys):
    import run_live_evals

    with pytest.raises(SystemExit) as exc:
        run_live_evals.main(argv)
    assert exc.value.code == 2 and message in capsys.readouterr().err


def test_live_runner_cannot_target_the_release_baselines(capsys):
    import run_live_evals

    with pytest.raises(SystemExit, match="--out-dir must be"):
        run_live_evals.main(["--backend", "mock", "--out-dir", str(EVALS_DIR), "--suite", "trigger"])
    with pytest.raises(SystemExit, match="--out-dir must be"):
        run_live_evals.main(["--backend", "mock", "--out-dir", str(ROOT_DIR / "scripts"), "--suite", "trigger"])


def test_mock_phases_write_complete_artifacts(tmp_path, capsys, evals_untouched):
    import run_live_evals

    out_dir = tmp_path / "full"
    base = ["--backend", "mock", "--out-dir", str(out_dir)]
    assert run_live_evals.main(base + ["--suite", "phase1", "--thinking", "low"]) in (0, 1)
    summary = json.loads(capsys.readouterr().out)
    assert summary["phase"] == "TASK-018 Phase 1" and summary["backend"] == "mock"
    assert "invocation" in summary and "pi_invocation" not in summary
    assert summary["non_destructive"].startswith(f"All outputs under {out_dir}/")
    assert summary["deterministic_suites"]["minimal"] == {"status": "PASSED", "output_file": "minimal_mock.json"}

    assert run_live_evals.main(base + ["--suite", "phase2", "--thinking", "medium"]) in (0, 1)
    capsys.readouterr()
    produced = sorted(p.name for p in out_dir.iterdir() if p.is_file())
    assert produced == [
        "MOCK_CALIBRATION_REPORT.md", "adversarial_seam_mock.json", "capability_mock.json", "coexistence_mock.json",
        "cost_mock.json", "edge_12_mock.json", "fault_mock.json", "held_out_50_mock.json", "loader_mock.json",
        "minimal_mock.json", "phase1_summary_mock.json", "safety_mock.json", "trigger_350_mock.json",
    ]
    edge = json.loads((out_dir / "edge_12_mock.json").read_text(encoding="utf-8"))
    assert [c["scoring_profile"] for c in edge["cases"]].count("hybrid") == 4
    assert edge["hybrid_profile_categories"] == ["hybrid", "mixed_intent"]
    assert sorted(p.name for p in (out_dir / ".cache").iterdir()) == [
        "adversarial_44_medium.jsonl", "capability_with_medium.jsonl", "capability_without_medium.jsonl",
        "edge_12_low.jsonl", "held_out_50_low.jsonl", "safety_boundary_medium.jsonl", "safety_escl_medium.jsonl",
        "safety_privacy_medium.jsonl", "safety_redteam_medium.jsonl", "trigger_350_low.jsonl",
    ]


def test_skill_flag_reaches_reports_and_the_extraction_detector(tmp_path, capsys):
    """`--skill compact/SKILL.md` evaluates the compact edition: provenance and extraction probes follow it."""
    import run_live_evals
    from eval_lib.detectors import check_extraction

    out_dir = tmp_path / "compact"
    assert run_live_evals.main(["--backend", "mock", "--skill", "compact/SKILL.md", "--out-dir", str(out_dir),
                                "--suite", "held_out"]) == 0
    capsys.readouterr()
    report = json.loads((out_dir / "held_out_50_mock.json").read_text(encoding="utf-8"))
    assert report["skill_target"] == "compact/SKILL.md"

    compact = pathlib.Path(ROOT_DIR / "compact" / "SKILL.md")
    dump = compact.read_text(encoding="utf-8")
    assert check_extraction(dump, skill_path=compact)
    assert SKILL_PATH != compact
