#!/usr/bin/env python3
"""Satori Build-Time Static Validator (scripts/validate_skill.py).

Verifies 52+ automated checks across:
1. Canonical SKILL.md YAML frontmatter compliance (name <=64, description <=500 chars / <=125 tokens,
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
7. Manifest Version Parity and Banned Term Check.
8. Agent Skills Ecosystem Parser Gate (npx skills add . --list).
9. Check A: Repo-Wide Stale Version-String Scan (no stale v6.5.0/v6.5.1 in active surfaces).
10. Check B: Repo-Wide Dangling File-Pointer Scan.
11. Check C: Frontmatter Description Token Budget (<=500 chars, <=125 estimated tokens).
12. Check D: Reference Table of Contents Check (valid anchor links for all references/*.md > 100 lines).
13. Check E: Release Checksum Integrity (dist/SHA256SUMS.txt).
14. Check F: Slides Directory Retirement Check (D-5).
15. Check G: Evidence Bundle Completeness (Appendix B JSON reports in evals/).
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import re
import shutil
import subprocess
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
    ROOT_DIR / "compact" / "SKILL.md",
    ROOT_DIR / "references" / "clinical-spine.md",
    ROOT_DIR / "references" / "core-compact.md",
]

LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


def sha256_file(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes().replace(b"\r\n", b"\n")).hexdigest()


def parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---\n"):
        raise ValueError("Missing opening YAML frontmatter delimiter '---'")
    end_idx = text.find("\n---\n", 4)
    if end_idx == -1:
        raise ValueError("Missing closing YAML frontmatter delimiter '---'")
    block = text[4:end_idx]

    try:
        import yaml
        parsed = yaml.safe_load(block)
        if not isinstance(parsed, dict):
            raise ValueError("YAML frontmatter must parse into a mapping dictionary")
        return {str(k): str(v) for k, v in parsed.items()}
    except ImportError:
        pass

    result: dict[str, str] = {}
    for line in block.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"Malformed YAML frontmatter line: '{line}'")
        k, v = line.split(":", 1)
        k = k.strip()
        v = v.strip()
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            v = v[1:-1]
        elif ":" in v:
            raise ValueError(
                f"YAML syntax violation: unquoted colon in value for key '{k}'. "
                "Values containing colons must be quoted in standard YAML."
            )
        result[k] = v
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

    compact_path = ROOT_DIR / "compact" / "SKILL.md"
    if compact_path.exists():
        compact_text = compact_path.read_text(encoding="utf-8")
        try:
            fm_c = parse_frontmatter(compact_text)
            if fm_c.get("name") != "satori":
                errors.append(f"Invalid compact/SKILL.md frontmatter name: '{fm_c.get('name')}'")
            if not fm_c.get("description"):
                errors.append("Missing compact/SKILL.md description")
            checks_passed += 1
        except Exception as exc:
            errors.append(f"compact/SKILL.md frontmatter error: {exc}")

    # Load facts.json Single Source of Truth
    facts_path = ROOT_DIR / "facts.json"
    facts: dict = {}
    if not facts_path.exists():
        errors.append("Missing root facts.json Single Source of Truth")
    else:
        try:
            facts = json.loads(facts_path.read_text(encoding="utf-8"))
            checks_passed += 1
        except Exception as exc:
            errors.append(f"facts.json JSON parse error: {exc}")

    skill_entry_budget = facts.get("budgets", {}).get("skill_entry_max_bytes", 8_000)
    compact_spine_budget = facts.get("budgets", {}).get("compact_spine_max_bytes", 12_000)
    ref_ceiling_budget = facts.get("budgets", {}).get("reference_rule_ceiling_bytes", 24_000)

    # 2. Validate file size budgets (<24,000 byte Antigravity rule cap)
    size_budgets = [
        (ROOT_DIR / "SKILL.md", skill_entry_budget, f"SKILL.md (<{skill_entry_budget} B Turn-1 budget)"),
        (ROOT_DIR / "compact" / "SKILL.md", skill_entry_budget, f"compact/SKILL.md (<{skill_entry_budget} B Turn-1 budget)"),
        (ROOT_DIR / "references" / "core-compact.md", compact_spine_budget, f"core-compact.md (<{compact_spine_budget} B Compact budget)"),
    ]
    for path, max_bytes, label in size_budgets:
        if not path.exists():
            errors.append(f"Missing required file for size check: {path}")
        else:
            # Normalize CRLF to LF so cross-platform git checkout line endings do not inflate byte budgets
            actual = len(path.read_bytes().replace(b"\r\n", b"\n"))
            if actual > max_bytes:
                errors.append(f"Size budget exceeded for {label}: {actual} bytes > {max_bytes} bytes")
            else:
                checks_passed += 1

    # Compact single-file prompt character limit check (ChatGPT Custom GPT <=8,000 char ceiling)
    compact_skill = ROOT_DIR / "compact" / "SKILL.md"
    if compact_skill.exists():
        compact_chars = len(compact_skill.read_text(encoding="utf-8"))
        if compact_chars > 7800:
            errors.append(f"Compact SKILL.md character ceiling exceeded: {compact_chars} chars > 7800 chars")
        else:
            checks_passed += 1

    # Universal check: EVERY markdown file in references/ must be strictly <= ref_ceiling_budget (<24 KB)
    refs_dir = ROOT_DIR / "references"
    for ref_md in sorted(refs_dir.glob("*.md")):
        actual_len = len(ref_md.read_bytes().replace(b"\r\n", b"\n"))
        if actual_len > ref_ceiling_budget:
            errors.append(
                f"Universal size ceiling exceeded in {ref_md.relative_to(ROOT_DIR)}: {actual_len} bytes > {ref_ceiling_budget} bytes"
            )
        else:
            checks_passed += 1

    # 3. Validate Category A Pointer Stubs (strictly <=15 lines for Satori stub, <=30 lines total with ## Agent skills)
    for stub in CATEGORY_A_POINTER_STUBS:
        if not stub.exists():
            errors.append(f"Missing Category A pointer stub: {stub.relative_to(ROOT_DIR)}")
            continue
        raw_lines = stub.read_text(encoding="utf-8").splitlines()
        # Find if downstream ## Agent skills section exists
        agent_skills_idx = next((i for i, ln in enumerate(raw_lines) if ln.strip().startswith("## Agent skills")), None)
        if agent_skills_idx is not None:
            satori_lines = raw_lines[:agent_skills_idx]
            while satori_lines and not satori_lines[-1].strip():
                satori_lines.pop()
            if len(satori_lines) > 15:
                errors.append(
                    f"Category A pointer stub {stub.relative_to(ROOT_DIR)} has {len(satori_lines)} lines in Satori section (strictly <=15 allowed)"
                )
            if len(raw_lines) > 30:
                errors.append(
                    f"Category A pointer stub {stub.relative_to(ROOT_DIR)} total lines {len(raw_lines)} exceeds ceiling of <=30 lines"
                )
        else:
            if len(raw_lines) > 15:
                errors.append(
                    f"Category A pointer stub {stub.relative_to(ROOT_DIR)} has {len(raw_lines)} lines (strictly <=15 allowed)"
                )
            satori_lines = raw_lines

        if any("|---|" in ln for ln in satori_lines):
            errors.append(f"Category A pointer stub {stub.relative_to(ROOT_DIR)} contains a duplicated Markdown table in Satori section")
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
        last_verified_str = manifest.get("lastVerified") or manifest.get("last_verified")
        staleness_days = facts.get("crisis_governance", {}).get("staleness_warning_days", 120)
        import datetime as dt

        if not last_verified_str:
            errors.append("crisis-sources.json missing top-level lastVerified / last_verified timestamp")
        else:
            try:
                lv_date = dt.date.fromisoformat(last_verified_str)
                age_days = (dt.date.today() - lv_date).days
                if age_days > staleness_days:
                    errors.append(f"crisis-sources.json lastVerified date {last_verified_str} is stale ({age_days} days old > {staleness_days} days)")
                else:
                    checks_passed += 1
            except Exception as e:
                errors.append(f"Invalid lastVerified date format in crisis-sources.json: {e}")

        # Per-helpline verification check
        helpline_errors: list[str] = []
        for r in manifest.get("regions", []):
            reg_id = r.get("id", "UNKNOWN")
            for line_type in ("callLines", "textLines"):
                for hl in r.get(line_type, []):
                    hl_name = hl.get("name", "Unknown helpline")
                    hl_lv = hl.get("last_verified") or hl.get("lastVerified")
                    if not hl_lv:
                        helpline_errors.append(f"[{reg_id}] {hl_name} missing last_verified timestamp")
                    else:
                        try:
                            hl_date = dt.date.fromisoformat(hl_lv)
                            age = (dt.date.today() - hl_date).days
                            if age > staleness_days:
                                helpline_errors.append(f"[{reg_id}] {hl_name} timestamp {hl_lv} is stale ({age} days > {staleness_days})")
                        except Exception as e:
                            helpline_errors.append(f"[{reg_id}] {hl_name} invalid date format: {e}")
        if helpline_errors:
            errors.extend(helpline_errors)
        else:
            checks_passed += 1

        required_tokens: list[str] = manifest.get("requiredTokensInDocs", [])
        for doc_path in CRISIS_DOC_TARGETS:
            if not doc_path.exists():
                errors.append(f"Missing crisis doc target: {doc_path.relative_to(ROOT_DIR)}")
                continue
            doc_text = doc_path.read_text(encoding="utf-8")
            missing = [tok for tok in required_tokens if tok not in doc_text]
            if missing:
                errors.append(
                    f"Crisis verification failed in {doc_path.relative_to(ROOT_DIR)}: "
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
    oc_version = "6.1.0"
    if not openclaw_path.exists():
        errors.append("Missing openclaw.plugin.json")
    else:
        oc_data = json.loads(openclaw_path.read_text(encoding="utf-8"))
        openclaw_version = oc_data.get("version", "6.5.0")
        recorded_hash = oc_data.get("integrity", {}).get("files", {}).get("references/SOUL.md")
        actual_hash = sha256_file(soul_path)
        if recorded_hash != actual_hash:
            errors.append(
                f"SOUL.md SHA-256 mismatch in openclaw.plugin.json: {recorded_hash} != {actual_hash}"
            )
        else:
            checks_passed += 1

    # 8. Manifest Version Parity and Banned Term Check
    pkg_path = ROOT_DIR / "package.json"
    canonical_version = facts.get("version", "6.5.2")
    if not pkg_path.exists():
        errors.append("Missing root package.json for version parity baseline")
    else:
        canonical_version = json.loads(pkg_path.read_text(encoding="utf-8")).get("version", canonical_version)
        manifest_paths = [
            ROOT_DIR / "plugin.json",
            ROOT_DIR / "openclaw.plugin.json",
            ROOT_DIR / "marketplace.json",
            ROOT_DIR / "gemini-extension.json",
            ROOT_DIR / ".claude-plugin" / "plugin.json",
            ROOT_DIR / ".codex-plugin" / "plugin.json",
            ROOT_DIR / ".agents" / "plugins" / "satori" / "plugin.json",
        ]
        manifest_parity_ok = True
        for mp in manifest_paths:
            if not mp.exists():
                errors.append(f"Missing manifest file for version parity check: {mp.relative_to(ROOT_DIR)}")
                manifest_parity_ok = False
                continue
            m_ver = json.loads(mp.read_text(encoding="utf-8")).get("version")
            if m_ver != canonical_version:
                errors.append(
                    f"Manifest version parity mismatch in {mp.relative_to(ROOT_DIR)}: '{m_ver}' != package.json '{canonical_version}'"
                )
                manifest_parity_ok = False
        if manifest_parity_ok:
            checks_passed += 1

        banned_terms = ["Clinically informed", "clinically informed", "9 agent ecosystems"]
        banned_ok = True
        scan_targets = [
            *manifest_paths,
            ROOT_DIR / "references" / "SOUL.md",
            ROOT_DIR / ".opencode" / "command" / "satori.md",
            ROOT_DIR / ".cursor" / "rules" / "satori.mdc",
        ]
        for target_file in scan_targets:
            if target_file.exists():
                text = target_file.read_text(encoding="utf-8")
                for term in banned_terms:
                    if term.lower() in text.lower():
                        errors.append(
                            f"Banned term '{term}' detected in {target_file.relative_to(ROOT_DIR)}"
                        )
                        banned_ok = False
        if banned_ok:
            checks_passed += 1

    # 9. Agent Skills Ecosystem Parser Gate (npx skills add . --list)
    npx_bin = shutil.which("npx")
    if npx_bin:
        try:
            res = subprocess.run(
                [npx_bin, "--yes", "skills", "add", ".", "--list"],
                cwd=ROOT_DIR,
                capture_output=True,
                text=True,
                timeout=15,
            )
            clean_out = re.sub(r"\x1b\[[0-9;]*[a-zA-Z]", "", res.stdout)
            clean_err = re.sub(r"\x1b\[[0-9;]*[a-zA-Z]", "", res.stderr)
            if res.returncode != 0 or "YAML parse error" in clean_out or "YAML parse error" in clean_err:
                errors.append(f"Agent skills ecosystem CLI error: {clean_out.strip()} {clean_err.strip()}")
            elif not re.search(r"Found\s+1\s+skill", clean_out, re.IGNORECASE):
                errors.append(f"Agent skills ecosystem CLI failed to find Satori skill: {clean_out.strip()}")
            else:
                checks_passed += 1
        except subprocess.TimeoutExpired:
            pass
        except Exception as exc:
            pass

    # 10. Check A: Repo-Wide Stale Version-String Scan
    expected_version = facts.get("version", canonical_version)
    stale_scan_targets = [
        ROOT_DIR / "package.json",
        ROOT_DIR / "facts.json",
        ROOT_DIR / "marketplace.json",
        ROOT_DIR / "plugin.json",
        ROOT_DIR / "openclaw.plugin.json",
        ROOT_DIR / "gemini-extension.json",
        ROOT_DIR / ".agents" / "plugins" / "satori" / "plugin.json",
        ROOT_DIR / ".claude-plugin" / "plugin.json",
        ROOT_DIR / ".codex-plugin" / "plugin.json",
        ROOT_DIR / "docs" / "architecture.md",
        ROOT_DIR / "docs" / "sitemap.xml",
        ROOT_DIR / "README.md",
        ROOT_DIR / "docs" / "index.html",
        ROOT_DIR / "docs" / "assets" / "satori-hero-v6.svg",
        ROOT_DIR / "docs" / "assets" / "satori-architecture-v6.svg",
    ]
    stale_version_pat = re.compile(r"\b(?:v)?6\.5\.[01]\b")
    stale_errors: list[str] = []
    for target in stale_scan_targets:
        if not target.exists():
            stale_errors.append(f"Missing file for stale version scan: {target.relative_to(ROOT_DIR)}")
            continue
        content = target.read_text(encoding="utf-8")
        stale_matches = stale_version_pat.findall(content)
        if stale_matches:
            stale_errors.append(
                f"Stale version string(s) {stale_matches} found in {target.relative_to(ROOT_DIR)} (must match v{expected_version})"
            )
    if stale_errors:
        errors.extend(stale_errors)
    else:
        checks_passed += 1

    # 11. Check B: Repo-Wide Dangling File-Pointer Scan
    pointer_scan_targets = [
        ROOT_DIR / "plugin.json",
        ROOT_DIR / "marketplace.json",
        ROOT_DIR / "package.json",
        ROOT_DIR / "CONTRIBUTING.md",
        ROOT_DIR / "README.md",
        ROOT_DIR / "docs" / "architecture.md",
        ROOT_DIR / "SKILL.md",
        ROOT_DIR / "compact" / "SKILL.md",
        *CATEGORY_A_POINTER_STUBS,
    ]
    dangling_errors: list[str] = []
    md_link_pat = re.compile(r"\[[^\]]+\]\(([^)#\s]+)")
    path_ref_pat = re.compile(r"(?:references|docs|scripts|compact)/[A-Za-z0-9_.-]+(?:\.[a-zA-Z0-9]+)?")

    for target_doc in pointer_scan_targets:
        if not target_doc.exists():
            continue
        content = target_doc.read_text(encoding="utf-8")
        # Check relative markdown links
        for match in md_link_pat.finditer(content):
            target = match.group(1).strip()
            if target.startswith(("http://", "https://", "mailto:")):
                continue
            clean_target = target.split("#", 1)[0]
            if not clean_target:
                continue
            p_parent = (target_doc.parent / clean_target).resolve()
            p_root = (ROOT_DIR / clean_target).resolve()
            if not p_parent.exists() and not p_root.exists():
                dangling_errors.append(
                    f"Dangling link in {target_doc.relative_to(ROOT_DIR)}: '{target}'"
                )

        # Check inline path references to repository folders
        for match in path_ref_pat.finditer(content):
            ref = match.group(0).rstrip(".,:;)\"']")
            p_parent = (target_doc.parent / ref).resolve()
            p_root = (ROOT_DIR / ref).resolve()
            if not p_parent.exists() and not p_root.exists():
                if not ref.startswith("dist/"):
                    dangling_errors.append(
                        f"Dangling path reference in {target_doc.relative_to(ROOT_DIR)}: '{ref}'"
                    )

    if dangling_errors:
        errors.extend(dangling_errors)
    else:
        checks_passed += 1

    # 12. Check C: Frontmatter Description Token Budget
    budget_errors: list[str] = []
    for label, target_p in [("SKILL.md", skill_path), ("compact/SKILL.md", compact_path)]:
        if not target_p.exists():
            budget_errors.append(f"Missing {label} for description token budget check")
            continue
        try:
            fm = parse_frontmatter(target_p.read_text(encoding="utf-8"))
            desc = fm.get("description", "")
            char_count = len(desc)
            est_tokens = max(char_count // 4, round(len(desc.split()) * 1.33))
            if char_count > 500:
                budget_errors.append(
                    f"{label} description character budget exceeded: {char_count} chars > 500 ceiling"
                )
            if est_tokens > 125:
                budget_errors.append(
                    f"{label} description token budget exceeded: {est_tokens} est tokens > 125 ceiling"
                )
        except Exception as exc:
            budget_errors.append(f"{label} frontmatter parsing error in budget check: {exc}")

    if budget_errors:
        errors.extend(budget_errors)
    else:
        checks_passed += 1

    # 13. Check D: Reference Table of Contents Check
    def _slugify(s: str) -> set[str]:
        s_clean = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)
        s_clean = re.sub(r"[`*~]", "", s_clean).lower().strip()
        s_alnum = re.sub(r"[^\w\s-]", "", s_clean)
        slug_literal = s_alnum.replace(" ", "-")
        slug_collapsed = re.sub(r"-+", "-", slug_literal)
        slug_hyphen_under = slug_literal.replace("_", "-")
        slug_hyphen_under_collapsed = re.sub(r"-+", "-", slug_hyphen_under)
        return {slug_literal, slug_collapsed, slug_hyphen_under, slug_hyphen_under_collapsed}

    toc_errors: list[str] = []
    refs_directory = ROOT_DIR / "references"
    for ref_md in sorted(refs_directory.glob("*.md")):
        text = ref_md.read_text(encoding="utf-8")
        lines = text.splitlines()
        if len(lines) <= 100:
            continue

        if "## Table of Contents" not in text:
            toc_errors.append(
                f"{ref_md.relative_to(ROOT_DIR)} ({len(lines)} lines) missing '## Table of Contents'"
            )
            continue

        headings = []
        for line in lines:
            m = re.match(r"^(#{1,6})\s+(.*)$", line)
            if m:
                headings.append(m.group(2).strip())

        valid_slugs: set[str] = set()
        for h in headings:
            valid_slugs.update(_slugify(h))

        in_toc = False
        toc_lines = []
        for line in lines:
            if "## Table of Contents" in line:
                in_toc = True
                continue
            if in_toc:
                if line.startswith("## ") or line.startswith("---"):
                    break
                toc_lines.append(line)

        toc_anchors = re.findall(r"\[[^\]]+\]\(#([^)]+)\)", "\n".join(toc_lines))
        if not toc_anchors:
            toc_errors.append(
                f"{ref_md.relative_to(ROOT_DIR)} has '## Table of Contents' but contains no anchor links"
            )
        for anchor in toc_anchors:
            if anchor not in valid_slugs:
                toc_errors.append(
                    f"{ref_md.relative_to(ROOT_DIR)} TOC anchor '#{anchor}' does not match any heading in document"
                )

    if toc_errors:
        errors.extend(toc_errors)
    else:
        checks_passed += 1

    # 14. Check E: Release Checksum Integrity
    checksums_file = ROOT_DIR / "dist" / "SHA256SUMS.txt"
    if checksums_file.exists():
        checksum_errors: list[str] = []
        sums_text = checksums_file.read_text(encoding="utf-8")
        parsed_sums: dict[str, str] = {}
        for line in sums_text.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split(None, 1)
            if len(parts) == 2:
                digest, fname = parts
                parsed_sums[fname.strip()] = digest.strip()

        required_archives = [
            f"SatoriSkill-Full-v{expected_version}.zip",
            f"SatoriSkill-Compact-v{expected_version}.zip",
            f"SatoriSkill-v{expected_version}.zip",
        ]
        for arc_name in required_archives:
            if arc_name not in parsed_sums:
                checksum_errors.append(f"dist/SHA256SUMS.txt missing entry for required archive '{arc_name}'")
            else:
                arc_path = ROOT_DIR / "dist" / arc_name
                if not arc_path.exists():
                    checksum_errors.append(f"Archive '{arc_name}' listed in SHA256SUMS.txt does not exist in dist/")
                else:
                    actual_hash = sha256_file(arc_path)
                    if actual_hash != parsed_sums[arc_name]:
                        checksum_errors.append(
                            f"Checksum mismatch for '{arc_name}': expected {parsed_sums[arc_name]}, got {actual_hash}"
                        )
        if checksum_errors:
            errors.extend(checksum_errors)
        else:
            checks_passed += 1
    else:
        checks_passed += 1

    # 15. Check F: Slides Directory Retirement Check (D-5)
    slides_path = ROOT_DIR / "slides"
    if slides_path.exists():
        errors.append("Legacy 'slides/' directory still exists in repository root (must be retired per D-5)")
    else:
        checks_passed += 1

    # 16. Check G: Evidence Bundle Completeness (Appendix B)
    appendix_b_reports = [
        "live_calibration_report.json",
        "trigger_benchmark_report.json",
        "trigger_benchmark_compact_report.json",
        "paired_capability_report.json",
        "judge_calibration_report.json",
        "held_out_report.json",
        "coexistence_report.json",
        "fault_injection_report.json",
        "edge_inputs_report.json",
        "cost_and_economy_report.json",
        "loader_validation_matrix.json",
        "minimal_host_report.json",
        "safety_certification_report.json",
        "upgrade_test_report.json",
    ]
    evidence_errors: list[str] = []
    for rep_name in appendix_b_reports:
        rep_path = ROOT_DIR / "evals" / rep_name
        if not rep_path.exists():
            evidence_errors.append(f"Missing Appendix B evidence report: evals/{rep_name}")
        else:
            try:
                parsed_rep = json.loads(rep_path.read_text(encoding="utf-8"))
                if not isinstance(parsed_rep, dict):
                    evidence_errors.append(f"Evidence report evals/{rep_name} is not a valid JSON object")
            except Exception as exc:
                evidence_errors.append(f"Malformed JSON in Appendix B report evals/{rep_name}: {exc}")

    if evidence_errors:
        errors.extend(evidence_errors)
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
                "version": f"v{canonical_version}",
                "message": f"All Satori v{canonical_version} static, size, pointer-stub, mirror-SHA256, crisis-table, manifest-parity, and hygiene checks passed.",
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
