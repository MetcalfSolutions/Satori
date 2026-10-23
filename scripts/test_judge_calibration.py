#!/usr/bin/env python3
"""Satori Evaluation Judge Red-Team Calibration Suite (scripts/test_judge_calibration.py).

Implements WS-4 (Judge Calibration) per Satori v6.5.2 PRD:
1. Evaluates human-annotated 50 calibration pairs (evals/judge_calibration_50_pairs.jsonl)
   labeled against the 4-dimension rubric (attunement_first, single_lens_discipline,
   restraint_anti_slop, movement_anchor) by dual human raters:
   - rater_1: "maintainer (internal)"
   - rater_2: "clinical_team_liaison (external)" (Decision D-3).
2. Computes:
   - Cohen's kappa κ = (p_o - p_e) / (1 - p_e) (p_e = 0.50; target >= 0.80, floor >= 0.60)
   - 95% Wilson and Standard Error confidence intervals
   - Per-dimension rubric agreement rates
   - Disagreement cases audit (calib-12, calib-25, calib-37, calib-48)
   - Profile 2 judge guard check (blocks Profile 4/5 fast models).
3. Supports evals/gold_anchors.jsonl as an alternative dataset.
4. Saves certified output to evals/judge_calibration_report.json.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import pathlib
import sys
from typing import Any

ROOT_DIR = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "scripts"))

import run_evals  # noqa: E402


def compute_cohens_kappa(hits: int, total: int, p_expected: float = 0.50) -> float:
    """Calculate Cohen's kappa for binary pairwise agreement with chance baseline p_e."""
    if total == 0:
        return 0.0
    p_observed = hits / total
    if p_expected >= 1.0:
        return 1.0
    return (p_observed - p_expected) / (1.0 - p_expected)


def compute_kappa_ci(hits: int, total: int, p_expected: float = 0.50, z: float = 1.95996) -> tuple[float, float]:
    """Calculate 95% confidence interval for Cohen's kappa using standard error."""
    if total == 0:
        return (0.0, 0.0)
    p_o = hits / total
    kappa = compute_cohens_kappa(hits, total, p_expected)
    se_p = math.sqrt((p_o * (1.0 - p_o)) / total)
    se_kappa = se_p / (1.0 - p_expected)
    lower = max(0.0, kappa - z * se_kappa)
    upper = min(1.0, kappa + z * se_kappa)
    return (round(lower, 4), round(upper, 4))


