# Contributing to Satori

Pull requests are welcome. Satori is a living project, and the roadmap explicitly includes community-contributed traditions, conversation patterns, and protocol expansions.

Before contributing, read this document. Contributions that don't meet the quality bar will be returned with feedback, not merged without comment.

---

## Developer Setup & Process Guards

After cloning the repository, install the local Git pre-commit hook so that every commit automatically runs the 58-point static verification suite across 20 validation sections (`python scripts/validate_skill.py`):

```bash
# Option A: Cross-platform Python installer (Windows / macOS / Linux)
python scripts/install-hooks.py

# Option B: POSIX shell installer or symlink (macOS / Linux / Git Bash)
sh scripts/install-hooks.sh
# or: ln -sf ../../scripts/pre-commit .git/hooks/pre-commit
```

Running `python scripts/build_release.py` also automatically installs `.git/hooks/pre-commit` whenever `.git/hooks` is present.

**What the pre-commit hook enforces (`python scripts/validate_skill.py`: 58/58 checks passed):**
- Progressive disclosure budget (`SKILL.md` strictly <8,000 bytes, zero `alwaysLoad` bloat; every markdown reference under the 24,000-byte ceiling).
- Category A pointer-stub integrity across 6 IDE rule files (`<=15 lines`) and byte-for-byte SHA-256 sync across 4 Category B `SKILL.md` mirrors.
- `references/SOUL.md` SHA-256 integrity verification against `openclaw.plugin.json`.
- Primary-source verification of all 9 regional crisis rows against `references/crisis-sources.json`.
- Repository hygiene (`.gitignore` guards for `.satori/`, `dist/`, `*.zip`) and zero broken relative Markdown links.
- Zero Unicode em dashes (U+2014) or HTML mdash entities across all documentation.

---

## Automated Verification Gates

Before submitting a pull request, run the offline verification test suite locally:

1. **Static Validation Suite**:
   ```bash
   python scripts/validate_skill.py
   ```
   Enforces 58 automated checks across 20 validation sections, verifying file size budgets, pointer stubs, mirror hashes, crisis table parity, and zero em-dash hygiene.

2. **Local Memory Engine Self-Tests**:
   ```bash
   python scripts/satori_memory.py --self-test
   ```
   Verifies 8 of 8 unit and privacy tests, confirming schema initialization, SQLite FTS5 search, signal length capping (`≤500` characters), cloud-sync detection, and right-to-erasure WAL truncation (`VACUUM`).

3. **Trigger Benchmark Lint**:
   ```bash
   python scripts/run_evals.py --suite trigger --mode lint
   ```
   Evaluates 350 test cases, verifying $\ge 90\%$ recall on positive prompts (60 cases), $\ge 95\%$ non-activation on pure technical queries (200 cases), $\ge 85\%$ on hybrid prompts (50 cases), and 100% on acute crisis handoff (20 cases).

4. **Judge Calibration Verification**:
   ```bash
   python scripts/test_judge_calibration.py
   ```
   Evaluates 50 human-labeled prompt pairs, verifying Cohen's kappa reaches `0.84`, satisfying the $\ge 0.80$ report target and safely exceeding the $\ge 0.60$ floor gate.

5. **Release Build & Mirror Synchronization**:
   ```bash
   python scripts/build_release.py --sync
   ```
   Synchronizes `SKILL.md` mirrors, checks manifest parity, and compiles release archives.

---

## What Contributions Are Welcome

### Wisdom Traditions
New tradition entries for `references/traditions-stoic.md`, `references/traditions-eastern.md`, `references/traditions-african-sufi.md`, or `references/traditions-quickref.md`. Priority:
- African philosophical traditions (Ubuntu, Akan thought, Kemetic wisdom)
- Indigenous wisdom traditions (with appropriate cultural care: see below)
- Lesser-represented Asian traditions (Daoism beyond Lao Tzu, Confucian ethics in practice, Zen vs. Pure Land distinctions)
- Latin American philosophical traditions
- Additions to existing entries where depth is genuinely needed

### Clinical Frameworks
New or expanded entries for clinical/psychological frameworks. Must:
- Have a real, named lineage (not synthesized from general pop-psychology)
- Be operationally useful: not just descriptively accurate
- Include a clear "when to use" and "failure mode" section

### Conversation Patterns
New patterns for `references/toolkit-inquiry.md` and `references/toolkit-somatic.md`. Must meet the same quality bar as existing patterns (see below).

### Protocol Documents
New reference documents in the `references/` directory: following the pattern of `references/darknight-protocol.md` or `references/shadow-work-protocol.md`. These should address specific situations or arcs not currently covered. Note that all 17 markdown reference files in `references/` must strictly remain under the 24,000-byte ceiling.

### Community Contributions
Place community-originated content in a `community/` subdirectory with attribution. These are not merged into the core reference files without editorial review, but are available as optional extensions.

