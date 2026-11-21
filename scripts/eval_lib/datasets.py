"""Dataset registry and loaders for every benchmark file under `evals/`.

One place knows which file backs which suite and which fields a row must
carry, so a malformed benchmark row fails loudly at load time (with the file
name and line number) instead of surfacing as a `KeyError` halfway through a
live run.
"""

from __future__ import annotations

import json
import pathlib
from typing import Any

from .paths import EVALS_DIR

# name -> (file name under evals/, fields every row must contain)
DATASETS: dict[str, tuple[str, tuple[str, ...]]] = {
    "trigger": ("trigger_boundary_350.jsonl", ("id", "stratum", "expected", "prompt")),
    "trigger_legacy": ("trigger_boundary.jsonl", ("id", "stratum", "expected", "prompt")),
    "held_out": ("held_out_benchmark.jsonl", ("id", "stratum", "expected", "prompt")),
    "adversarial": ("adversarial_precedence_seam.jsonl", ("id", "seam", "expected", "prompt")),
    "boundary": ("boundary_probes_48.jsonl", ("id", "category", "framing", "expected_action", "prompt")),
    "redteam": ("redteam_injection_30.jsonl", ("id", "category", "attack_type", "safety_violation_allowed", "prompt")),
    "escalation": ("safety_escalation_8.jsonl", ("id", "scenario", "turns")),
    "privacy": ("privacy_probes_10.jsonl", ("id", "type", "expected_behavior", "prompt")),
    "capability": ("cases.jsonl", ("id", "category", "register", "prompt")),
    "gold_anchors": ("gold_anchors.jsonl", ("id", "case_id", "tier", "gold_response", "slop_decoy")),
    "edge": ("edge_inputs_12.jsonl", ("id", "category", "expected_handling", "prompt")),
    "judge_calibration": ("judge_calibration_50_pairs.jsonl", ("id",)),
}


def load_jsonl(path: pathlib.Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def dataset_path(name: str) -> pathlib.Path:
    """Resolve a registered dataset name to its file under `evals/`."""
    if name not in DATASETS:
        raise KeyError(f"Unknown dataset '{name}'. Known datasets: {', '.join(sorted(DATASETS))}")
    return EVALS_DIR / DATASETS[name][0]


def trigger_benchmark_path() -> pathlib.Path:
    """The 350-case trigger benchmark, falling back to the legacy 50-case file."""
    primary = dataset_path("trigger")
    return primary if primary.exists() else dataset_path("trigger_legacy")


def load_dataset(name: str, path: pathlib.Path | None = None) -> list[dict[str, Any]]:
    """Load a registered dataset and check that every row carries its required fields."""
    required = DATASETS[name][1] if name in DATASETS else ()
    target = path or dataset_path(name)
    rows: list[dict[str, Any]] = []
    for line_no, line in enumerate(target.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"{target.name}:{line_no}: invalid JSON ({exc.msg})") from exc
        if not isinstance(row, dict):
            raise ValueError(f"{target.name}:{line_no}: expected a JSON object, got {type(row).__name__}")
        missing = [field for field in required if field not in row]
        if missing:
            raise ValueError(f"{target.name}:{line_no}: missing required field(s) {missing}")
        rows.append(row)
    return rows
