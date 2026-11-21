#!/usr/bin/env python3
"""Deprecated entry point: forwards to `scripts/run_live_evals.py --backend pi`.

The GLM-5.3 harness grew into a provider-agnostic runner. This wrapper keeps
every existing command working, with the same flags, defaults, output
directories and artifact names:

    python3 scripts/run_glm53_evals.py --suite phase1 --thinking low
    # is now
    python3 scripts/run_live_evals.py --backend pi --suite phase1 --thinking low

Shared logic (detectors, Stage-1 checks, dataset loaders, report builders) lives
in `scripts/eval_lib/`. Pure helpers that used to be importable from this module
(`parse_classification`, `check_boundary_held`, `wilson_ci`, ...) still resolve
here and emit a `DeprecationWarning`.
"""

from __future__ import annotations

import importlib
import pathlib
import sys
import warnings

SCRIPTS_DIR = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS_DIR))

import run_live_evals  # noqa: E402

_NOTICE = (
    "[deprecated] scripts/run_glm53_evals.py now forwards to scripts/run_live_evals.py --backend pi. "
    "Please call run_live_evals.py directly; this wrapper will be removed in a future release."
)
_HELPER_MODULES = ("eval_lib.detectors", "eval_lib.classification", "eval_lib.routing", "eval_lib.stats",
                   "eval_lib.datasets", "eval_lib.util")
_RENAMED = {"wilson_ci": "wilson_score_interval", "_target_met": "target_met"}


def __getattr__(name: str):
    """Resolve helpers that moved into eval_lib, so old imports keep working."""
    target = _RENAMED.get(name, name)
    for module_name in _HELPER_MODULES:
        module = importlib.import_module(module_name)
        if hasattr(module, target):
            warnings.warn(f"run_glm53_evals.{name} moved to {module_name}.{target}", DeprecationWarning, stacklevel=2)
            return getattr(module, target)
    raise AttributeError(f"module 'run_glm53_evals' has no attribute '{name}'")


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    print(_NOTICE, file=sys.stderr)
    if not any(a == "--backend" or a.startswith("--backend=") for a in args):
        args = ["--backend", "pi", *args]
    return run_live_evals.main(args)


if __name__ == "__main__":
    sys.exit(main())
