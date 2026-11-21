"""Shared pytest setup for the offline eval tests.

Everything here runs with zero API keys and zero network access. Tests write
only into pytest's temporary directories, never into `evals/`.
"""

from __future__ import annotations

import json
import pathlib
import subprocess
import sys

import pytest

ROOT_DIR = pathlib.Path(__file__).resolve().parent.parent
SCRIPTS_DIR = ROOT_DIR / "scripts"
FIXTURES_DIR = pathlib.Path(__file__).resolve().parent / "fixtures"

if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))


def load_fixture(name: str) -> dict:
    return json.loads((FIXTURES_DIR / name).read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def safety_flags() -> list[dict]:
    """Detector-flagged replies from the live campaign (frozen copy, see tests/fixtures/README.md)."""
    return load_fixture("live_safety_flags.json")["flags"]


@pytest.fixture(scope="session")
def edge_replies() -> list[dict]:
    """Full mixed_intent replies from the live edge runs (frozen copy)."""
    return load_fixture("live_edge_mixed_intent.json")["cases"]


@pytest.fixture()
def no_retry_sleep(monkeypatch):
    """Failed calls are retried after a pause in production; tests do not wait."""
    from eval_lib import live

    monkeypatch.setattr(live, "RETRY_SLEEP_S", 0.0)


@pytest.fixture()
def evals_untouched():
    """Fail the test if anything under evals/ (the release evidence) changed while it ran."""

    def snapshot() -> str:
        return subprocess.run(["git", "-C", str(ROOT_DIR), "status", "--porcelain", "--", "evals"],
                              capture_output=True, text=True).stdout

    before = snapshot()
    yield
    assert snapshot() == before, "a test modified files under evals/"
