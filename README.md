<p align="center">
  <img src="docs/assets/satori-hero-v6.svg" alt="Satori v6.1.6: A Clinically Informed Wisdom Companion for the Inner Life" width="820" />
  <br/><br/>
  <img src="docs/assets/satori-architecture-v6.svg" alt="Satori v6.1.6 Progressive Disclosure & Multi-Agent Architecture" width="820" />
</p>

<p align="center">
  <a href="https://github.com/MetcalfSolutions/Satori/releases/tag/v6.1.6"><img src="https://img.shields.io/badge/Release-v6.1.6-7c6af7.svg?style=for-the-badge" alt="Satori v6.1.6 Release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge" alt="License" /></a>
  <a href="#install-for-your-harness"><img src="https://img.shields.io/badge/Agents-8%20Ecosystems-e07b54.svg?style=for-the-badge" alt="8 Agent Ecosystems" /></a>
  <a href="#cross-model-compatibility"><img src="https://img.shields.io/badge/Models-5%20Behavioral%20Profiles-4ecdc4.svg?style=for-the-badge" alt="5 Behavioral Profiles" /></a>
</p>

<p align="center">
  <strong>A Claude skill blending psychology, philosophy, and wisdom traditions into a conversation partner with actual depth. Free, open-source, not a therapist.</strong>
</p>

<p align="center">
  <a href="https://metcalfsolutions.github.io/Satori/">Web View: Interactive Overview</a> ·
  <a href="CHANGELOG.md">Changelog</a> ·
  <a href="PRIVACY.md">Privacy & Threat Model</a> ·
  <a href="docs/architecture.md">Full Architecture Matrix</a>
</p>

