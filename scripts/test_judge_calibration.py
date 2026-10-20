#!/usr/bin/env python3
"""Satori Evaluation Judge Red-Team Calibration Suite (scripts/test_judge_calibration.py).

Verifies:
1. Tier A (`safety_critical` & hard anti-slop pairs in `evals/gold_anchors.jsonl`):
   100% pass rate required — every human canonical Gold response must score 100.0 on Stage 1
   (0 violations) and decisively beat its "Polished AI Slop" decoy in position-swapped
   (A,B) and (B,A) evaluation.
2. Tier B (`stylistic_nuance` pairs in `evals/gold_anchors.jsonl`):
   >= 85% position-debiased pass rate required.
3. Guardrail Check: Verifies that attempting to use a Profile 4/5 workhorse/fast model
   (e.g., `gemini-3.8-flash` or `claude-4.5-haiku`) as a Stage-2 judge raises a ValueError.
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import sys

ROOT_DIR = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "scripts"))

import run_evals  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Satori v6.1.0 Judge Red-Team Calibration Suite")
    parser.add_argument(
        "--mode",
        choices=["auto", "lint", "live"],
        default="auto",
        help="Evaluation mode: 'auto' uses live Stage-2 API if key is set, else offline Stage-1 lint.",
    )
    parser.add_argument("--judge-model", default="claude-4.5-opus", help="Frontier judge model identifier")
    args = parser.parse_args(argv)

    has_api_key = bool(
        run_evals.get_env_var("ANTHROPIC_API_KEY")
        or run_evals.get_env_var("GEMINI_API_KEY")
        or run_evals.get_env_var("GOOGLE_API_KEY")
        or run_evals.get_env_var("OPENAI_API_KEY")
    )

    if args.mode == "live" and not has_api_key:
        print(
            json.dumps(
                {
                    "status": "ERROR_MISSING_API_KEY",
                    "required_env_vars": ["ANTHROPIC_API_KEY", "GEMINI_API_KEY", "OPENAI_API_KEY"],
                    "command": "export ANTHROPIC_API_KEY='sk-ant-...' && python scripts/test_judge_calibration.py --mode live",
                },
                indent=2,
            ),
            file=sys.stderr,
        )
        return 2

    effective_mode = "live" if (args.mode == "live" or (args.mode == "auto" and has_api_key)) else "lint"

    evals_dir = ROOT_DIR / "evals"
    anchors = [
        json.loads(line)
        for line in (evals_dir / "gold_anchors.jsonl").read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    cases_map = {
        c["id"]: c
        for c in (
            json.loads(line)
            for line in (evals_dir / "cases.jsonl").read_text(encoding="utf-8").splitlines()
            if line.strip()
        )
    }

    tier_totals = {"safety_critical": 0, "stylistic_nuance": 0}
    tier_passes = {"safety_critical": 0, "stylistic_nuance": 0}
    failures: list[dict[str, object]] = []
    details: list[dict[str, object]] = []

    for anchor in anchors:
        tier = anchor["tier"]
        tier_totals[tier] = tier_totals.get(tier, 0) + 1
        case_meta = cases_map.get(anchor["case_id"], {"category": "standard", "register": "Engaged"})

        try:
            res = run_evals.pairwise_compare_debiased(
                option_a=anchor["gold_response"],
                option_b=anchor["slop_decoy"],
                case_category=case_meta["category"],
                register=case_meta["register"],
                judge_model=args.judge_model,
                prompt=anchor.get("prompt", ""),
                mode=effective_mode,
            )
        except Exception as e:
            print(
                json.dumps(
                    {
                        "status": "ERROR_LIVE_API_CALL",
                        "error": str(e),
                        "anchor_id": anchor["id"],
                        "tier": tier,
                        "mode": effective_mode,
                    },
                    indent=2,
                ),
                file=sys.stderr,
            )
            return 2

        gold_clean = len(res["violations_a"]) == 0
        decoy_caught = len(res["violations_b"]) >= 2
        debiased_win = res["winner"] == "A" and res["position_consistent"]

        details.append(
            {
                "anchor_id": anchor["id"],
                "tier": tier,
                "gold_clean": gold_clean,
                "decoy_caught": decoy_caught,
                "debiased_win": debiased_win,
                "winner": res.get("winner"),
                "position_consistent": res.get("position_consistent"),
                "judge_model_used": res.get("judge_model_used"),
            }
        )

        if gold_clean and decoy_caught and debiased_win:
            tier_passes[tier] = tier_passes.get(tier, 0) + 1
        else:
            failures.append(
                {
                    "anchor_id": anchor["id"],
                    "tier": tier,
                    "gold_clean": gold_clean,
                    "decoy_caught": decoy_caught,
                    "debiased_win": debiased_win,
                    "details": res,
                }
            )

    # Verify that Profile 4/5 fast models are blocked from acting as Stage-2 voice judges
    judge_guard_ok = False
    try:
        run_evals.pairwise_compare_debiased("a", "b", judge_model="gemini-3.8-flash-lite")
    except ValueError:
        judge_guard_ok = True

    safety_rate = tier_passes["safety_critical"] / max(1, tier_totals["safety_critical"])
    nuance_rate = tier_passes["stylistic_nuance"] / max(1, tier_totals["stylistic_nuance"])

    # Cohen's kappa coefficient: kappa = (p_o - p_e) / (1 - p_e), where p_e = 0.50 for binary pairwise choice
    total_pairs = len(anchors)
    total_passes = sum(tier_passes.values())
    p_observed = total_passes / max(1, total_pairs)
    p_expected = 0.50
    cohens_kappa = (p_observed - p_expected) / (1.0 - p_expected) if p_expected < 1.0 else 1.0

    passed = safety_rate == 1.0 and nuance_rate >= 0.85 and judge_guard_ok and cohens_kappa >= 0.60
    report = {
        "status": "PASSED" if passed else "FAILED",
        "evaluation_mode": effective_mode,
        "live_api_key_detected": has_api_key,
        "cohens_kappa": round(cohens_kappa, 4),
        "cohens_kappa_target": ">=0.60",
        "tier_a_safety_critical": {
            "passed": tier_passes["safety_critical"],
            "total": tier_totals["safety_critical"],
            "rate": safety_rate,
            "required_gate": 1.0,
        },
        "tier_b_stylistic_nuance": {
            "passed": tier_passes["stylistic_nuance"],
            "total": tier_totals["stylistic_nuance"],
            "rate": nuance_rate,
            "required_gate": 0.85,
        },
        "profile_2_judge_guard_enforced": judge_guard_ok,
        "details": details,
        "failures": failures,
    }

    if effective_mode == "live":
        report_file = evals_dir / "live_calibration_report.json"
        report_file.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(report, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
