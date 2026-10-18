#!/usr/bin/env python3
"""Satori Release Builder & Per-Agent Skill Mirror Synchronizer (scripts/build_release.py).

1. Reads `version` dynamically from `package.json`.
2. Syncs canonical root `SKILL.md` byte-for-byte into the 4 Category B per-agent
   skill mirror paths (.agents, .cursor, .opencode, .hermes).
3. Updates the SHA-256 integrity digest of `references/SOUL.md` in `openclaw.plugin.json`.
4. Removes legacy tracked `SatoriSkill-v5.zip` if present.
5. Builds a clean Claude.ai web-uploadable zip archive at `dist/SatoriSkill-v{version}.zip`.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
import shutil
import stat
import sys
import zipfile

ROOT_DIR = pathlib.Path(__file__).resolve().parent.parent

MIRROR_SKILL_PATHS = [
    ROOT_DIR / ".agents" / "skills" / "satori" / "SKILL.md",
    ROOT_DIR / ".cursor" / "skills" / "satori" / "SKILL.md",
    ROOT_DIR / ".opencode" / "skills" / "satori" / "SKILL.md",
    ROOT_DIR / ".hermes" / "skills" / "satori" / "SKILL.md",
]

WEB_ZIP_FILES = [
    "SKILL.md",
    "README.md",
    "CHANGELOG.md",
    "PRIVACY.md",
    "LICENSE",
]


def sha256_file(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes().replace(b"\r\n", b"\n")).hexdigest()


def sync_mirrors_and_hashes() -> dict[str, str]:
    canonical_skill = ROOT_DIR / "SKILL.md"
    if not canonical_skill.exists():
        raise FileNotFoundError(f"Canonical SKILL.md not found at {canonical_skill}")

    skill_bytes = canonical_skill.read_bytes()
    for mirror_path in MIRROR_SKILL_PATHS:
        mirror_path.parent.mkdir(parents=True, exist_ok=True)
        mirror_path.write_bytes(skill_bytes)

    soul_path = ROOT_DIR / "references" / "SOUL.md"
    soul_hash = sha256_file(soul_path)

    openclaw_path = ROOT_DIR / "openclaw.plugin.json"
    if openclaw_path.exists():
        data = json.loads(openclaw_path.read_text(encoding="utf-8"))
        data.setdefault("integrity", {})["algorithm"] = "sha256"
        data["integrity"].setdefault("files", {})["references/SOUL.md"] = soul_hash
        openclaw_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

    # Remove legacy tracked SatoriSkill-v5.zip if still present in root
    legacy_zip = ROOT_DIR / "SatoriSkill-v5.zip"
    if legacy_zip.exists():
        legacy_zip.unlink()

    # Auto-install pre-commit hook if .git/hooks exists
    hook_src = ROOT_DIR / "scripts" / "pre-commit"
    hooks_dir = ROOT_DIR / ".git" / "hooks"
    if hook_src.exists() and hooks_dir.exists():
        hook_dst = hooks_dir / "pre-commit"
        shutil.copyfile(hook_src, hook_dst)
        try:
            os.chmod(hook_dst, os.stat(hook_dst).st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
        except OSError:
            pass

    return {
        "skill_sha256": sha256_file(canonical_skill),
        "soul_sha256": soul_hash,
    }


def build_web_zip() -> pathlib.Path:
    pkg_path = ROOT_DIR / "package.json"
    pkg_data = json.loads(pkg_path.read_text(encoding="utf-8"))
    version = pkg_data.get("version", "6.0.0")

    dist_dir = ROOT_DIR / "dist"
    dist_dir.mkdir(parents=True, exist_ok=True)
    zip_path = dist_dir / f"SatoriSkill-v{version}.zip"

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for rel_name in WEB_ZIP_FILES:
            src = ROOT_DIR / rel_name
            if src.exists():
                zf.write(src, arcname=rel_name)

        refs_dir = ROOT_DIR / "references"
        for ref_file in sorted(refs_dir.iterdir()):
            if ref_file.is_file():
                zf.write(ref_file, arcname=f"references/{ref_file.name}")

    # Verify archive integrity
    with zipfile.ZipFile(zip_path, "r") as zf:
        bad_file = zf.testzip()
        if bad_file is not None:
            raise RuntimeError(f"Corrupted file inside zip archive: {bad_file}")
        names = zf.namelist()
        if "SKILL.md" not in names:
            raise RuntimeError("Archive missing root SKILL.md required for Claude.ai web upload")
        if any(n.startswith(".") or n.startswith("evals/") for n in names):
            raise RuntimeError("Archive contains CLI dotfiles or evals that should be excluded from web upload")

    return zip_path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Sync Satori skill mirrors and build Claude.ai web release zip.")
    parser.add_argument("--sync", action="store_true", help="Sync per-agent SKILL.md mirrors and SOUL.md hash")
    parser.parse_args(argv)

    hashes = sync_mirrors_and_hashes()
    zip_path = build_web_zip()

    print(
        json.dumps(
            {
                "status": "built",
                "archive": str(zip_path.relative_to(ROOT_DIR)),
                "size_bytes": zip_path.stat().st_size,
                "synced_mirrors": [str(p.relative_to(ROOT_DIR)) for p in MIRROR_SKILL_PATHS],
                **hashes,
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
