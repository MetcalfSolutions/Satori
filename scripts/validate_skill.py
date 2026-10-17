#!/usr/bin/env python3
"""Satori Build-Time Static Validator (scripts/validate_skill.py).

Verifies:
1. Canonical SKILL.md YAML frontmatter compliance (name <=64, description <=1024,
   explicit negative coding triggers + hybrid routing, no "When in doubt, activate").
2. File size budgets (SKILL.md <8 KB, core-compact.md <12 KB, clinical-spine.md <24,000 bytes
   per Antigravity's docs/rules.md cap).
3. Category A Pointer Stubs (AGENTS.md, GEMINI.md, CLAUDE.md, .cursor/rules/satori.mdc,
   .windsurf/rules/satori.md, .opencode/command/satori.md) are strictly <=15 lines with zero tables.
4. Category B Per-Agent Skill Mirrors (.agents, .cursor, .opencode, .hermes) match canonical
   root SKILL.md byte-for-byte via SHA-256.
5. Primary-Source Crisis Table Verification against references/crisis-sources.json across
   SKILL.md, references/clinical-spine.md, and references/core-compact.md.
6. Relative Markdown link integrity, .gitignore protection for .satori/, and SOUL.md SHA-256
   verification in openclaw.plugin.json.
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import re
import sys

ROOT_DIR = pathlib.Path(__file__).resolve().parent.parent

CATEGORY_A_POINTER_STUBS = [
    ROOT_DIR / "AGENTS.md",
    ROOT_DIR / "GEMINI.md",
    ROOT_DIR / "CLAUDE.md",
    ROOT_DIR / ".cursor" / "rules" / "satori.mdc",
    ROOT_DIR / ".windsurf" / "rules" / "satori.md",
    ROOT_DIR / ".opencode" / "command" / "satori.md",
]

CATEGORY_B_SKILL_MIRRORS = [
    ROOT_DIR / ".agents" / "skills" / "satori" / "SKILL.md",
    ROOT_DIR / ".cursor" / "skills" / "satori" / "SKILL.md",
    ROOT_DIR / ".opencode" / "skills" / "satori" / "SKILL.md",
    ROOT_DIR / ".hermes" / "skills" / "satori" / "SKILL.md",
]

CRISIS_DOC_TARGETS = [
    ROOT_DIR / "SKILL.md",
    ROOT_DIR / "references" / "clinical-spine.md",
    ROOT_DIR / "references" / "core-compact.md",
]

LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


def sha256_file(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---\n"):
        raise ValueError("Missing opening YAML frontmatter delimiter '---'")
    end_idx = text.find("\n---\n", 4)
    if end_idx == -1:
        raise ValueError("Missing closing YAML frontmatter delimiter '---'")
    block = text[4:end_idx]
    result: dict[str, str] = {}
    for line in block.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            result[k.strip()] = v.strip()
    return result


def main() -> int:
    errors: list[str] = []
    checks_passed = 0

    # 1. Validate canonical SKILL.md frontmatter and trigger boundaries
    skill_path = ROOT_DIR / "SKILL.md"
    if not skill_path.exists():
        errors.append("Missing canonical SKILL.md")
    else:
        skill_text = skill_path.read_text(encoding="utf-8")
        try:
            fm = parse_frontmatter(skill_text)
            name = fm.get("name", "")
            desc = fm.get("description", "")
            if not name or len(name) > 64 or name != name.lower():
                errors.append(f"Invalid SKILL.md frontmatter name: '{name}'")
            if not desc or len(desc) > 1024:
                errors.append(f"SKILL.md description length ({len(desc)}) must be 1..1024 chars")
            if "when in doubt, activate" in skill_text.lower():
                errors.append("SKILL.md still contains forbidden false-positive phrase 'When in doubt, activate'")
            if "do not activate" not in desc.lower():
                errors.append("SKILL.md description missing explicit negative trigger ('DO NOT ACTIVATE')")
            if "hybrid" not in desc.lower():
                errors.append("SKILL.md description missing explicit HYBRID ROUTING instruction")
            checks_passed += 1
        except Exception as exc:
            errors.append(f"SKILL.md frontmatter error: {exc}")

    # 2. Validate file size budgets (<24,000 byte Antigravity rule cap)
    size_budgets = [
        (ROOT_DIR / "SKILL.md", 8_000, "SKILL.md (<8 KB Turn-1 budget)"),
        (ROOT_DIR / "references" / "core-compact.md", 12_000, "core-compact.md (<12 KB Profile-5 budget)"),
        (
            ROOT_DIR / "references" / "clinical-spine.md",
            24_000,
            "clinical-spine.md (<24,000 byte Antigravity rule ceiling)",
        ),
    ]
    for path, max_bytes, label in size_budgets:
        if not path.exists():
            errors.append(f"Missing required file for size check: {path}")
        else:
            actual = path.stat().st_size
            if actual > max_bytes:
                errors.append(f"Size budget exceeded for {label}: {actual} bytes > {max_bytes} bytes")
            else:
                checks_passed += 1

    # 3. Validate Category A Pointer Stubs (strictly <=15 lines, zero duplicated tables)
    for stub in CATEGORY_A_POINTER_STUBS:
        if not stub.exists():
            errors.append(f"Missing Category A pointer stub: {stub.relative_to(ROOT_DIR)}")
            continue
        lines = stub.read_text(encoding="utf-8").splitlines()
        if len(lines) > 15:
            errors.append(
                f"Category A pointer stub {stub.relative_to(ROOT_DIR)} has {len(lines)} lines (strictly <=15 allowed)"
            )
        if any("|---|" in ln for ln in lines):
            errors.append(f"Category A pointer stub {stub.relative_to(ROOT_DIR)} contains a duplicated Markdown table")
        checks_passed += 1

    # 4. Validate Category B Per-Agent Skill Mirrors (byte-identical SHA-256 to root SKILL.md)
    canonical_sha = sha256_file(skill_path) if skill_path.exists() else ""
    for mirror in CATEGORY_B_SKILL_MIRRORS:
        if not mirror.exists():
            errors.append(f"Missing Category B skill mirror: {mirror.relative_to(ROOT_DIR)}")
            continue
        mirror_sha = sha256_file(mirror)
        if mirror_sha != canonical_sha:
            errors.append(
                f"Category B skill mirror drift in {mirror.relative_to(ROOT_DIR)}: "
                f"SHA-256 {mirror_sha[:12]} != canonical {canonical_sha[:12]} (run build_release.py --sync)"
            )
        else:
            checks_passed += 1

    # 5. Primary-Source Crisis Table Verification against references/crisis-sources.json
    crisis_manifest_path = ROOT_DIR / "references" / "crisis-sources.json"
    if not crisis_manifest_path.exists():
        errors.append("Missing references/crisis-sources.json primary-source crisis manifest")
    else:
        manifest = json.loads(crisis_manifest_path.read_text(encoding="utf-8"))
        required_tokens: list[str] = manifest.get("requiredTokensInDocs", [])
        for doc_path in CRISIS_DOC_TARGETS:
            if not doc_path.exists():
                errors.append(f"Missing crisis doc target: {doc_path.relative_to(ROOT_DIR)}")
                continue
            doc_text = doc_path.read_text(encoding="utf-8")
            missing = [tok for tok in required_tokens if tok not in doc_text]
            if missing:
                errors.append(
                    f"Crisis verification failed in {doc_path.relative_to(ROOT_DIR)} — "
                    f"missing verified tokens from crisis-sources.json: {missing}"
                )
            else:
                checks_passed += 1

    # 6. Check relative Markdown links across key files
    md_files_to_check = [
        ROOT_DIR / "SKILL.md",
        ROOT_DIR / "README.md",
        ROOT_DIR / "PRIVACY.md",
        *CATEGORY_A_POINTER_STUBS,
        *sorted((ROOT_DIR / "references").glob("*.md")),
    ]
    for md_file in md_files_to_check:
        if not md_file.exists():
            continue
        text = md_file.read_text(encoding="utf-8")
        for match in LINK_RE.finditer(text):
            target = match.group(1).strip()
            if (
                target.startswith("http://")
                or target.startswith("https://")
                or target.startswith("#")
                or target.startswith("mailto:")
            ):
                continue
            clean_target = target.split("#", 1)[0]
            if not clean_target:
                continue
            resolved = (md_file.parent / clean_target).resolve()
            if not resolved.exists():
                # Also check relative to repo root for inline table references
                root_resolved = (ROOT_DIR / clean_target).resolve()
                if not root_resolved.exists():
                    errors.append(f"Broken relative link in {md_file.relative_to(ROOT_DIR)}: '{target}'")
    checks_passed += 1

    # 7. Check git hygiene (.gitignore, legacy zip removal, SOUL.md SHA-256 in openclaw.plugin.json)
    gitignore_path = ROOT_DIR / ".gitignore"
    if not gitignore_path.exists():
        errors.append("Missing root .gitignore")
    else:
        gi_text = gitignore_path.read_text(encoding="utf-8")
        for required_ignore in (".satori/", "dist/", "*.zip"):
            if required_ignore not in gi_text:
                errors.append(f"Root .gitignore missing required entry '{required_ignore}'")
        checks_passed += 1

    if (ROOT_DIR / "SatoriSkill-v5.zip").exists():
        errors.append("Legacy tracked binary SatoriSkill-v5.zip still exists in repository root")
    else:
        checks_passed += 1

    openclaw_path = ROOT_DIR / "openclaw.plugin.json"
    soul_path = ROOT_DIR / "references" / "SOUL.md"
    if not openclaw_path.exists():
        errors.append("Missing openclaw.plugin.json")
    else:
        oc_data = json.loads(openclaw_path.read_text(encoding="utf-8"))
        recorded_hash = oc_data.get("integrity", {}).get("files", {}).get("references/SOUL.md")
        actual_hash = sha256_file(soul_path)
        if recorded_hash != actual_hash:
            errors.append(
                f"SOUL.md SHA-256 mismatch in openclaw.plugin.json: {recorded_hash} != {actual_hash}"
            )
        else:
            checks_passed += 1

    if errors:
        print(json.dumps({"status": "FAILED", "checks_passed": checks_passed, "errors": errors}, indent=2))
        return 1

    print(
        json.dumps(
            {
                "status": "PASSED",
                "checks_passed": checks_passed,
                "message": "All Satori v6.0 static, size, pointer-stub, mirror-SHA256, crisis-table, and hygiene checks passed.",
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
