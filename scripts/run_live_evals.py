#!/usr/bin/env python3
"""Provider-agnostic live evaluation runner for Satori (scripts/run_live_evals.py).

Runs the live suites against any backend and writes every artifact into its own
output directory. Existing `evals/*_report.json` release baselines are never
touched (asserted at write time).

Backends (`--backend`):
  pi         `pi -p --model <id> --thinking <level> --mode json --no-session --no-tools
             --system-prompt SKILL.md` (default; the original GLM-5.3 harness behaviour)
  openai     any OpenAI-compatible /chat/completions endpoint, hosted or local
             (env-gated: OPENAI_API_KEY or OPENAI_BASE_URL)
  anthropic  Anthropic Messages API (env-gated: ANTHROPIC_API_KEY)
  mock       100% offline and deterministic: replays recorded transcripts
             (`--fixtures`) or built-in reference replies. Zero API keys.

Suites (`--suite`):
  smoke          pi/openai/anthropic: 3 routing calls (is the backend reachable?)
                 mock: the whole pipeline end to end plus detector canaries
  trigger        trigger_boundary_350.jsonl  -> trigger_350_<tag>.json
  held_out       held_out_benchmark.jsonl    -> held_out_50_<tag>.json
  edge           edge_inputs_12.jsonl        -> edge_12_<tag>.json (Stage-1 scored)
  deterministic  cost / coexistence / fault / loader / minimal
  phase1         trigger + held_out + edge + deterministic -> phase1_summary_<tag>.json
  safety         boundary 48 + red-team 30 + escalation 8x3 + privacy 10 -> safety_<tag>.json
  capability     15 paired cases, with vs without the skill -> capability_<tag>.json
  adversarial    44 Precedence-Ladder seam probes -> adversarial_seam_<tag>.json
  phase2         safety + capability + adversarial + calibration report
  calibrate      rebuild <MODEL>_CALIBRATION_REPORT.md from the JSON reports

Bounded concurrency via ThreadPoolExecutor(max_workers=4) with JSONL
checkpoint/resume under `<out-dir>/.cache/`. Re-running a suite whose cache is
complete makes zero model calls and simply re-scores the stored transcripts.

Examples:
  python3 scripts/run_live_evals.py --backend mock --suite smoke
  python3 scripts/run_live_evals.py --backend pi --model opencode-go/glm-5.3 --suite phase1 --thinking low
  python3 scripts/run_live_evals.py --backend mock --fixtures evals/glm-5.3/.cache \\
      --out-dir evals/glm-5.3-rescored --suite safety --thinking medium
  OPENAI_BASE_URL=http://localhost:8080/v1 python3 scripts/run_live_evals.py \\
      --backend openai --model local-model --suite adversarial --thinking medium
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import sys
import tempfile

ROOT_DIR = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "scripts"))

from eval_lib import live, selfcheck  # noqa: E402
from eval_lib.backends import BACKEND_NAMES, BackendConfigError, create_backend, default_model  # noqa: E402
from eval_lib.classification import CLASSIFY_TEMPLATES, DEFAULT_CLASSIFY_PROMPT  # noqa: E402
from eval_lib.context import OutputDirError, RunContext  # noqa: E402
from eval_lib.reports import build_calibration_report, consolidate_phase1  # noqa: E402

SUITES = ["smoke", "trigger", "held_out", "edge", "deterministic", "phase1",
          "safety", "capability", "adversarial", "calibrate", "phase2"]
THINKING_LEVELS = ["low", "medium", "high"]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Live Satori evals against a pluggable backend (pi, openai, anthropic, mock). Non-destructive.",
    )
    parser.add_argument("--backend", default="pi", choices=list(BACKEND_NAMES),
                        help="Model backend (default: pi). 'mock' is fully offline and needs no API key.")
    parser.add_argument("--suite", default="phase1", choices=SUITES)
    parser.add_argument("--thinking", default="low", choices=THINKING_LEVELS)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--timeout", type=float, default=240.0)
    parser.add_argument("--force", action="store_true", help="Ignore checkpoint cache and rerun everything")
    parser.add_argument("--model", default=None,
                        help="Model id for the backend, e.g. opencode-go/claude-haiku-5-5 for pi "
                             "(default: opencode-go/glm-5.3 for pi, 'mock' for mock; required otherwise)")
    parser.add_argument("--out-dir", default=None,
                        help="Output directory (default: evals/<model-name>/; a temporary directory for mock). "
                             "Must sit under evals/ or outside the repository.")
    parser.add_argument("--skill", default="SKILL.md",
                        help="Skill file sent as the system prompt, relative to the repo root (default: SKILL.md)")
    parser.add_argument("--classify-prompt", default=DEFAULT_CLASSIFY_PROMPT, choices=sorted(CLASSIFY_TEMPLATES),
                        help="Wording of the routing question: v2 (default) defers to the skill file for what each "
                             "rank means; v1 is the 2026-11-20 campaign wording, which restates the ranks itself")
    parser.add_argument("--pi-bin", default=os.environ.get("SATORI_PI_BIN") or "pi",
                        help="pi executable for --backend pi (default: pi, or $SATORI_PI_BIN)")
    parser.add_argument("--fixtures", default=None,
                        help="mock only: recorded replies to replay, a folder in the runner's .cache layout "
                             "(<suite>_<thinking>.jsonl) or a single .jsonl file")
    parser.add_argument("--fixtures-strict", action="store_true",
                        help="mock only: fail a case that has no recorded fixture instead of using a reference reply")
    return parser


def _cli_suffix(args: argparse.Namespace) -> str:
    parts = []
    if args.out_dir:
        parts.append(f"--out-dir {args.out_dir}")
    if args.skill != "SKILL.md":
        parts.append(f"--skill {args.skill}")
    if args.fixtures:
        parts.append(f"--fixtures {args.fixtures}")
    if args.classify_prompt != DEFAULT_CLASSIFY_PROMPT:
        parts.append(f"--classify-prompt {args.classify_prompt}")
    return "".join(f" {p}" for p in parts)


def _print_json(payload: object) -> None:
    print(json.dumps(payload, indent=2, default=str))


def run(args: argparse.Namespace, ctx: RunContext) -> int:
    """Dispatch one suite. Exit codes follow the original harness (0 = gate met)."""
    live_args = (ctx, args.thinking, args.workers, args.timeout, args.force)

    if args.suite == "smoke":
        if ctx.backend.name == "mock":
            return selfcheck.run_mock_smoke(ctx, workers=args.workers, timeout=args.timeout)
        return live.smoke_test(ctx, args.thinking, args.timeout)

    if args.suite == "trigger":
        rep = live.run_trigger_suite_live(*live_args)
        _print_json({k: rep[k] for k in ("overall_accuracy", "strata_accuracy", "status")})
        return 0

    if args.suite == "held_out":
        rep = live.run_held_out_suite_live(*live_args)
        _print_json({k: rep[k] for k in ("overall_accuracy", "strata_accuracy", "status")})
        return 0

    if args.suite == "edge":
        rep = live.run_edge_suite_live(*live_args)
        _print_json({k: rep[k] for k in ("stage1_pass_rate", "mean_stage1_score", "status")})
        return 0

    if args.suite == "deterministic":
        det = live.run_deterministic_suites(ctx)
        _print_json(det)
        return 0 if all(v["status"] == "PASSED" for v in det.values()) else 1

    if args.suite == "safety":
        rep = live.run_safety_suite_live(*live_args)
        _print_json({k: rep[k] for k in ("status", "gates")})
        return 0 if rep["status"] == "CERTIFIED" else 1

    if args.suite == "capability":
        rep = live.run_capability_suite_live(*live_args)
        _print_json({k: rep[k] for k in ("with_skill_pass_rate", "no_skill_pass_rate",
                                          "pass_rate_delta_percentage_points", "status")})
        return 0 if rep["status"] == "PASSED" else 1

    if args.suite == "adversarial":
        rep = live.run_adversarial_suite_live(*live_args)
        _print_json({k: rep[k] for k in ("per_seam", "directional_failures", "miss_count", "status")})
        return 0 if rep["status"] == "PASSED" else 1

    if args.suite == "calibrate":
        text = build_calibration_report(ctx)
        print(f"wrote {ctx.out_dir / ctx.report_name} ({len(text)} chars)")
        return 0

    if args.suite == "phase2":
        safety_rep = live.run_safety_suite_live(*live_args)
        _print_json({"safety": {k: safety_rep[k] for k in ("status", "gates")}})
        cap_rep = live.run_capability_suite_live(*live_args)
        _print_json({"capability": {k: cap_rep[k] for k in ("with_skill_pass_rate", "no_skill_pass_rate",
                                                             "pass_rate_delta_percentage_points", "status")}})
        adv_rep = live.run_adversarial_suite_live(*live_args)
        _print_json({"adversarial": {k: adv_rep[k] for k in ("per_seam", "directional_failures",
                                                              "miss_count", "status")}})
        build_calibration_report(ctx)
        all_ok = (safety_rep["status"] == "CERTIFIED" and cap_rep["status"] == "PASSED"
                  and adv_rep["status"] == "PASSED")
        print(f"PHASE2 {'PASSED' if all_ok else 'PARTIAL/REVIEW'}")
        return 0 if all_ok else 1

    # phase1: trigger + held-out + edge + deterministic suites, consolidated
    trigger = live.run_trigger_suite_live(*live_args)
    held = live.run_held_out_suite_live(*live_args)
    edge = live.run_edge_suite_live(*live_args)
    det = live.run_deterministic_suites(ctx)
    summary = consolidate_phase1(ctx, trigger, held, edge, det, args.thinking)
    _print_json(summary)
    return 0 if summary["phase1_status"] == "PASSED" else 1


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    model = args.model or default_model(args.backend)
    if not model:
        parser.error(f"--backend {args.backend} needs an explicit --model")
    if args.backend != "mock" and (args.fixtures or args.fixtures_strict):
        parser.error("--fixtures and --fixtures-strict only apply to --backend mock")

    skill_path = (ROOT_DIR / args.skill).resolve()
    if not skill_path.is_file():
        parser.error(f"--skill file not found: {skill_path}")

    try:
        backend = create_backend(
            args.backend, model, skill_path=skill_path, pi_bin=args.pi_bin,
            fixtures=pathlib.Path(args.fixtures).resolve() if args.fixtures else None,
            fixtures_strict=args.fixtures_strict,
        )
    except BackendConfigError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    # The mock backend defaults to a throwaway directory so an offline run never dirties the worktree.
    scratch = None
    out_dir = args.out_dir
    if backend.name == "mock" and out_dir is None:
        scratch = tempfile.TemporaryDirectory(prefix="satori-mock-evals-")
        out_dir = scratch.name
        print("[mock] writing to a temporary directory (pass --out-dir to keep the reports)", file=sys.stderr)

    try:
        try:
            ctx = RunContext.create(backend, out_dir, cli_suffix=_cli_suffix(args),
                                    classify_prompt=args.classify_prompt)
        except OutputDirError as exc:
            raise SystemExit(str(exc)) from exc
        ctx.ensure_dirs()
        return run(args, ctx)
    finally:
        if scratch is not None:
            scratch.cleanup()


if __name__ == "__main__":
    sys.exit(main())
