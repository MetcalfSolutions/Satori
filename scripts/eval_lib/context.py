"""Per-run context: which backend, where output goes, how artifacts are named.

Replaces the module-level globals (`MODEL`, `OUT_DIR`, `CACHE_DIR`, `RUN_TAG`,
`REPORT_NAME`) of the original GLM-5.3 harness, so several runs can coexist in
one process (tests do exactly that).
"""

from __future__ import annotations

import dataclasses
import json
import pathlib
import re
from typing import Any

from .backends import DEFAULT_PI_MODEL, Backend
from .paths import EVALS_DIR, ROOT_DIR


class OutputDirError(ValueError):
    """The requested output directory could clobber repository files."""


def resolve_out_dir(model: str, out_dir: str | pathlib.Path | None) -> pathlib.Path:
    """Pick the output directory and refuse any location that could touch release baselines.

    Allowed: a subdirectory of `evals/` (the default is `evals/<model-name>/`), or a
    directory outside the repository (handy for CI and scratch runs). Refused:
    `evals/` itself, where the `*_report.json` baselines live, and any other path
    inside the repository.
    """
    tail = model.split("/")[-1]
    target = pathlib.Path(out_dir).resolve() if out_dir else (EVALS_DIR / tail).resolve()
    evals_root, repo_root = EVALS_DIR.resolve(), ROOT_DIR.resolve()
    inside_evals = evals_root in target.parents
    inside_repo = target == repo_root or repo_root in target.parents
    if target == evals_root or (inside_repo and not inside_evals):
        raise OutputDirError(
            f"--out-dir must be a subdirectory of {EVALS_DIR} or a directory outside the repository, got {target}"
        )
    return target


def derive_run_tag(model: str, out_dir_given: bool) -> str:
    """File-name tag for a run. The original GLM-5.3 artifact names (`*_glm53.json`) are kept."""
    if model == DEFAULT_PI_MODEL and not out_dir_given:
        return "glm53"
    return re.sub(r"[^a-z0-9]+", "_", model.split("/")[-1].lower()).strip("_")


def derive_report_name(model: str) -> str:
    return model.split("/")[-1].upper().replace("-", "_").replace(".", "_") + "_CALIBRATION_REPORT.md"


@dataclasses.dataclass
class RunContext:
    backend: Backend
    out_dir: pathlib.Path
    run_tag: str
    report_name: str
    harness: str = "scripts/run_live_evals.py"
    # Non-default CLI flags of this run (" --out-dir ... --skill ..."), echoed in reproducibility commands.
    cli_suffix: str = ""

    @classmethod
    def create(cls, backend: Backend, out_dir: str | pathlib.Path | None = None,
               cli_suffix: str = "") -> "RunContext":
        return cls(
            backend=backend,
            out_dir=resolve_out_dir(backend.model, out_dir),
            run_tag=derive_run_tag(backend.model, out_dir is not None),
            report_name=derive_report_name(backend.model),
            cli_suffix=cli_suffix,
        )

    @property
    def model(self) -> str:
        return self.backend.model

    @property
    def cache_dir(self) -> pathlib.Path:
        return self.out_dir / ".cache"

    @property
    def skill_path(self) -> pathlib.Path:
        return self.backend.skill_path

    @property
    def out_label(self) -> str:
        """Output directory as shown in reports: repo-relative when inside the repo."""
        try:
            return self.out_dir.resolve().relative_to(ROOT_DIR.resolve()).as_posix()
        except ValueError:
            return str(self.out_dir)

    def provenance(self) -> dict[str, Any]:
        """Fields stamped on every report so its origin is never ambiguous."""
        return {
            "evaluation_mode": self.backend.evaluation_mode,
            "backend": self.backend.name,
            "model": self.model,
            "skill_target": self.backend.skill_label,
        }

    def artifact(self, stem: str) -> pathlib.Path:
        """`<out_dir>/<stem>_<run_tag>.json`."""
        return self.out_dir / f"{stem}_{self.run_tag}.json"

    def ensure_dirs(self) -> None:
        self.out_dir.mkdir(parents=True, exist_ok=True)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def write_json(self, path: pathlib.Path, payload: Any) -> None:
        """Write JSON, refusing any path outside this run's output directory (non-destructive guard)."""
        resolved = path.resolve()
        out_dir = self.out_dir.resolve()
        if out_dir not in resolved.parents and resolved != out_dir:
            raise RuntimeError(f"Refusing to write outside {self.out_dir}: {path}")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    def load_report(self, name: str) -> dict[str, Any] | None:
        path = self.out_dir / name
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
        return None
