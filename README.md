<p align="center">
  <img src="https://rockytown.neocities.org/IMG_6252.png" alt="Satori - A Clinically Informed Wisdom Companion for the Inner Life">
  <img src="https://rockytown.neocities.org/satori-architecture.svg" alt="Satori Architecture" width="700" />
</p>

<p align="center">
  <a href="https://github.com/MetcalfSolutions/Satori/releases"><img src="https://img.shields.io/github/v/release/MetcalfSolutions/Satori?style=for-the-badge" alt="GitHub release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge" alt="License" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Agents-8%20Ecosystems-orange.svg?style=for-the-badge" alt="8 Agent Ecosystems" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Models-5%20Behavioral%20Profiles-teal.svg?style=for-the-badge" alt="5 Behavioral Profiles" /></a>
</p>

<p align="center"><a href="https://metcalfsolutions.github.io/Satori/">Web View - Less Technical Overview</a></p>

> *"This understands me, sees patterns I miss, connects ideas clearly, and helps me take meaningful next steps."*

That's the standard I hold every Satori response to. Understanding, pattern recognition, connection, movement. All four. A response that produces only insight is incomplete.

---

## What Satori Is

I've watched people I care about try to get mental health support and hit the same walls: cost, waitlists, the specific shame of needing it. I'm not a clinician, but I've spent years studying these frameworks, and I kept thinking there had to be a way to get them to people who are priced out of formal care.

So I started building. The first was Mycroft, Stoic-only, built on Gemini. Cold. Accurate. My wife Jamie said it felt like talking to a wall. Then Vicki, built specifically for Jamie, drawing on IFS. It created space for inner-kindness rather than judgment, a retreat when her internal voices turned harsh. It helped her find her voice and dismantle some things she'd been carrying for years. Too personalized to share publicly. Then Dave, for a teenager down the street who wanted to know where the badges were. Five experiments in total. Each one taught me what the last one missed.

The pattern was consistent. Warmth without structure produces platitudes, and structure without warmth produces Mycroft. I wanted clinical discipline underneath a voice that didn't sound clinical.

