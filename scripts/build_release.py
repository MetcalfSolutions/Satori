#!/usr/bin/env python3
"""Satori Release Builder & Per-Agent Skill Mirror Synchronizer (scripts/build_release.py) — v6.5.

1. Reads `version` dynamically from `package.json`.
2. Syncs canonical root `SKILL.md` byte-for-byte into the Category B per-agent
   skill mirror paths (.agents, .cursor, .opencode, .hermes).
3. Updates the SHA-256 integrity digest of `references/SOUL.md` in `openclaw.plugin.json`.
4. Normalizes all line endings to LF (`\n`) for cross-platform archive determinism.
5. Builds clean Claude.ai web-uploadable zip archives:
   - `dist/SatoriSkill-Full-v{version}.zip`: Complete Full edition with all reference shards
   - `dist/SatoriSkill-Compact-v{version}.zip`: Self-contained Compact edition (<=7,800 chars)
   - `dist/SatoriSkill-v{version}.zip`: Backward-compatible alias for automated tools
6. Executes `scripts/validate_skill.py` to ensure all verification checks pass before finishing.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
import shutil
import stat
import subprocess
import sys
import zipfile

ROOT_DIR = pathlib.Path(__file__).resolve().parent.parent

MIRROR_SKILL_PATHS = [
    ROOT_DIR / ".agents" / "skills" / "satori" / "SKILL.md",
    ROOT_DIR / ".cursor" / "skills" / "satori" / "SKILL.md",
    ROOT_DIR / ".opencode" / "skills" / "satori" / "SKILL.md",
    ROOT_DIR / ".hermes" / "skills" / "satori" / "SKILL.md",
]

FULL_ZIP_FILES = [
    "SKILL.md",
    "README.md",
    "CHANGELOG.md",
    "PRIVACY.md",
    "SAFETY.md",
    "NOTICE.md",
    "LICENSE.md",
]

COMPACT_ZIP_FILES = [
    ("compact/SKILL.md", "SKILL.md"),
    ("references/core-compact.md", "references/core-compact.md"),
    ("README.md", "README.md"),
    ("PRIVACY.md", "PRIVACY.md"),
    ("SAFETY.md", "SAFETY.md"),
    ("LICENSE.md", "LICENSE.md"),
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


def build_full_zip() -> tuple[pathlib.Path, pathlib.Path]:
    pkg_path = ROOT_DIR / "package.json"
    pkg_data = json.loads(pkg_path.read_text(encoding="utf-8"))
    version = pkg_data.get("version", "6.5.0")

    dist_dir = ROOT_DIR / "dist"
    dist_dir.mkdir(parents=True, exist_ok=True)
    full_zip_path = dist_dir / f"SatoriSkill-Full-v{version}.zip"
    compat_zip_path = dist_dir / f"SatoriSkill-v{version}.zip"

    for target_zip in (full_zip_path, compat_zip_path):
        with zipfile.ZipFile(target_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for rel_name in FULL_ZIP_FILES:
                src = ROOT_DIR / rel_name
                if src.exists():
                    content = src.read_bytes().replace(b"\r\n", b"\n")
                    zf.writestr(rel_name, content)

            refs_dir = ROOT_DIR / "references"
            for ref_file in sorted(refs_dir.iterdir()):
                if ref_file.is_file():
                    content = ref_file.read_bytes().replace(b"\r\n", b"\n")
                    zf.writestr(f"references/{ref_file.name}", content)

        # Verify archive integrity
        with zipfile.ZipFile(target_zip, "r") as zf:
            bad_file = zf.testzip()
            if bad_file is not None:
                raise RuntimeError(f"Corrupted file inside zip archive: {bad_file}")
            names = zf.namelist()
            if "SKILL.md" not in names:
                raise RuntimeError("Archive missing root SKILL.md required for Claude.ai web upload")
            if any(n.startswith(".") or n.startswith("evals/") for n in names):
                raise RuntimeError("Archive contains CLI dotfiles or evals that should be excluded from web upload")

    return full_zip_path, compat_zip_path


def build_compact_zip() -> pathlib.Path:
    pkg_path = ROOT_DIR / "package.json"
    pkg_data = json.loads(pkg_path.read_text(encoding="utf-8"))
    version = pkg_data.get("version", "6.5.0")

    dist_dir = ROOT_DIR / "dist"
    dist_dir.mkdir(parents=True, exist_ok=True)
    compact_zip_path = dist_dir / f"SatoriSkill-Compact-v{version}.zip"

    with zipfile.ZipFile(compact_zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for src_rel, arc_name in COMPACT_ZIP_FILES:
            src = ROOT_DIR / src_rel
            if src.exists():
                content = src.read_bytes().replace(b"\r\n", b"\n")
                zf.writestr(arc_name, content)

    # Verify archive integrity
    with zipfile.ZipFile(compact_zip_path, "r") as zf:
        bad_file = zf.testzip()
        if bad_file is not None:
            raise RuntimeError(f"Corrupted file inside compact zip archive: {bad_file}")
        names = zf.namelist()
        if "SKILL.md" not in names:
            raise RuntimeError("Compact archive missing root SKILL.md")
        if any(n.startswith(".") or n.startswith("evals/") for n in names):
            raise RuntimeError("Compact archive contains CLI dotfiles or evals that should be excluded")

    return compact_zip_path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Sync Satori skill mirrors and build release packages.")
    parser.add_argument("--sync", action="store_true", help="Sync per-agent SKILL.md mirrors and SOUL.md hash")
    parser.parse_args(argv)

    hashes = sync_mirrors_and_hashes()
    full_zip, compat_zip = build_full_zip()
    compact_zip = build_compact_zip()

    # Validate skill build
    validate_script = ROOT_DIR / "scripts" / "validate_skill.py"
    if validate_script.exists():
        proc = subprocess.run([sys.executable, str(validate_script)], capture_output=True, text=True)
        if proc.returncode != 0:
            sys.stderr.write(f"Validation failed after build:\n{proc.stderr or proc.stdout}\n")
            return 1

    print(
        json.dumps(
            {
                "status": "built",
                "archive_full": str(full_zip.relative_to(ROOT_DIR)),
                "archive_compact": str(compact_zip.relative_to(ROOT_DIR)),
                "compat_archive": str(compat_zip.relative_to(ROOT_DIR)),
                "size_bytes_full": full_zip.stat().st_size,
                "size_bytes_compact": compact_zip.stat().st_size,
                "synced_mirrors": [str(p.relative_to(ROOT_DIR)) for p in MIRROR_SKILL_PATHS],
                **hashes,
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
