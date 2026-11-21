"""Tiny shared utilities: timestamps and git revision."""

from __future__ import annotations

import datetime
import subprocess

from .paths import ROOT_DIR


def utcnow_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def git_rev() -> str:
    try:
        out = subprocess.run(["git", "-C", str(ROOT_DIR), "rev-parse", "--short", "HEAD"],
                             capture_output=True, text=True, timeout=10)
        return out.stdout.strip() if out.returncode == 0 else "unknown"
    except Exception:
        return "unknown"
