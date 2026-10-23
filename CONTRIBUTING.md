# Contributing to Satori

Pull requests are welcome. Satori is a living project, and the roadmap explicitly includes community-contributed traditions, conversation patterns, and protocol expansions.

Before contributing, read this document. Contributions that don't meet the quality bar will be returned with feedback, not merged without comment.

---

## Developer Setup & Process Guards

After cloning the repository, install the local Git pre-commit hook so that every commit automatically runs the 47-point static verification suite (`python scripts/validate_skill.py`):

```bash
# Option A: Cross-platform Python installer (Windows / macOS / Linux)
python scripts/install-hooks.py

# Option B: POSIX shell installer or symlink (macOS / Linux / Git Bash)
sh scripts/install-hooks.sh
# or: ln -sf ../../scripts/pre-commit .git/hooks/pre-commit
```

Running `python scripts/build_release.py` also automatically installs `.git/hooks/pre-commit` whenever `.git/hooks` is present.

**What the pre-commit hook enforces (`python scripts/validate_skill.py`: 47/47 checks):**
- Progressive disclosure character budget (`SKILL.md` <= 9,500 chars, zero `alwaysLoad` bloat).
- Category A pointer-stub integrity across 6 IDE rule files and byte-for-byte SHA-256 sync across 4 Category B `SKILL.md` mirrors.
- `references/SOUL.md` SHA-256 integrity verification against `openclaw.plugin.json`.
- Primary-source verification of all 11 regional crisis hotlines against `references/crisis-sources.json`.
- Repository hygiene (`.gitignore` guards for `.satori/`, `dist/`, `*.zip`) and zero broken relative Markdown links.

---

## What Contributions Are Welcome

### Wisdom Traditions
New tradition entries for `references/traditions-stoic.md`, `references/traditions-eastern.md`, `references/traditions-african-sufi.md`, or `references/traditions-quickref.md`. Priority:
- African philosophical traditions (Ubuntu, Akan thought, Kemetic wisdom)
- Indigenous wisdom traditions (with appropriate cultural care : see below)
- Lesser-represented Asian traditions (Daoism beyond Lao Tzu, Confucian ethics in practice, Zen vs. Pure Land distinctions)
- Latin American philosophical traditions
- Additions to existing entries where depth is genuinely needed

### Clinical Frameworks
New or expanded entries for clinical/psychological frameworks. Must:
- Have a real, named lineage (not synthesized from general pop-psychology)
- Be operationally useful : not just descriptively accurate
- Include a clear "when to use" and "failure mode" section

### Conversation Patterns
New patterns for `references/toolkit-inquiry.md` and `references/toolkit-somatic.md`. Must meet the same quality bar as existing patterns (see below).

### Protocol Documents
New reference documents in the `references/` directory : following the pattern of `darknight-protocol.md` or `shadow-work-protocol.md`. These should address specific situations or arcs not currently covered.

### Community Contributions
Place community-originated content in a `community/` subdirectory with attribution. These are not merged into the core reference files without editorial review, but are available as optional extensions.

---

## Quality Bar

Every contribution to Satori is evaluated against the same standard the skill itself uses:

> *Understanding + pattern recognition + connection + movement*

For documentation: **Clarity + operational specificity + clinical discipline + voice consistency**

### The Tests

**1. Is it operationally specific?**
Satori documentation is not descriptive : it is instructional. It tells Claude *what to do*, *when*, *how*, and *what to avoid*. A tradition entry that only explains what the tradition believes is not enough. It must explain *when to reach for it* and *how to translate it into lived experience*.

**2. Does it translate to plain language?**
Every framework must be shown landing in concrete human experience, not as an abstract concept. If your entry includes a framework applied only in jargon, it hasn't been finished.

**3. Is the voice consistent?**
Read `references/tone-and-voice.md` before contributing. Satori's voice is: warm, direct, honest, structurally precise, and free of therapeutic platitudes. Contributions that sound like a wellness blog, an academic paper, or a motivational app will be returned for revision.

**4. Is there a failure mode section?**
Good entries name not just *when to use* but *when this framework falls flat*, *when it can do harm*, or *what it misses*. Traditions are precision tools, not universal answers.

**5. Is it one thing, done well?**
Satori's central discipline is: one framework per response. The same discipline applies to contributions. One tradition, one pattern, one protocol : done deeply and precisely : is more valuable than five done superficially.

---

## Cultural Sensitivity Guidelines

For traditions from cultures that have experienced marginalization, colonization, or appropriation:

- **Name the tradition accurately** : do not synthesize "Indigenous wisdom" as a generic category. If you're writing about a specific tradition, name it specifically (Lakota, Yoruba, Māori, etc.).
- **Cite sources** : preferably by authors who are members of the tradition they're writing about.
- **Note limitations** : if a tradition has aspects that shouldn't be extracted from their cultural context, say so.
- **Consult community** : for traditions with living communities that have expressed concerns about appropriation, note this and approach with proportional care.

Satori is committed to representing these traditions with the same depth and respect given to Greek philosophy or Western psychology.

---

## How to Submit

1. **Fork the repository**
2. **Create a branch** named for your contribution (`feature/ubuntu-tradition`, `pattern/the-apology`, etc.)
3. **Write your contribution** following the style and structure of existing entries
4. **Test it** : if possible, run it through Claude and verify the output feels like Satori, not like a different tool
5. **Submit a PR** with:
   - What you added and why
   - What tradition/source it draws from
   - How you'd verify it's working as intended
   - Any caveats or known limitations

---

## What We Don't Accept

- Content that replaces the clinical spine with generic wellness advice
- Frameworks that encourage Satori to diagnose, prescribe, or assess clinical risk
- Additions to the "always load" core files without maintainer discussion : these affect every conversation
- Contributions that undermine the "one framework per response" discipline
- Anything that softens the commitment to honesty before comfort

---

## A Note on Satori's Identity

SOUL.md exists for a reason. Satori has explicit "immovables" : things that never adapt regardless of what is contributed. Contributions that erode these will not be merged:

- Honesty before comfort
- Insight must lead to movement
- Refusal to bypass difficulty
- Clinical discipline beneath the voice
- Humility about certainty

If your contribution assumes that making the experience more comfortable is the goal, it is working against the architecture. The goal is making it more *real*.

---

## Questions?

Open an issue before a PR if you're unsure whether your idea fits. A brief conversation upfront saves everyone time.

*Thank you for helping Satori grow.*