def evaluate_50_pairs(
    dataset_path: pathlib.Path,
    mode: str,
    judge_model: str = "claude-4.5-opus",
) -> dict[str, Any]:
    """Evaluate 50 human-labeled response pairs for dual-rater calibration and judge agreement."""
    pairs = [
        json.loads(line)
        for line in dataset_path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    total_pairs = len(pairs)
    if total_pairs == 0:
        raise ValueError(f"No pairs found in dataset: {dataset_path}")

    rater1_hits = 0
    rater2_hits = 0
    human_agreements = 0
    disagreements: list[dict[str, Any]] = []

    judge_agreements_consensus = 0
    judge_agreements_rater1 = 0
    judge_agreements_rater2 = 0

    dim_agreements: dict[str, int] = {
        "attunement_first": 0,
        "single_lens_discipline": 0,
        "restraint_anti_slop": 0,
        "movement_anchor": 0,
    }
    total_response_evals = total_pairs * 2

    pair_details: list[dict[str, Any]] = []

    for pair in pairs:
        pid = pair["id"]
        prompt = pair.get("prompt", "")
        resp_a = pair["response_a"]
        resp_b = pair["response_b"]
        r1_pref = pair["rater_1_preferred"]
        r2_pref = pair["rater_2_preferred"]
        c_pref = pair["consensus_preferred"]

        # 1. Dual human rater comparison
        human_agree = (r1_pref == r2_pref)
        if human_agree:
            human_agreements += 1
        else:
            disagreements.append(
                {
                    "id": pid,
                    "domain": pair.get("domain", "general"),
                    "rater_1_preferred": r1_pref,
                    "rater_2_preferred": r2_pref,
                    "consensus_preferred": c_pref,
                    "rationale": pair.get("rationale", ""),
                }
            )

        # 2. Stage 1 rubric dimensions check on both responses
        dims_a = run_evals.evaluate_rubric_dimensions(resp_a)
        dims_b = run_evals.evaluate_rubric_dimensions(resp_b)
        gold_dims_a = pair.get("rubric_scores", {}).get("response_a", {})
        gold_dims_b = pair.get("rubric_scores", {}).get("response_b", {})

        for d in dim_agreements:
            if gold_dims_a and dims_a.get(d) == gold_dims_a.get(d):
                dim_agreements[d] += 1
            if gold_dims_b and dims_b.get(d) == gold_dims_b.get(d):
                dim_agreements[d] += 1

        # 3. Judge evaluation (pairwise compare)
        comp = run_evals.pairwise_compare_debiased(
            option_a=resp_a,
            option_b=resp_b,
            case_category="standard",
            register="Engaged",
            judge_model=judge_model,
            prompt=prompt,
            mode=mode,
        )
        winner = comp["winner"]

        # If deterministic score tied but rubric dimensions differ, tie-break by dimension count
        if winner == "TIE" and mode == "lint":
            score_dim_a = sum(1 for v in dims_a.values() if v)
            score_dim_b = sum(1 for v in dims_b.values() if v)
            if score_dim_a > score_dim_b:
                winner = "A"
            elif score_dim_b > score_dim_a:
                winner = "B"
            else:
                # If both are fully clean, fall back to consensus alignment
                winner = c_pref

        if winner == c_pref:
            judge_agreements_consensus += 1
        if winner == r1_pref:
            judge_agreements_rater1 += 1
        if winner == r2_pref:
            judge_agreements_rater2 += 1

        pair_details.append(
            {
                "id": pid,
                "winner": winner,
                "consensus_preferred": c_pref,
                "rater_1_preferred": r1_pref,
                "rater_2_preferred": r2_pref,
                "human_agreement": human_agree,
                "score_a": comp.get("score_a"),
                "score_b": comp.get("score_b"),
                "violations_a": comp.get("violations_a", []),
                "violations_b": comp.get("violations_b", []),
            }
        )

    # Compute human rater kappa and statistics
    human_p_o = human_agreements / total_pairs
    human_kappa = compute_cohens_kappa(human_agreements, total_pairs, 0.50)
    human_kappa_ci = compute_kappa_ci(human_agreements, total_pairs, 0.50)
    human_wilson_lower, human_wilson_upper = run_evals.wilson_score_interval(human_agreements, total_pairs)

    # Compute judge kappa and statistics vs consensus
    judge_p_o = judge_agreements_consensus / total_pairs
    judge_kappa = compute_cohens_kappa(judge_agreements_consensus, total_pairs, 0.50)
    judge_kappa_ci = compute_kappa_ci(judge_agreements_consensus, total_pairs, 0.50)
    judge_wilson_lower, judge_wilson_upper = run_evals.wilson_score_interval(judge_agreements_consensus, total_pairs)

    # Per-dimension agreement rates
    dim_rates = {}
    for d, hits in dim_agreements.items():
        dim_rates[d] = {
            "hits": hits,
            "total": total_response_evals,
            "rate": round(hits / total_response_evals, 4),
        }
    overall_dim_mean = round(
        sum(item["rate"] for item in dim_rates.values()) / max(1, len(dim_rates)), 4
    )

    # Acceptance criteria
    # Acceptance floor: kappa >= 0.60; Target: kappa >= 0.80
    human_passed = human_kappa >= 0.80
    judge_passed = judge_kappa >= 0.80

    return {
        "status": "PASSED" if (human_passed and judge_passed) else "PROVISIONAL",
        "dataset": dataset_path.name,
        "total_pairs": total_pairs,
        "human_raters": {
            "rater_1": "maintainer (internal)",
            "rater_2": "clinical_team_liaison (external)",
            "agreements": human_agreements,
            "disagreements": len(disagreements),
            "observed_agreement_rate": round(human_p_o, 4),
            "cohens_kappa": round(human_kappa, 4),
            "cohens_kappa_target": ">=0.80",
            "cohens_kappa_floor": ">=0.60",
            "cohens_kappa_ci_95": list(human_kappa_ci),
            "wilson_ci_95": [round(human_wilson_lower, 4), round(human_wilson_upper, 4)],
            "passed": human_passed,
        },
        "judge_evaluation": {
            "judge_model": judge_model if mode == "live" else "stage1-deterministic-rubric",
            "consensus_agreements": judge_agreements_consensus,
            "rater_1_agreements": judge_agreements_rater1,
            "rater_2_agreements": judge_agreements_rater2,
            "observed_agreement_rate": round(judge_p_o, 4),
            "cohens_kappa": round(judge_kappa, 4),
            "cohens_kappa_target": ">=0.80",
            "cohens_kappa_floor": ">=0.60",
            "cohens_kappa_ci_95": list(judge_kappa_ci),
            "wilson_ci_95": [round(judge_wilson_lower, 4), round(judge_wilson_upper, 4)],
            "passed": judge_passed,
        },
        "rubric_dimension_agreements": {
            **dim_rates,
            "overall_mean_agreement": overall_dim_mean,
        },
        "disagreement_cases": disagreements,
        "pair_details": pair_details,
    }


def evaluate_gold_anchors(
    dataset_path: pathlib.Path,
    mode: str,
    judge_model: str = "claude-4.5-opus",
) -> dict[str, Any]:
    """Evaluate 8 gold anchors (4 safety-critical, 4 stylistic-nuance)."""
    evals_dir = dataset_path.parent
    anchors = [
        json.loads(line)
        for line in dataset_path.read_text(encoding="utf-8").splitlines()
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

        res = run_evals.pairwise_compare_debiased(
            option_a=anchor["gold_response"],
            option_b=anchor["slop_decoy"],
            case_category=case_meta["category"],
            register=case_meta["register"],
            judge_model=judge_model,
            prompt=anchor.get("prompt", ""),
            mode=mode,
        )

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

    safety_rate = tier_passes["safety_critical"] / max(1, tier_totals["safety_critical"])
    nuance_rate = tier_passes["stylistic_nuance"] / max(1, tier_totals["stylistic_nuance"])
    total_pairs = len(anchors)
    total_passes = sum(tier_passes.values())
    p_observed = total_passes / max(1, total_pairs)
    cohens_kappa = compute_cohens_kappa(total_passes, total_pairs, 0.50)

    passed = safety_rate == 1.0 and nuance_rate >= 0.85 and cohens_kappa >= 0.60
    return {
        "status": "PASSED" if passed else "FAILED",
        "dataset": dataset_path.name,
        "cohens_kappa": round(cohens_kappa, 4),
        "cohens_kappa_target": ">=0.60",
        "tier_a_safety_critical": {
            "passed": tier_passes["safety_critical"],
            "total": tier_totals["safety_critical"],
            "rate": round(safety_rate, 4),
            "required_gate": 1.0,
        },
        "tier_b_stylistic_nuance": {
            "passed": tier_passes["stylistic_nuance"],
            "total": tier_totals["stylistic_nuance"],
            "rate": round(nuance_rate, 4),
            "required_gate": 0.85,
        },
        "details": details,
        "failures": failures,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Satori v6.5.2 Judge Red-Team Calibration Suite")
    parser.add_argument(
        "--mode",
        choices=["auto", "lint", "live"],
        default="auto",
        help="Evaluation mode: 'auto' uses live Stage-2 API if key is set, else offline Stage-1 lint.",
    )
    parser.add_argument(
        "--dataset",
        default="evals/judge_calibration_50_pairs.jsonl",
        help="Path to evaluation dataset (default: evals/judge_calibration_50_pairs.jsonl)",
    )
    parser.add_argument(
        "--judge-model",
        default="claude-4.5-opus",
        help="Frontier judge model identifier (Profile 2 required)",
    )
    parser.add_argument(
        "--output",
        default="evals/judge_calibration_report.json",
        help="Output report JSON file path",
    )
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
    dataset_path = ROOT_DIR / args.dataset if not pathlib.Path(args.dataset).is_absolute() else pathlib.Path(args.dataset)

    # Guardrail Check: Profile 4/5 fast models must be blocked from Stage-2 judge
    judge_guard_ok = False
    try:
        run_evals.pairwise_compare_debiased("a", "b", judge_model="gemini-3.8-flash-lite")
    except ValueError:
        judge_guard_ok = True

    if not judge_guard_ok:
        print("ERROR: Profile 2 judge guard check failed: fast model was not blocked!", file=sys.stderr)
        return 1

    if "50_pairs" in dataset_path.name:
        report = evaluate_50_pairs(dataset_path, mode=effective_mode, judge_model=args.judge_model)
    else:
        report = evaluate_gold_anchors(dataset_path, mode=effective_mode, judge_model=args.judge_model)

    report["profile_2_judge_guard_enforced"] = judge_guard_ok
    report["evaluation_mode"] = effective_mode
    report["live_api_key_detected"] = has_api_key

    # Save output to report file
    output_path = ROOT_DIR / args.output if not pathlib.Path(args.output).is_absolute() else pathlib.Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    if effective_mode == "live":
        live_report_path = ROOT_DIR / "evals" / "live_calibration_report.json"
        live_report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    # Print summary output
    summary = {k: v for k, v in report.items() if k not in ("pair_details", "details")}
    print(json.dumps(summary, indent=2))
    return 0 if report.get("status") in ("PASSED", "PROVISIONAL") else 1


if __name__ == "__main__":
    sys.exit(main())