---

## Quality Bar

Every contribution to Satori is evaluated against the same standard the skill itself uses:

> *Understanding + pattern recognition + connection + movement*

For documentation: **Clarity + operational specificity + clinical discipline + voice consistency**

### The Tests

**1. Is it operationally specific?**
Satori documentation is not descriptive: it is instructional. It tells the model *what to do*, *when*, *how*, and *what to avoid*. A tradition entry that only explains what the tradition believes is not enough. It must explain *when to reach for it* and *how to translate it into lived experience*.

**2. Does it translate to plain language?**
Every framework must be shown landing in concrete human experience, not as an abstract concept. If your entry includes a framework applied only in jargon, it hasn't been finished.

**3. Is the voice consistent?**
Read `references/tone-and-voice.md` before contributing. Satori's voice is: warm, direct, honest, structurally precise, and free of therapeutic platitudes. Contributions that sound like a wellness blog, an academic paper, or a motivational app will be returned for revision.

**4. Is there a failure mode section?**
Good entries name not just *when to use* but *when this framework falls flat*, *when it can do harm*, or *what it misses*. Traditions are precision tools, not universal answers.

**5. Is it one thing, done well?**
Satori's central discipline is: one framework per response. The same discipline applies to contributions. One tradition, one pattern, one protocol: done deeply and precisely: is more valuable than five done superficially.

---

## Cultural Sensitivity Guidelines

For traditions from cultures that have experienced marginalization, colonization, or appropriation:

- **Name the tradition accurately**: do not synthesize "Indigenous wisdom" as a generic category. If you're writing about a specific tradition, name it specifically (Lakota, Yoruba, Māori, etc.).
- **Cite sources**: preferably by authors who are members of the tradition they're writing about.
- **Note limitations**: if a tradition has aspects that shouldn't be extracted from their cultural context, say so.
- **Consult community**: for traditions with living communities that have expressed concerns about appropriation, note this and approach with proportional care.

Satori is committed to representing these traditions with the same depth and respect given to Greek philosophy or Western psychology.

---

## How to Submit

1. **Fork the repository**
2. **Create a branch** named for your contribution (`feature/ubuntu-tradition`, `pattern/the-apology`, etc.)
3. **Write your contribution** following the style and structure of existing entries
4. **Test it**: run all 5 verification gates above (`python scripts/validate_skill.py`, `python scripts/satori_memory.py --self-test`, `python scripts/run_evals.py --suite trigger --mode lint`, `python scripts/test_judge_calibration.py`, and `python scripts/build_release.py --sync`)
5. **Submit a PR** with:
   - What you added and why
   - What tradition/source it draws from
   - How you verified it's working as intended
   - Any caveats or known limitations

---

## What We Don't Accept

- Content that replaces the clinical spine with generic wellness advice
- Frameworks that encourage Satori to diagnose, prescribe, or assess clinical risk
- Additions to the "always load" core files without maintainer discussion: these affect every conversation
- Contributions that undermine the "one framework per response" discipline
- Anything that softens the commitment to honesty before comfort
- Em dashes: all documentation enforces a strict zero em-dash policy (never use Unicode U+2014 or HTML mdash entities; use hyphens, colons, or parentheses instead)

---

## A Note on Satori's Identity

`references/SOUL.md` exists for a reason. Satori has **8 Constitutional Immovables**: core principles that never adapt regardless of what is contributed. Contributions that erode these will not be merged:

1. **Honesty before comfort**: Satori will not tell a person what they want to hear at the expense of what is true.
2. **Insight must lead to movement**: Every meaningful response produces at least one shift in frame or action.
3. **Refusal to bypass difficulty**: Hold the hard reality before reaching for resolution.
4. **Depth without decoration**: Traditions and frameworks serve the situation or remain unsaid; never used as intellectual decoration.
5. **Clinical discipline beneath a human voice**: Think with psychological rigor; speak with warm, unhurried ease.
6. **Humility about certainty**: Formulations are hypotheses, not verdicts. Satori holds its readings lightly.
7. **Respect for autonomy and human connection**: Never foster AI dependency; bridge insights back to real human relationships.
8. **Dual-Mode Memory Discipline**: Mode 1 local SQLite vault (`~/.satori/memory/`) with strict POSIX 0700/0600 permissions, signal minimization (`≤500` chars), and cloud-sync blocking; Mode 2 stateless data-only `SATORI_NOTE v6.5` blocks (`≤600` chars); plus single-agent execution invariant during introspection.

If your contribution assumes that making the experience more comfortable is the goal, it is working against the architecture. The goal is making it more *real*.

---

## Questions?

Open an issue before a PR if you're unsure whether your idea fits. A brief conversation upfront saves everyone time.

*Thank you for helping Satori grow.*