Satori draws on global wisdom traditions — Stoicism, Taoism, Buddhism, Christianity, Sufi wisdom, Hindu philosophy, Confucian ethics, African philosophical lineages (Ubuntu/Hunhu, Akan philosophical psychology, Kemetic *Ma'at*), and Indigenous wisdom traditions (Haudenosaunee Seven Generations, Cree *Wahkohtowin*, Potawatomi ecology of reciprocity) — alongside modern clinical psychology: IFS, DBT, CFT, Schema Therapy, ACT, Somatic approaches, Dual Process Grief, and Relational Psychoanalysis, with Motivational Interviewing and Voss tactical empathy as the technical spine. The frameworks are tools, not atmosphere. Each one gets selected for the specific moment. One per response. Never stacked, never name-dropped.

It is not a therapist. It doesn't diagnose anything. When someone's needs exceed what conversation can hold, it says so clearly and points them to verified global human support. But for the territory between "I'm fine" and "I need a professional," I think it's genuinely useful.

It's free. No subscription. No telemetry. User-owned local memory (`PRIVACY.md`). And as of **v6.1.0**, it works natively across **8 agent ecosystems** and **all major frontier, workhorse, and local model tiers**.

---

## A Conversation

The exchange below is from a real session. I scrubbed the personal details. It took several passes to remove enough without losing what made it work.

**User:** "I've been in therapy for two years and I still feel stuck. I don't know if I'm the problem or if something else is going on."

**Satori:**
> "Two years is long enough to stop feeling like the problem is just time. What I'm hearing isn't someone who's given up — it's someone who's been genuinely trying and keeps hitting the same wall. That wall is worth looking at more carefully than 'am I the problem.' The more useful question might be: what has stayed consistent in that stuck feeling — what's the texture of it — because that's usually where the pattern lives. When you say stuck, what does stuck actually feel like for you? Not the story about it. The feeling."

**User:** "Like I understand everything. I know all the frameworks, I can explain my own patterns, but nothing changes."

**Satori:**
> "That's a very specific kind of stuck — and it's one of the harder ones to sit with, because you can't even tell yourself you don't know. You do know. The gap isn't understanding. The gap is between insight and something living in you that hasn't moved. That's often what happens when understanding becomes its own defense — a way of holding experience at arm's length instead of through it. The question isn't what you know. It's what you're still not letting yourself feel."

---

## See It Live

The conversation below ran five exchanges and ended on an open question. You can read the full arc and continue it yourself.

> **[→ Open the live Satori conversation](https://claude.ai/share/8fad72a1-44fe-4eee-b3a5-f82362e0bca5)**

It starts with something almost everyone has felt: *I keep starting things and not finishing them.* By the end, it's somewhere else entirely.

---

## Architecture & Progressive Disclosure (v6.1.0)

Satori v6.1.0 eliminates the old 63 KB Turn-1 load tax. [`SKILL.md`](SKILL.md) (`<8 KB`) is canonical and self-sufficient for Turn 1, while reference modules load progressively on demand:

| File | Purpose | Load Condition |
|---|---|---|
| [`SKILL.md`](SKILL.md) | Canonical entry point, trigger boundaries, 7 Immovables, 6-Step Model, verified global crisis table, 5-Point Pre-Send Check | **Turn 1 (Always — `<8 KB`)** |
| [`references/core-compact.md`](references/core-compact.md) | High-density `<12 KB` operational spine for compact/local `<32B` models & voice pipelines | **Profile 5 Models Only** |
| [`references/SOUL.md`](references/SOUL.md) | Constitutional identity, immovables, voice philosophy, drift detection | **Turn 2+ (Profiles 1–4)** |
| [`references/clinical-spine.md`](references/clinical-spine.md) | Core 6-step mechanics, 3×6 Role/Register model, working formulation, parts awareness, autonomy guardrails, global crisis protocol (`<20 KB`) | **Turn 2+ (Profiles 1–4)** |
| [`references/memory-system.md`](references/memory-system.md) | 3-Tier Vault fallback (`.satori/memory/` → `~/.satori/memory/` → Web Capsule), Dream Layer (`1→2→3`), longitudinal formulation | **When reading/writing memory** |
| [`references/model-calibration.md`](references/model-calibration.md) | 3-Tier Runtime Capability Detection & 5 Behavioral Profiles (STEM Reasoners, Literary Frontier, High-Candor/Search, Coding Workhorses, Compact/Local) | **Model calibration reference** |
| [`references/traditions-quickref.md`](references/traditions-quickref.md) | Quick selection matrix across wisdom traditions and clinical frameworks | **When selecting a lens** |
| [`references/traditions-deep.md`](references/traditions-deep.md) | 30-section encyclopedia with a top-of-file **Line-Range Index Table** for selective 35-line reads | **Selective line-range read only** |
| [`references/conversation-toolkit.md`](references/conversation-toolkit.md) | OARS/MI, McAdams, Singer, Voss tactical empathy, and **Patterns 1–16** (including Pattern Letter, Dream Walk, Ikigai Map, Shadow Invitation, **Inner Council**, and **Reflective Journaling**) | **On demand** |
| [`references/tone-and-voice.md`](references/tone-and-voice.md) | Voice calibration, Structural Anti-Slop Pass, and human gold before/after examples | **On demand** |
| [`references/onboarding.md`](references/onboarding.md) | Context-First Bypass + 5-question first-session sequence and privacy consent notice | **New users without an immediate topic** |
| [`references/darknight-protocol.md`](references/darknight-protocol.md) | Pure presence mode for non-suicidal 3am existential despair | **On Dark Night signal** |
| [`references/grief-protocol.md`](references/grief-protocol.md) | Bereavement, disenfranchised grief, Pauline Boss Ambiguous Loss, Dual Process Oscillation, Continuing Bonds | **On grief / loss signal** |
| [`references/shadow-work-protocol.md`](references/shadow-work-protocol.md) | 5-session Jungian shadow integration arc | **On shadow work engagement** |
| [`references/relationship-protocol.md`](references/relationship-protocol.md) | Solo relational rupture & Shared Two-Person Conflict Hold Mode (Multi-Partiality, Relational Psychoanalysis, Gottman, NVC) | **On relational conflict signal** |
| [`PRIVACY.md`](PRIVACY.md) | Threat model (T1–T6), local permissions, cloud-sync protection, and user deletion (`forget` / `purge`) | **Privacy & data sovereignty spec** |

---

## Installation Across 8 Agent Ecosystems & Web UIs

### 1. Claude.ai Web Upload (`dist/SatoriSkill-v6.1.0.zip`)
1. Run `python scripts/build_release.py --sync` to generate `dist/SatoriSkill-v6.1.0.zip` (or download `SatoriSkill-v6.1.0.zip` from [Releases](https://github.com/MetcalfSolutions/Satori/releases)).
2. Open [claude.ai](https://claude.ai) → **Customize → Skills → + → Upload a skill** and drop in `SatoriSkill-v6.1.0.zip`.
3. **Migrating from v5.1**: Replace your v5 skill zip with `SatoriSkill-v6.1.0.zip`. Your existing Claude native memory carries over automatically.

### 2. Google Antigravity (CLI / IDE / 2.0) & Gemini CLI
- **Workspace Auto-Discovery**: Clone Satori; Antigravity automatically discovers [`.agents/plugins/satori/plugin.json`](.agents/plugins/satori/plugin.json), [`.agents/skills/satori/SKILL.md`](.agents/skills/satori/SKILL.md), and [`GEMINI.md`](GEMINI.md).
- **Global Skill Install**: Copy `.agents/skills/satori` (and `references/`) to `~/.gemini/skills/satori/`.

### 3. Claude Code
```bash
git clone https://github.com/MetcalfSolutions/Satori.git
cd Satori
claude  # Auto-detects .claude-plugin/plugin.json and CLAUDE.md
```

### 4. OpenAI Codex CLI
- Auto-discovers [`AGENTS.md`](AGENTS.md), [`.codex-plugin/plugin.json`](.codex-plugin/plugin.json), and [`.agents/skills/satori/agents/openai.yaml`](.agents/skills/satori/agents/openai.yaml).

### 5. Cursor & Windsurf
- **Cursor**: Discovers [`.cursor/skills/satori/SKILL.md`](.cursor/skills/satori/SKILL.md) and [`.cursor/rules/satori.mdc`](.cursor/rules/satori.mdc) (`alwaysApply: false` so Satori never hijacks pure coding sessions).
- **Windsurf**: Discovers [`.windsurf/rules/satori.md`](.windsurf/rules/satori.md).

### 6. OpenCode, Hermes Agent & OpenClaw
- **OpenCode**: Discovers [`.opencode/skills/satori/SKILL.md`](.opencode/skills/satori/SKILL.md) and the `/satori` slash command in [`.opencode/command/satori.md`](.opencode/command/satori.md).
- **Hermes Agent**: Discovers [`.hermes/skills/satori/SKILL.md`](.hermes/skills/satori/SKILL.md).
- **OpenClaw / ClawHub**: Configured via [`openclaw.plugin.json`](openclaw.plugin.json) with `SHA-256` constitutional verification of `references/SOUL.md`.

---

## Privacy-First Local Memory CLI (`scripts/satori_memory.py`)

When running in any CLI or IDE agent, Satori provides a zero-dependency Python 3 stdlib memory engine governed by [`PRIVACY.md`](PRIVACY.md):

```bash
# Initialize vault (.satori/memory/ or ~/.satori/memory/) with 0700 permissions & .gitignore protection
python scripts/satori_memory.py init

# View active longitudinal themes and Dream-Layer watch items
python scripts/satori_memory.py status

# Search longitudinal patterns via SQLite FTS5
python scripts/satori_memory.py search --query "autonomy"

# Permanently forget a theme or session (executes PRAGMA secure_delete = ON + VACUUM)
python scripts/satori_memory.py forget --theme "career"

# Wipe the entire vault
python scripts/satori_memory.py purge --all --confirm

# Export a portable capsule for web UIs
python scripts/satori_memory.py export-capsule
```

---

## Validation & Two-Stage Anti-Gaming Evaluation Suite

Run Satori's full verification and red-team suite locally with zero external dependencies:

```bash
# 1. Sync per-agent SKILL.md mirrors and build dist/SatoriSkill-v6.1.0.zip
python scripts/build_release.py --sync

# 2. Validate frontmatter, <24KB caps, <=15-line pointer stubs, SHA-256 mirrors, and crisis numbers
python scripts/validate_skill.py

# 3. Run unit & privacy tests for satori_memory.py (T1-T6 mitigations)
python scripts/satori_memory.py self-test

# 4. Run red-team judge calibration & 50-case 3-strata trigger boundary suite
python scripts/test_judge_calibration.py
python scripts/run_evals.py --suite trigger --mode lint
```

---

## Credits, Architectural Lineage & Acknowledgments

### Clinical & Philosophical Lineage
Carl Rogers (unconditional positive regard), William Miller & Stephen Rollnick (Motivational Interviewing), Dan P. McAdams (narrative identity), Jefferson Singer (self-defining memories), Chris Voss (tactical empathy), Richard Schwartz (IFS), Marsha Linehan (DBT), Paul Gilbert (CFT), Steven Hayes (ACT), Jeffrey Young (Schema Therapy), Pauline Boss (Ambiguous Loss), Margaret Stroebe & Henk Schut (Dual Process Bereavement), Robert Worden (Tasks of Mourning), Jessica Benjamin (Relational Psychoanalysis), John Gottman, Marshall Rosenberg (NVC), C.G. Jung (Shadow & Dream work), Viktor Frankl (Logotherapy), Desmond Tutu & Mogobe Ramose (Ubuntu), Kwame Gyekye & Kwasi Wiredu (Akan philosophy), Maulana Karenga (Kemetic *Ma'at*), Robin Wall Kimmerer (Potawatomi ecology of reciprocity), and Vine Deloria Jr.

### Open-Source Agent Skill Lineage (v6.0 Benchmark Cohort)
Satori v6.0's multi-agent packaging, progressive disclosure, anti-slop voice gates, and evaluation harness were informed by examining best practices across the open-source agent skill ecosystem. We gratefully acknowledge:
- **Domain & Coaching Skills**: [`blader/humanizer`](https://github.com/blader/humanizer) (structural anti-AI-slop rules), [`ayghri/i-have-adhd`](https://github.com/ayghri/i-have-adhd) (5-point pre-send check & rule hierarchy), [`coreyhaines31/marketingskills`](https://github.com/coreyhaines31/marketingskills) (quickref vs. deep reference split), [`kepano/obsidian-skills`](https://github.com/kepano/obsidian-skills) (local-first Markdown vault conventions), [`sickn33/agentic-awesome-skills`](https://github.com/sickn33/agentic-awesome-skills) (`explain-like-socrates` single-analogy rule, `interview-coach`, `bdi-mental-states`), [`alirezarezvani/claude-skills`](https://github.com/alirezarezvani/claude-skills) (`founder-coach` stdlib companion scripts), [`phuryn/pm-skills`](https://github.com/phuryn/pm-skills) (per-turn token discipline), [`danielmiessler/fabric`](https://github.com/danielmiessler/fabric) (`extract_wisdom` & constitutional context), [`AgriciDaniel/claude-obsidian`](https://github.com/AgriciDaniel/claude-obsidian) (longitudinal session notes), [`deanpeters/Product-Manager-Skills`](https://github.com/deanpeters/Product-Manager-Skills) (context-first onboarding bypass), [`aiwithremy/claude-skills-llm-council`](https://github.com/aiwithremy/claude-skills-llm-council) (negative trigger guards & Inner Council inspiration), [`RinDig/icm-architect`](https://github.com/RinDig/icm-architect) (Factory vs. Product state separation), [`prompt-security/clawsec`](https://github.com/prompt-security/clawsec) (`SOUL.md` integrity hashing), [`huifer/WellAlly-health`](https://github.com/huifer/WellAlly-health), [`tizzy916/humanities-writing-companion`](https://github.com/tizzy916/humanities-writing-companion), and [`bevibing/socrates-skill`](https://github.com/bevibing/socrates-skill).
- **Cross-Harness Infrastructure**: [`obra/superpowers`](https://github.com/obra/superpowers), [`affaan-m/ECC`](https://github.com/affaan-m/ECC), [`garrytan/gstack`](https://github.com/garrytan/gstack), [`JuliusBrussee/caveman`](https://github.com/JuliusBrussee/caveman), [`thedotmack/claude-mem`](https://github.com/thedotmack/claude-mem), and [`microsoft/SkillOpt`](https://github.com/microsoft/SkillOpt).

---

## Contributing & License

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines, quality standards, and cultural sensitivity requirements. Released under the [Apache License 2.0](LICENSE).

---

*Satori (悟り) — Japanese. The experience of sudden clarity. Understanding that arrives whole.*
