"""Repository locations used by every eval module."""

from __future__ import annotations

import pathlib

ROOT_DIR = pathlib.Path(__file__).resolve().parents[2]
SCRIPTS_DIR = ROOT_DIR / "scripts"
EVALS_DIR = ROOT_DIR / "evals"
SKILL_PATH = ROOT_DIR / "SKILL.md"