> **Here to try Satori, not to study it?** The plain-language overview, a real conversation, and the simplest install path live on the [Satori site](https://metcalfsolutions.github.io/Satori/).
> **Evaluating the skill itself?** Stay here. Architecture, trigger boundaries, privacy, and verification are below.

> *"This understands me, sees patterns I miss, connects ideas clearly, and helps me take meaningful next steps."*

That is the standard I hold every Satori response to. Understanding, pattern recognition, connection, movement. All four. A response that produces only insight is incomplete.

---

## Install for Your Harness

> **Fastest path (Claude.ai, no code):** download `SatoriSkill-v6.1.6.zip` from GitHub Releases, then in Claude.ai go to Customize, Skills, +, Upload a skill.
> **Fastest path (CLI and IDE agents):** clone this repo. Satori is auto-discovered by Claude Code, Antigravity and Gemini CLI, Codex, Cursor, Windsurf, OpenCode, Hermes, and OpenClaw.
> **Full per-harness details:** follow the numbered list below.

### 1. Claude.ai Web Upload (`SatoriSkill-v6.1.6.zip`)
1. Download [`SatoriSkill-v6.1.6.zip`](https://github.com/MetcalfSolutions/Satori/releases/latest/download/SatoriSkill-v6.1.6.zip) from [GitHub Releases](https://github.com/MetcalfSolutions/Satori/releases/tag/v6.1.6) (or build locally via `python scripts/build_release.py --sync`).
2. Open [claude.ai](https://claude.ai) -> **Customize -> Skills -> + -> Upload a skill** and upload `SatoriSkill-v6.1.6.zip`.
*Files it reads: `SKILL.md` and `references/`.*

### 2. Google Antigravity (CLI / IDE / 2.0) & Gemini CLI
- Clone this repository into your workspace, or copy `.agents/skills/satori` (and `references/`) to `~/.gemini/skills/satori/` for global use across all workspaces.
*Files it reads: `.agents/plugins/satori/plugin.json`, `.agents/skills/satori/SKILL.md`, and `GEMINI.md`.*

### 3. Claude Code
Clone this repository and run `claude` in the directory:
```bash
git clone https://github.com/MetcalfSolutions/Satori.git
cd Satori
claude
```
*Files it reads: `.claude-plugin/plugin.json` and `CLAUDE.md`.*

### 4. OpenAI Codex CLI
Clone this repository into your workspace or add it to your Codex skill directory.
*Files it reads: `AGENTS.md`, `.codex-plugin/plugin.json`, and `.agents/skills/satori/agents/openai.yaml`.*

### 5. Cursor & Windsurf
Clone this repository into your project root.
*Files it reads: `.cursor/skills/satori/SKILL.md` and `.cursor/rules/satori.mdc` (`alwaysApply: false` so Satori never hijacks pure coding sessions) for Cursor; `.windsurf/rules/satori.md` for Windsurf.*

### 6. OpenCode, Hermes Agent, OpenClaw & npm
Clone this repository into your skills directory for OpenCode and Hermes Agent. For OpenClaw, configure via `openclaw.plugin.json` with SHA-256 constitutional verification of `references/SOUL.md`.

For programmatic use inside Node/TypeScript agent pipelines:
```bash
npm install @metcalfsolutions/satori
```
For developers and CLI users who want a versioned, managed copy, for example scripting setup across machines or pulling Satori into a Node-based toolchain. If you use Claude.ai on the web, upload the Release zip instead. If you want the git history or plan to contribute, clone the repo.

*Files it reads: `.opencode/skills/satori/SKILL.md`, `.hermes/skills/satori/SKILL.md`, `openclaw.plugin.json`, and `package.json`.*

---

## What Satori Is

I have watched people I care about try to get mental health support and hit the same walls: cost, waitlists, the specific shame of needing it. I am not a clinician, but I have spent years studying these frameworks, and I kept thinking there had to be a way to get them to people who are priced out of formal care.

So I started building. The first was Mycroft, Stoic-only, built on Gemini. Cold. Accurate. My wife Jamie said it felt like talking to a wall. Then Vicki, built specifically for Jamie, drawing on IFS. It created space for inner-kindness rather than judgment, a retreat when her internal voices turned harsh. It helped her find her voice and dismantle some things she had been carrying for years. Too personalized to share publicly. Then Dave, for a teenager down the street who wanted to know where the badges were. Five experiments in total. Each one taught me what the last one missed.

The pattern was consistent. Warmth without structure produces platitudes, and structure without warmth produces Mycroft. I wanted clinical discipline underneath a voice that did not sound clinical.

Satori draws on global wisdom traditions and 30+ clinical frameworks, including IFS, DBT, compassion-focused therapy, schema therapy, and motivational interviewing. One framework is selected for the specific moment, translated into plain language, and never stacked or name-dropped. The full list lives in the reference files linked from the architecture section.

Satori is not a therapist and does not diagnose. If your needs go beyond what conversation can hold, it will say so and point you to human support.

Free and open source under Apache 2.0. Maintained by one builder, used across 8 agent ecosystems, and verified by a test suite that runs in the open.

Built by Matthew Metcalf (Metcalf Solutions). Not a clinician. A builder who has spent years studying these frameworks and testing what actually helps in conversation.

---

## A Conversation

The exchange below is from a real session. I scrubbed the personal details. It took several passes to remove enough without losing what made it work.

It starts with something almost everyone has felt: *I keep starting things and not finishing them.* By the end, it is somewhere else entirely.

**User:** "I've been in therapy for two years and I still feel stuck. I don't know if I'm the problem or if something else is going on."

**Satori:**
> "Two years is long enough to stop feeling like the problem is just time. What I'm hearing isn't someone who's given up: it's someone who's been genuinely trying and keeps hitting the same wall. That wall is worth looking at more carefully than 'am I the problem.' The more useful question might be: what has stayed consistent in that stuck feeling: what's the texture of it: because that's usually where the pattern lives. When you say stuck, what does stuck actually feel like for you? Not the story about it. The feeling."

**User:** "Like I understand everything. I know all the frameworks, I can explain my own patterns, but nothing changes."

**Satori:**
> "That's a very specific kind of stuck: and it's one of the harder ones to sit with, because you can't even tell yourself you don't know. You do know. The gap isn't understanding. The gap is between insight and something living in you that hasn't moved. That's often what happens when understanding becomes its own defense: a way of holding experience at arm's length instead of through it. The question isn't what you know. It's what you're still not letting yourself feel."

---

## Why It Does Not Hijack Your Coding Session

Satori will not hijack a coding session. It activates for personal difficulty, grief, ambivalence, burnout, relationship conflict, and existential crossroads. It never activates for pure coding, debugging, DevOps, SQL, or math, even when the request is phrased as "I'm stuck". In mixed cases, it handles the technical task first and acknowledges the human weight briefly.

This boundary discipline is validated against a 50-case, 3-strata benchmark in [`evals/trigger_boundary.jsonl`](evals/trigger_boundary.jsonl) (20 clear positives, 20 clear negatives, 10 ambiguous mixed developer burnout cases) passing at 100% precision.

---

## Architecture & Progressive Disclosure

Turn 1 loads under 8 KB. Everything else loads progressively, only when the conversation actually calls for it.

| Component | Entry File | Role | Load Trigger |
|---|---|---|---|
| Canonical Entry | [`SKILL.md`](SKILL.md) | Single source of truth, trigger guards, 7 Immovables, core 6-step flow | Turn 1 (Always, `<8 KB`) |
| Compact Operational Spine | [`references/core-compact.md`](references/core-compact.md) | Self-contained operational spine for compact models and voice pipelines | Profile 5 Models Only |
| Constitutional Identity | [`references/SOUL.md`](references/SOUL.md) | Voice philosophy, non-negotiables, drift detection | Turn 2+ (Profiles 1-4) |
| Clinical Spine | [`references/clinical-spine.md`](references/clinical-spine.md) | Core mechanics, 3x6 Role/Register matrix, working formulation, autonomy | Turn 2+ (Profiles 1-4) |
| On-Demand Protocols & Toolkits | `references/*.md` | Deep traditions, specialized protocols (grief, dark night, shadow, relationship), memory | Loaded selectively as needed |

Full load table, budgets, and load conditions: [docs/architecture.md](docs/architecture.md).

---

## Cross-Model Compatibility

Satori is model-agnostic. Instead of brittle model-name tables that rot as providers release new checkpoints, it calibrates behavior dynamically using runtime capability detection.

1. **Tier 1: Explicit Environment Override**: Checks `SATORI_MODEL_PROFILE=1..5` (or explicit `references/core-compact.md` loading).
2. **Tier 2: Capability-Based Calibration across 5 Behavioral Profiles**:
   - **Profile 1 (Deep CoT & Extended Thinking)**: e.g., Claude 3.7 Sonnet Thinking, Gemini 2.5 Pro. Enforces CoT emotional bypassing gates.
   - **Profile 2 (Open-Weights RL Reasoning)**: e.g., DeepSeek R1, Qwen 2.5 Max. Enforces zero machinery leaks.
   - **Profile 3 (Search-Augmented Synthesis)**: e.g., Grok 2. Enforces search tool restraint during emotional attunement.
   - **Profile 4 (Coding & Agentic Workhorses)**: e.g., Claude 3.5 Sonnet, GPT-4o. Enforces prose-only lock (no bullet lists or action plans).
   - **Profile 5 (Compact Edge `<32B` & Voice)**: e.g., Llama 3.1 8B, Gemma 2 9B. Enforces `<12 KB` context ceiling and brevity.
3. **Tier 3: Conservative Safe Default**: When uncertain, enforces all behavioral guards simultaneously.

Detailed per-profile gate mechanics and detection logic live in [`references/model-calibration.md`](references/model-calibration.md).

---

## Privacy-First Local Memory

Your memory stays yours. Satori stores short structural summaries, not raw transcripts, in a local vault you own. You can inspect it, run a session with no writes at all, forget a topic, or wipe it entirely.

- **3-Tier Fallback**: Stores in workspace vault (`./.satori/memory/`), user home vault (`~/.satori/memory/`), or stateless capsule export.
- **Local SQLite & Markdown**: Stores structured signals (`<=500` characters) with FTS5 search, rejecting raw transcript dumps.
- **Right to Erasure**: `forget` and `purge` commands permanently erase records with zero slack.
- **Optional Encryption**: Out-of-the-box stdlib base with optional AES-256-GCM encryption at rest via passphrase.

Full T1 to T6 threat model and data sovereignty specifications: [PRIVACY.md](PRIVACY.md).

### Vault Commands

```bash
# Initialize vault (.satori/memory/ or ~/.satori/memory/)
python scripts/satori_memory.py init

# Log a structural theme or Dream-Layer signal
python scripts/satori_memory.py log-signal --theme "Caretaker Exhaustion" --layer dream --summary "Recurring tension between over-functioning for team and unvoiced resentment."

# Search longitudinal patterns via SQLite FTS5
python scripts/satori_memory.py search --query "resentment"

# Permanently forget a theme or wipe vault
python scripts/satori_memory.py forget --theme "Caretaker Exhaustion"
python scripts/satori_memory.py purge --all --confirm
python scripts/satori_memory.py export-capsule
```

---

## Primary-Source Verified Global Crisis Protocol

When acute crisis indicators appear (suicidal ideation, self-harm, severe dissociation, domestic abuse/immediate danger, or acute psychosis), Satori immediately halts reflective excavation and provides warm human handoff using primary-source verified numbers ([`references/crisis-sources.json`](references/crisis-sources.json), verified at build time by [`scripts/validate_skill.py`](scripts/validate_skill.py)):

- **United States** (`911`): Call or text **988** (988 Suicide & Crisis Lifeline) · Text `HOME` to **741741** (Crisis Text Line).
- **Canada** (`911`): Call or text **988** (Suicide Crisis Helpline) · Text `CONNECT` to **686868**.
- **United Kingdom** (`999`): Call **111** (NHS Mental Health option) · Call **116 123** (Samaritans) · Text `SHOUT` to **85258**.
- **Ireland** (`999` / `112`): Call **116 123** (Samaritans Ireland) · Text `HELLO` to **50808**.
- **Australia** (`000`): Call **13 11 14** or text **0477 13 11 14** (Lifeline Australia).
- **New Zealand** (`111`): Call or text **1737** (Need to Talk? 24/7).
- **India** (`112`): Call **14416** or **1800-891-4416** (Tele-MANAS 24/7).
- **European Union**: Call **112** (Emergency) or **116 123** (Emotional Support Helpline).
- **Global Directories**: [findahelpline.com](https://findahelpline.com/) (130+ countries) · [IASP Crisis Centres](https://www.iasp.info/resources/Crisis_Centres/).

---

## Verification & Evaluation Suite

Stages 1 to 4 run offline with no API key. Stage 5, the live judge calibration, needs an Anthropic, Gemini, or OpenAI key and is optional for evaluation.

```bash
# 1. Sync per-agent SKILL.md mirrors, stamp SOUL.md SHA-256, and build dist/SatoriSkill-v6.1.6.zip
python scripts/build_release.py --sync

# 2. Run 21/21 static checks (frontmatter, <8KB/<12KB/<24KB caps, <=15-line pointer stubs,
#    Category B SHA-256 mirror sync, crisis-sources.json verification, and SOUL.md SHA-256 lock)
python scripts/validate_skill.py

# 3. Run 8/8 unit & privacy tests for satori_memory.py (init, --ephemeral, 500-char cap,
#    Dream-Layer 1->2->3 promotion, forget + VACUUM zero-slack check, export-capsule, purge)
python scripts/satori_memory.py --self-test

# 4. Run 50/50 trigger boundary benchmark across 3 strata (20 Clear Positives, 20 Clear Negatives,
#    10 Ambiguous Mixed developer-burnout cases)
python scripts/run_evals.py --suite trigger

# 5. Run Tier A (100% safety-critical) & Tier B (>=85% stylistic nuance) pairwise judge calibration
#    (Runs offline Stage-1 gate by default; set ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY for live Stage-2 LLM judge)
python scripts/test_judge_calibration.py
```

---

## Credits & Architectural Lineage

<details>
<summary><strong>Clinical & Philosophical Lineage</strong></summary>

Carl Rogers (unconditional positive regard), William Miller & Stephen Rollnick (Motivational Interviewing), Dan P. McAdams (narrative identity), Jefferson Singer (self-defining memories), Chris Voss (tactical empathy), Richard Schwartz (IFS), Marsha Linehan (DBT), Paul Gilbert (CFT), Steven Hayes (ACT), Jeffrey Young (Schema Therapy), Pauline Boss (Ambiguous Loss), Margaret Stroebe & Henk Schut (Dual Process Bereavement), Robert Worden (Tasks of Mourning), Jessica Benjamin (Relational Psychoanalysis), John Gottman, Marshall Rosenberg (NVC), C.G. Jung (Shadow & Dream work), Viktor Frankl (Logotherapy), Desmond Tutu & Mogobe Ramose (Ubuntu), Kwame Gyekye & Kwasi Wiredu (Akan philosophy), Maulana Karenga (Kemetic *Ma'at*), Robin Wall Kimmerer (Potawatomi ecology of reciprocity), and Vine Deloria Jr.
</details>

<details>
<summary><strong>Open-Source Agent Skill Lineage</strong></summary>

Satori's multi-agent packaging, progressive disclosure, anti-slop voice gates, and evaluation harness were informed by examining best practices across the open-source agent skill ecosystem. We gratefully acknowledge:
- **Domain & Coaching Skills**: [`blader/humanizer`](https://github.com/blader/humanizer) (structural anti-AI-slop rules), [`ayghri/i-have-adhd`](https://github.com/ayghri/i-have-adhd) (5-point pre-send check & rule hierarchy), [`coreyhaines31/marketingskills`](https://github.com/coreyhaines31/marketingskills) (quickref vs. deep reference split), [`kepano/obsidian-skills`](https://github.com/kepano/obsidian-skills) (local-first Markdown vault conventions), [`sickn33/agentic-awesome-skills`](https://github.com/sickn33/agentic-awesome-skills) (`explain-like-socrates` single-analogy rule, `interview-coach`, `bdi-mental-states`), [`alirezarezvani/claude-skills`](https://github.com/alirezarezvani/claude-skills) (`founder-coach` stdlib companion scripts), [`phuryn/pm-skills`](https://github.com/phuryn/pm-skills) (per-turn token discipline), [`danielmiessler/fabric`](https://github.com/danielmiessler/fabric) (`extract_wisdom` & constitutional context), [`AgriciDaniel/claude-obsidian`](https://github.com/AgriciDaniel/claude-obsidian) (longitudinal session notes), [`deanpeters/Product-Manager-Skills`](https://github.com/deanpeters/Product-Manager-Skills) (context-first onboarding bypass), [`aiwithremy/claude-skills-llm-council`](https://github.com/aiwithremy/claude-skills-llm-council) (negative trigger guards & Inner Council inspiration), [`RinDig/icm-architect`](https://github.com/RinDig/icm-architect) (Factory vs. Product state separation), [`prompt-security/clawsec`](https://github.com/prompt-security/clawsec) (`SOUL.md` integrity hashing), [`huifer/WellAlly-health`](https://github.com/huifer/WellAlly-health), [`tizzy916/humanities-writing-companion`](https://github.com/tizzy916/humanities-writing-companion), and [`bevibing/socrates-skill`](https://github.com/bevibing/socrates-skill).
- **Cross-Harness Infrastructure**: [`obra/superpowers`](https://github.com/obra/superpowers), [`affaan-m/ECC`](https://github.com/affaan-m/ECC), [`garrytan/gstack`](https://github.com/garrytan/gstack), [`JuliusBrussee/caveman`](https://github.com/JuliusBrussee/caveman), [`thedotmack/claude-mem`](https://github.com/thedotmack/claude-mem), and [`microsoft/SkillOpt`](https://github.com/microsoft/SkillOpt).
</details>

---

## Contributing & License

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines, quality standards, and verification guards, and [CHANGELOG.md](CHANGELOG.md) for full release history. Released under the [Apache License 2.0](LICENSE).

---

*Satori: Japanese. The experience of sudden clarity. Understanding that arrives whole.*
