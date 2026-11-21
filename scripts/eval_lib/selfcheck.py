"""Offline end-to-end pipeline check for `--backend mock --suite smoke`.

Runs every live suite against the mock backend into the run's output
directory, rebuilds the calibration report, then asserts that the pipeline
produced complete, well-formed artifacts. Zero API keys, zero network.
"""

from __future__ import annotations

import json
import sys
from typing import Any

from . import live
from .context import RunContext
from .datasets import load_dataset
from .reports import build_calibration_report, consolidate_phase1


def run_mock_smoke(ctx: RunContext, workers: int = 4, timeout: float = 240.0) -> int:
    """Exercise the whole pipeline offline. Returns 0 when every invariant holds."""
    problems: list[str] = []

    def expect(condition: bool, message: str) -> None:
        if not condition:
            problems.append(message)

    trigger = live.run_trigger_suite_live(ctx, "low", workers, timeout, False)
    held = live.run_held_out_suite_live(ctx, "low", workers, timeout, False)
    edge = live.run_edge_suite_live(ctx, "low", workers, timeout, False)
    deterministic = live.run_deterministic_suites(ctx)
    summary = consolidate_phase1(ctx, trigger, held, edge, deterministic, "low")
    safety = live.run_safety_suite_live(ctx, "medium", workers, timeout, False)
    capability = live.run_capability_suite_live(ctx, "medium", workers, timeout, False)
    adversarial = live.run_adversarial_suite_live(ctx, "medium", workers, timeout, False)
    markdown = build_calibration_report(ctx)

    # 1. Every suite saw every case and nothing was dropped on the way.
    expect(trigger["total_cases"] == len(load_dataset("trigger")), "trigger: case count mismatch")
    expect(held["total_cases"] == len(load_dataset("held_out")), "held_out: case count mismatch")
    expect(adversarial["total_cases"] == len(load_dataset("adversarial")), "adversarial: case count mismatch")
    expect(edge["total_edge_cases"] == len(load_dataset("edge")), "edge: case count mismatch")
    expect(all(c.get("stage1") for c in edge["cases"]), "edge: a case has no Stage-1 result")
    expect(capability["total_cases"] == len(load_dataset("capability")), "capability: case count mismatch")
    gates = safety["gates"]
    for gate, dataset in (("boundary_probes_gate", "boundary"), ("redteam_injection_gate", "redteam"),
                          ("safety_escalation_gate", "escalation"), ("privacy_probes_gate", "privacy")):
        expect(gates[gate]["total"] == len(load_dataset(dataset)), f"safety: {gate} total mismatch")
    for name, report in (("trigger", trigger), ("held_out", held), ("adversarial", adversarial)):
        expect(report["parse_failures"] == 0, f"{name}: {report['parse_failures']} unparseable routing replies")

    # 2. Every artifact landed on disk, parses, and is stamped as mock output.
    for stem in ("trigger_350", "held_out_50", "edge_12", "phase1_summary", "safety", "capability",
                 "adversarial_seam", "cost", "coexistence", "fault", "loader", "minimal"):
        path = ctx.artifact(stem)
        expect(path.is_file(), f"missing artifact {path.name}")
        if path.is_file():
            try:
                json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                problems.append(f"artifact {path.name} is not valid JSON")
    for name, report in (("trigger", trigger), ("held_out", held), ("edge", edge), ("safety", safety),
                         ("capability", capability), ("adversarial", adversarial)):
        expect(report.get("evaluation_mode") == "mock", f"{name}: report is not stamped evaluation_mode=mock")
    expect((ctx.out_dir / ctx.report_name).is_file() and "Offline Mock Pipeline Report" in markdown,
           "calibration markdown missing or not labelled as mock output")
    expect(all(v["status"] == "PASSED" for v in deterministic.values()), "a deterministic suite did not pass")

    result: dict[str, Any] = {
        "suite": "smoke",
        "backend": ctx.backend.name,
        "evaluation_mode": ctx.backend.evaluation_mode,
        "status": "PASSED" if not problems else "FAILED",
        "trigger_350": {"overall_accuracy": trigger["overall_accuracy"], "status": trigger["status"]},
        "held_out_50": {"overall_accuracy": held["overall_accuracy"], "status": held["status"]},
        "edge_12": {"stage1_pass_rate": edge["stage1_pass_rate"], "status": edge["status"]},
        "safety": {"status": safety["status"],
                   "gates": {k: f"{v['hits']}/{v['total']}" for k, v in gates.items()}},
        "capability": {"delta_points": capability["pass_rate_delta_percentage_points"],
                       "status": capability["status"]},
        "adversarial_44": {"miss_count": adversarial["miss_count"], "status": adversarial["status"]},
        "deterministic_suites": {k: v["status"] for k, v in deterministic.items()},
        "phase1_status": summary["phase1_status"],
        "replies": {"replayed_from_fixtures": getattr(ctx.backend, "replayed", 0),
                    "reference": getattr(ctx.backend, "synthesized", 0)},
        "problems": problems,
    }
    print(json.dumps(result, indent=2))
    print(f"[smoke] mock pipeline {'CLEAN' if not problems else f'{len(problems)} PROBLEMS'}", file=sys.stderr)
    return 0 if not problems else 1
