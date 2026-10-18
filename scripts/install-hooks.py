#!/usr/bin/env python3
"""Cross-platform Git pre-commit hook installer for Satori (scripts/install-hooks.py)."""

from __future__ import annotations

import os
import pathlib
import shutil
import stat
import sys

ROOT_DIR = pathlib.Path(__file__).resolve().parent.parent


def install_pre_commit_hook() -> pathlib.Path | None:
    src = ROOT_DIR / "scripts" / "pre-commit"
    hooks_dir = ROOT_DIR / ".git" / "hooks"
    if not src.exists() or not hooks_dir.exists():
        return None
    dst = hooks_dir / "pre-commit"
    shutil.copyfile(src, dst)
    try:
        os.chmod(dst, os.stat(dst).st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    except OSError:
        pass
    return dst


def main() -> int:
    dst = install_pre_commit_hook()
    if dst is None:
        print("Skipped: .git/hooks or scripts/pre-commit not found.", file=sys.stderr)
        return 1
    print(f"Installed Satori pre-commit hook -> {dst.relative_to(ROOT_DIR)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
