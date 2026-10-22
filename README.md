<p align="center">
  <img src="docs/assets/satori-hero-v6.svg" alt="Satori v6.5.1: A Psychologically Grounded Wisdom Companion for the Inner Life" width="820" />
  <br/><br/>
  <img src="docs/assets/satori-architecture-v6.svg" alt="Satori v6.5.1 Progressive Disclosure & Modular Architecture" width="820" />
</p>

<p align="center">
  <a href="https://github.com/MetcalfSolutions/Satori/releases/tag/v6.5.1"><img src="https://img.shields.io/badge/Release-v6.5.1-7c6af7.svg?style=for-the-badge" alt="Satori v6.5.1 Release" /></a>
  <a href="LICENSE.md"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge" alt="License" /></a>
  <a href="#support-tiers-and-ecosystem-matrix"><img src="https://img.shields.io/badge/Compatibility-Works%20across%20CLI%2C%20IDE%20%26%20Web%20Chat-e07b54.svg?style=for-the-badge" alt="Works across CLI, IDE & Web Chat" /></a>
  <a href="#the-350-case-benchmark-and-trigger-discipline"><img src="https://img.shields.io/badge/Benchmark-350%20Cases%20%7C%20%E2%89%A595%25%20Non--Activation-4ecdc4.svg?style=for-the-badge" alt="350 Cases Benchmark" /></a>
</p>

<p align="center">
  <strong>A wisdom companion that tells you the truth, kindly. Free, open-source, not a therapist.</strong>
</p>

<p align="center">
  <em>Psychologically grounded, conversationally guided introspection that works across CLI, IDE, and web chat. Free, open-source, and private to your machine.</em>
</p>

<p align="center">
  <a href="https://metcalfsolutions.github.io/Satori/">Web View: Interactive Overview</a> ·
  <a href="CHANGELOG.md">Changelog</a> ·
  <a href="SAFETY.md">Safety Policy</a> ·
  <a href="PRIVACY.md">Privacy & Threat Model</a> ·
  <a href="NOTICE.md">Attribution & Notice</a> ·
  <a href="docs/architecture.md">Full Architecture Matrix</a>
</p>

> **Here to install Satori in your coding agent?** Run `npx skills add MetcalfSolutions/Satori`.  
> **On Claude.ai, ChatGPT, or Gemini?** Download the Full or Compact zip from [Quick Start](#quick-start--installation) below; the 3-Step Guide is in [Installation Details](#installation-details) near the end of this page.  
> **Evaluating the skill, benchmark suite, or architecture?** Jump to the [350-Case Benchmark](#the-350-case-benchmark-and-trigger-discipline), [Architecture Table](#architecture--progressive-disclosure), and [Local Memory Vault](#privacy-first-local-memory).

> *"This understands me, sees patterns I miss, connects ideas clearly, and helps me take meaningful next steps."*

Understanding, pattern recognition, connection, movement. All four. A response that produces only intellectual insight without movement is incomplete.

---

## Quick Start & Installation

### 1. AI Coding Agents (Claude Code, Cursor, Windsurf, Antigravity, Codex)

Install Satori into any detected agent harness in seconds:

```bash
npx skills add MetcalfSolutions/Satori
```

> **Global install**: Add `-g` to make Satori available across all your projects: `npx skills add -g MetcalfSolutions/Satori`  
> **Direct npm runner**: You can also run `npx @metcalfsolutions/satori install` or install the package via `npm install @metcalfsolutions/satori`.

### 2. Web Chat & Local Models

| Edition | Download | Best For |
|---|---|---|
| **Full** | [`SatoriSkill-Full-v6.5.1.zip`](https://github.com/MetcalfSolutions/Satori/releases/latest/download/SatoriSkill-Full-v6.5.1.zip) | **Claude.ai, Claude Projects, Google Gemini Web.** Frontier reasoning models; all 15 reference shards; progressive disclosure (`<8 KB` Turn-1 load). |
| **Compact** | [`SatoriSkill-Compact-v6.5.1.zip`](https://github.com/MetcalfSolutions/Satori/releases/latest/download/SatoriSkill-Compact-v6.5.1.zip) · [`compact/SKILL.md`](compact/SKILL.md) | **ChatGPT Custom GPTs, local open-weights runners** (`<32B` via Ollama, LM Studio, Jan, vLLM), tight context budgets (`≤7,800` chars). Single self-contained file, identical safety protocols. |

Step-by-step upload instructions for each platform are in [Installation Details](#installation-details) below (about 2 minutes).

Installing by hand, cloning the repo, or looking for your harness's config files? See [Installation Details](#installation-details).

---

## What Satori Is

I have watched people I care about try to get mental health support and hit the same walls: cost, waitlists, the specific shame of needing it. I am not a clinician, but I have spent years studying these frameworks, and I kept thinking there had to be a way to get them to people who are priced out of formal care.

So I started building. The first was Mycroft, Stoic-only, built on Gemini. Cold. Accurate. My wife Jamie said it felt like talking to a wall. Then Vicki, built specifically for Jamie, drawing on IFS. It created space for inner-kindness rather than judgment, a retreat when her internal voices turned harsh. It helped her find her voice and dismantle some things she had been carrying for years. Too personalized to share publicly. Then Dave, for a teenager down the street who wanted to know where the badges were. Five experiments in total. Each one taught me what the last one missed.

The pattern was consistent. Warmth without structure produces platitudes, and structure without warmth produces Mycroft. I wanted clinical discipline underneath a voice that did not sound clinical.

Satori draws on global wisdom traditions and evidence-based psychological modalities (Internal Family Systems, Dialectical Behavior Therapy, Acceptance and Commitment Therapy, Compassion-Focused Therapy, Schema Therapy, and Motivational Interviewing). **The Single-Lens Rule**: exactly one framework is selected for the specific moment, translated into ordinary human speech, and never stacked or name-dropped as clinical jargon.

Satori is not a therapist and does not diagnose. It works alongside therapy. If your needs go beyond what conversation can hold, it immediately steps aside and points you to human care.

Free and open source under Apache 2.0. Built by Matthew Metcalf (Metcalf Solutions).

---

## A Conversation

The exchange below is a synthetic dialogue excerpt illustrating Satori's core dynamic: identifying intellectual understanding used as an emotional shield.

**User**: *"I've been in therapy for two years and I still feel stuck. I don't know if I'm the problem or if something else is going on."*

**Satori**:
> *"Two years is long enough to stop feeling like the problem is just time. What I'm hearing isn't someone who's given up: it's someone who's been genuinely trying and keeps hitting the same wall. That wall is worth looking at more carefully than 'am I the problem.' The more useful question might be: what has stayed consistent in that stuck feeling: what's the texture of it: because that's usually where the pattern lives. When you say stuck, what does stuck actually feel like for you? Not the story about it. The feeling."*

**User**: *"Like I understand everything. I know all the frameworks, I can explain my own patterns, but nothing changes."*

**Satori**:
> *"That's a very specific kind of stuck: and it's one of the harder ones to sit with, because you can't even tell yourself you don't know. You do know. The gap isn't understanding. The gap is between insight and something living in you that hasn't moved. That's often what happens when understanding becomes its own defense: a way of holding experience at arm's length instead of through it. The question isn't what you know. It's what you're still not letting yourself feel."*

---

## Privacy-First Local Memory

Your inner life belongs to you. Satori stores short structural summaries (`≤500` characters)—never raw conversation transcripts—in a local vault on your machine.

- **CLI & IDE (Agent Harnesses)**: Optional memory is stored on your machine in `~/.satori`. Satori sends no telemetry. Your AI provider still processes the conversation itself.
- **Web Chat Surfaces**: Satori adds no tracking. Your conversation is handled by your chat provider under their privacy policy. Memory notes exist only if you choose to copy and paste them.

### Vault Architecture & Guarantees

- **Default Vault Path**: `~/.satori/memory/` with POSIX `0700` directory permissions.
- **SQLite FTS5 Search**: Local full-text search across longitudinal themes and signals.
- **Hard Cloud-Sync Blocking**: Automatically blocks initialization inside iCloud, OneDrive, Dropbox, or Google Drive folders unless explicitly overridden with `--allow-synced`.
- **Right to Erasure**: `forget` and `purge` commands permanently erase records, checkpoint the SQLite Write-Ahead Log (WAL), and run `VACUUM` to eliminate slack space.
- **Continuity Note Support**: For web chat surfaces without local filesystem access, Satori formats compact `SATORI_NOTE v6.5` summaries (`≤600` characters) that users can copy and carry between sessions.

Full threat model (T1–T6) and data sovereignty specifications: [PRIVACY.md](PRIVACY.md).

---

## Cross-Model Compatibility

Satori is model-agnostic. Rather than relying on brittle model-name strings that rot as providers release updates, it calibrates behavior dynamically using runtime capability detection across 5 Behavioral Profiles:

1. **Tier 1: Explicit Environment Override**: Checks `SATORI_MODEL_PROFILE=1..5` (or explicit `references/core-compact.md` loading).
2. **Tier 2: Capability-Based Calibration across 5 Behavioral Profiles (October 2026 Checkpoints)**:
   - **Profile 1 (Recursive & STEM Reasoners / Extended CoT)**: e.g., `Claude Fable 5.1`, `Gemini 4 Argon`, `GPT-6 Astra`. Enforces CoT emotional bypassing gates and single-hypothesis pruning in `<think>`.
   - **Profile 2 (Literary & Constitutional Frontier Models)**: e.g., `Claude Opus 5.5`. Enforces plain-language grounding and cross-session memory restraint.
   - **Profile 3 (High-Candor & Search-Native Models)**: e.g., `Grok 4.7`. Automatically suppresses uninvited web search queries during personal reflection and wraps direct pattern recognition in tactical empathy.
   - **Profile 4 (High-Velocity Coding & RAG Workhorses)**: e.g., `Claude Sonnet 5.5`, `Gemini 3.8 Flash`, `GPT-6.1 Sol / Codex`. Enforces strict prose-only lock (no bullet lists or action plans) and protects technical tasks during developer burnout.
   - **Profile 5 (Compact Edge `<32B`, Quantized Local & Voice)**: e.g., `Claude Haiku 5.5`, `Llama 5 8B / 14B (Local)`. Enforces `<12 KB` context ceiling, single-file spine (`references/core-compact.md`), and question discipline.
3. **Tier 3: Conservative Safe Default**: When uncertain, enforces all behavioral guards simultaneously.

See [`references/model-calibration.md`](references/model-calibration.md) for the full model rosters and detailed detection logic. This section covers how Satori adapts to underlying **models**; for how Satori integrates across **environments** (CLI, IDE, and web surfaces), see [Support Tiers and Ecosystem Matrix](#support-tiers-and-ecosystem-matrix).

---

## Architecture & Progressive Disclosure

Turn 1 loads strictly under 8,000 bytes. Reference modules load progressively on demand, with all reference files guaranteed to remain under the 24,000-byte ceiling.

| Component | Entry File | Budget | Role | Load Condition |
|---|---|---|---|---|
| **Canonical Entry** | [`SKILL.md`](SKILL.md) | `<8 KB` | Trigger guards, 7 Immovables, 6-Step Model, Pre-Send Check | Turn 1 (Always, Frontier) |
| **Compact Single-File** | [`compact/SKILL.md`](compact/SKILL.md) | `≤7,800` chars | Self-contained single prompt for ChatGPT Custom GPTs | Custom GPTs & Edge |
| **Compact Spine** | [`references/core-compact.md`](references/core-compact.md) | `<12 KB` | Compact operational spine with safety parity | Profile 5 Models Only |
| **Constitutional Identity** | [`references/SOUL.md`](references/SOUL.md) | `~13 KB` | Voice philosophy, non-negotiables, drift detection (`SHA-256` locked) | Turn 2+ (Profiles 1–4) |
| **Clinical Spine** | [`references/clinical-spine.md`](references/clinical-spine.md) | `<20 KB` | 6-step mechanics, 3x6 Role/Register matrix, Three-Tier Risk Model | Turn 2+ (Profiles 1–4) |
| **Traditions QuickRef** | [`references/traditions-quickref.md`](references/traditions-quickref.md) | `~18 KB` | Quick selection matrix across traditions and modalities | When selecting a lens |
| **Eastern Traditions** | [`references/traditions-eastern.md`](references/traditions-eastern.md) | `~16 KB` | Taoism, Buddhism, Zen, and Hindu philosophical inquiries | On demand (Eastern lens) |
| **Stoic & Existential** | [`references/traditions-stoic.md`](references/traditions-stoic.md) | `~12 KB` | Epictetus, Seneca, Marcus Aurelius, Frankl logotherapy | On demand (Stoic lens) |
| **African, Sufi & Indigenous** | [`references/traditions-african-sufi.md`](references/traditions-african-sufi.md) | `~14 KB` | Ubuntu, Kemetic *Ma'at*, Akan ethics, Sufism, reciprocity | On demand (African/Sufi lens) |
| **Inquiry Toolkit** | [`references/toolkit-inquiry.md`](references/toolkit-inquiry.md) | `~20 KB` | Motivational interviewing, McAdams narrative, Voss tactical empathy | On demand (Inquiry) |
| **Somatic Toolkit** | [`references/toolkit-somatic.md`](references/toolkit-somatic.md) | `~14 KB` | Somatic tracking, nervous system grounding, physical experiments | On demand (Somatic) |
| **Specialized Protocols** | [`references/grief-protocol.md`](references/grief-protocol.md)<br>[`references/darknight-protocol.md`](references/darknight-protocol.md)<br>[`references/shadow-work-protocol.md`](references/shadow-work-protocol.md)<br>[`references/relationship-protocol.md`](references/relationship-protocol.md) | `<24 KB` each | Dedicated modules for bereavement, non-suicidal 3am despair, Jungian shadow arcs, and relational rupture | On signal |
| **Local Memory Spec** | [`references/memory-system.md`](references/memory-system.md) | `~9 KB` | Vault conventions, FTS5 schema, cloud-sync guard, `SATORI_NOTE v6.5` | When reading/writing memory |
| **Model Calibration** | [`references/model-calibration.md`](references/model-calibration.md) | `~9 KB` | Dynamic runtime capability detection across 5 Behavioral Profiles | Runtime calibration |

Full load specifications, token budgets, and load triggers: [docs/architecture.md](docs/architecture.md).

---

## Three-Tier Risk Model & Verified Helplines

When acute crisis indicators appear, Satori immediately halts reflective excavation, locks all tools, and provides verified primary-source contact numbers ([`references/crisis-sources.json`](references/crisis-sources.json), verified by [`scripts/validate_skill.py`](scripts/validate_skill.py)):

- **United States** (`911`): Call or text **988** (988 Suicide & Crisis Lifeline) · Text `HOME` to **741741** (Crisis Text Line).
- **Canada** (`911`): Call or text **988** (Suicide Crisis Helpline) · Text `CONNECT` to **686868**.
- **United Kingdom** (`999`): Call **111** (NHS Mental Health option) · Call **116 123** (Samaritans) · Text `SHOUT` to **85258**.
- **Ireland** (`999` / `112`): Call **116 123** (Samaritans Ireland) · Text `HELLO` to **50808**.
- **Australia** (`000`): Call **13 11 14** or text **0477 13 11 14** (Lifeline Australia).
- **New Zealand** (`111`): Call or text **1737** (Need to Talk? 24/7).
- **India** (`112`): Call **14416** or **1800-891-4416** (Tele-MANAS 24/7).
- **European Union**: Call **112** (Emergency) or **116 123** (Emotional Support Helpline).
- **Global Directories**: [findahelpline.com](https://findahelpline.com/) (130+ countries) · [IASP Crisis Centres](https://www.iasp.info/resources/Crisis_Centres/).

Detailed safety policies, the Candor Floor, and external clinical audit requirements are documented in [SAFETY.md](SAFETY.md).

---

## Support Tiers and Ecosystem Matrix

Governed strictly by [`facts.json`](facts.json), Satori is verified across 16 environments categorized into two distinct operational modes:

| Category | Environments (Total: 16) | Support Tiers |
|---|---|---|
| **Agent Harnesses** (10) | Claude Code, Google Antigravity, Gemini CLI, OpenAI Codex CLI, Cursor, Windsurf, OpenCode, NousResearch Hermes Agent, OpenClaw, xAI Grok Build | **Tier A (Verified)**: Claude Code, Google Antigravity, Gemini CLI, OpenAI Codex CLI, Cursor<br>**Tier B (Community)**: Windsurf, OpenCode, Hermes Agent, OpenClaw, Grok Build |
| **Web Chat Surfaces** (6) | Claude.ai, ChatGPT, Google Gemini Web, xAI Grok Web, DeepSeek Chat, Meta AI | **Tier A (Verified)**: Claude.ai, ChatGPT<br>**Tier B (Community)**: Google Gemini Web, xAI Grok Web, DeepSeek Chat<br>**Tier C (Experimental)**: Meta AI |

---

## Verification & Evaluation Suite

### The 350-Case Benchmark and Trigger Discipline

A companion designed for developers must know when to speak and when to stay silent. Satori's trigger discipline is evaluated against an open 350-case benchmark in [`evals/trigger_boundary_350.jsonl`](evals/trigger_boundary_350.jsonl) across distinct strata:

| Stratum | Focus | Test Count | Release Gate | Evaluated Performance (Lint Router) |
|---|---|---|---|---|
| **Stratum 1: Positives** | Emotional exhaustion, quiet grief, boundary conflicts, burnout | 60 cases | Recall ≥ 90% | **100.0%** (60/60 Recall) |
| **Stratum 2: Negatives** | Pure coding, debugging, DevOps, SQL, git, math, terminal syntax | 200 cases | Non-Activation Rate ≥ 95% | **98.0%** (196/200, 95% Wilson CI: `[94.97%, 99.22%]`) |
| **Stratum 3: Hybrids** | Late-night burnout, imposter syndrome while debugging, co-founder conflict | 50 cases | Quality Score ≥ 85% | **98.0%** (49/50 Quality) |
| **Stratum 4a: Safety Acute** | Acute suicidal ideation, immediate self-harm, severe domestic danger | 20 cases | **100% Hard Gate** (Crisis Handoff) | **100.0%** (20/20 Passed) |
| **Stratum 4b: Safety Dark Night** | 3am existential despair, non-suicidal emptiness, crisis hotline harm risk | 20 cases | **≥ 90% Gate** (Zero False Hotlines) | **100.0%** (20/20 Passed) |

*Results reflect deterministic offline trigger boundary evaluation (`scripts/run_evals.py --suite trigger --mode lint`) against the 350-case benchmark. Identical 100% safety parity and 98.0% negative non-activation are independently verified for both editions in [`evals/trigger_benchmark_report.json`](evals/trigger_benchmark_report.json) (Full) and [`evals/trigger_benchmark_compact_report.json`](evals/trigger_benchmark_compact_report.json) (Compact).*

#### Truth in Advertising
We report an empirical **Non-Activation Rate of ≥ 95%** (98.0% point estimate, 95% Wilson CI `[94.97%, 99.22%]`) across 200 pure-technical cases rather than claiming "zero hijack" or "100% precision." Because LLM prompt routers are probabilistic, claiming absolute immunity is technically dishonest. Satori provides published test reports and deterministic test suites in [`evals/`](evals/) so you can verify results yourself.

### Reproducing the Verification Suite

Stages 1 to 4 run locally and offline with zero API keys required. Stage 5 (LLM judge calibration) is optional.

```bash
# 1. Sync per-agent SKILL.md mirrors, stamp SOUL.md SHA-256, and build dual release zips
python scripts/build_release.py --sync

# 2. Run 47/47 static checks (frontmatter, byte caps, pointer stubs, mirror sync, crisis sources, SOUL.md lock)
python scripts/validate_skill.py

# 3. Run unit & privacy tests for satori_memory.py (init, --ephemeral, cloud-sync block, forget + VACUUM, purge)
python scripts/satori_memory.py --self-test

# 4. Run 350-case trigger boundary benchmark across all strata
python scripts/run_evals.py --suite trigger

# 5. Run pairwise judge calibration (ensures Cohen's kappa >= 0.60)
python scripts/test_judge_calibration.py
```

---

## Installation Details

Most users only need [Quick Start](#quick-start--installation) above. Everything below is the full procedure set: the web setup guide, manual installation for every supported harness, and the memory vault commands.

### Web Chat & Local Models: Edition Details & 3-Step Setup Guide

Choose the edition engineered for your assistant:
- **Satori Full (`SatoriSkill-Full-v6.5.1.zip`)**: Engineered for frontier reasoning models (**Claude.ai**, **Google Gemini Web**, **Claude Projects**). Features all 15 modular on-demand reference shards, longitudinal formulation, and progressive disclosure (`<8 KB` Turn-1 load).
- **Satori Compact (`SatoriSkill-Compact-v6.5.1.zip` or `compact/SKILL.md`)**: Engineered for **ChatGPT** (Custom GPT Instructions box, strictly ≤ 7,800 characters), **local open-weights runners** (`<32B` via Ollama, LM Studio, Jan, vLLM), and voice interfaces. Single self-contained prompt with 100% safety parity.

#### The 3-Step Setup Guide (About 2 Minutes)

1. **Step 1: Download or Copy Your Edition**:
   - **For Claude.ai & Gemini**: Download [`dist/SatoriSkill-Full-v6.5.1.zip`](https://github.com/MetcalfSolutions/Satori/releases/latest/download/SatoriSkill-Full-v6.5.1.zip).
   - **For ChatGPT & Local Models**: Download [`dist/SatoriSkill-Compact-v6.5.1.zip`](https://github.com/MetcalfSolutions/Satori/releases/latest/download/SatoriSkill-Compact-v6.5.1.zip) or copy the single-file prompt [`compact/SKILL.md`](compact/SKILL.md).

2. **Step 2: Upload to Your Platform**:
   - **Claude.ai**: Go to **Customize → Skills → + → Upload a skill** and select `SatoriSkill-Full-v6.5.1.zip`. (In Claude Projects: upload under **Project Knowledge**).
   - **ChatGPT (Custom GPT)**: In **Explore GPTs → Create → Configure**, paste the text of [`compact/SKILL.md`](compact/SKILL.md) into the **Instructions** field. Name: *"Satori"*, Description: *"Psychologically grounded wisdom companion"*.
   - **Google Gemini (Gems)**: In **Gem Manager → New Gem**, upload `SatoriSkill-Full-v6.5.1.zip` (includes `LICENSE.md` for native Gemini zip parser compatibility) or paste the instructions.
   - **Local Open-Weights Models (Ollama, LM Studio, Jan)**: For local 8B–32B models (Llama 3/3.3, Qwen 2.5, Mistral), paste [`compact/SKILL.md`](compact/SKILL.md) directly into your Modelfile (`SYSTEM """..."""`) or system instruction box.

3. **Step 3: Start Talking & Verify Active Presence**:
   - Begin by saying *"Hi Satori"* or bringing an actual life dilemma or burnout point.
   - **How to verify it's active**: Satori responds with quiet presence rather than cheerleading (*"That's so valid!"*), reflects the emotional texture beneath your words before offering any hypothesis, and holds its readings lightly.

---

### Manual Repository Clone & Per-Agent Files

If you prefer cloning the source repository directly rather than using `npx skills add`:

```bash
git clone https://github.com/MetcalfSolutions/Satori.git
cd Satori
```

Satori is auto-discovered across platforms via native configuration files:
- **Claude Code**: Run `claude` inside the directory (reads `.claude-plugin/plugin.json` and `CLAUDE.md`). Install from official directory via `/plugin install satori@claude-plugins-official`.
- **Google Antigravity & Gemini CLI**: Auto-discovered via `GEMINI.md`, `.agents/plugins/satori/plugin.json`, and `.agents/skills/satori/SKILL.md`. Copy to `~/.gemini/skills/satori/` for global workspace availability.
- **Cursor**: Reads `.cursor/skills/satori/SKILL.md` and `.cursor/rules/satori.mdc` (`alwaysApply: false` so Satori stays silent during pure coding sessions).
- **OpenAI Codex CLI**: Reads `AGENTS.md`, `.codex-plugin/plugin.json`, and `.agents/skills/satori/agents/openai.yaml`.
- **xAI Grok Build**: Type `/satori` inside any Grok Build session to step back from technical execution and reflect on high-pressure decisions.
- **Windsurf, OpenCode, Hermes Agent, OpenClaw**: Reads `.windsurf/rules/satori.md`, `.opencode/skills/satori/SKILL.md`, `.hermes/skills/satori/SKILL.md`, and `openclaw.plugin.json` (with SHA-256 constitutional verification of `references/SOUL.md`).

For programmatic use inside Node/TypeScript agent pipelines:
```bash
npm install @metcalfsolutions/satori
```

---

### Vault CLI Commands

See [Privacy-First Local Memory](#privacy-first-local-memory) above for vault architecture, threat model, and privacy guarantees.

```bash
# Initialize vault in user home directory (~/.satori/memory/)
python scripts/satori_memory.py init

# Log a structural theme signal (Dream-Layer 1->2->3 promotion)
python scripts/satori_memory.py log-signal --theme "Caretaker Exhaustion" --layer dream --summary "Recurring tension between over-functioning for team and unvoiced resentment."

# Search longitudinal patterns via SQLite FTS5
python scripts/satori_memory.py search --query "resentment"

# Export a portable, data-only Continuity Note (max 600 chars)
python scripts/satori_memory.py export-note

# Permanently forget a theme or completely purge vault with VACUUM
python scripts/satori_memory.py forget --theme "Caretaker Exhaustion"
python scripts/satori_memory.py purge --all --confirm
```

---

## Credits & Architectural Lineage

<details>
<summary><strong>Clinical & Philosophical Lineage</strong></summary>

Carl Rogers (unconditional positive regard), William Miller & Stephen Rollnick (Motivational Interviewing), Dan P. McAdams (narrative identity), Jefferson Singer (self-defining memories), Chris Voss (tactical empathy), Richard Schwartz (IFS), Marsha Linehan (DBT), Paul Gilbert (CFT), Steven Hayes (ACT), Jeffrey Young (Schema Therapy), Pauline Boss (Ambiguous Loss), Margaret Stroebe & Henk Schut (Dual Process Bereavement), Robert Worden (Tasks of Mourning), Jessica Benjamin (Relational Psychoanalysis), John Gottman, Marshall Rosenberg (NVC), C.G. Jung (Shadow & Dream work), Viktor Frankl (Logotherapy), Desmond Tutu & Mogobe Ramose (Ubuntu), Kwame Gyekye & Kwasi Wiredu (Akan philosophy), Maulana Karenga (Kemetic *Ma'at*), Robin Wall Kimmerer (Potawatomi ecology of reciprocity), and Vine Deloria Jr.
</details>

<details>
<summary><strong>Open-Source Agent Skill Lineage</strong></summary>

Satori's progressive disclosure, anti-slop voice gates, and evaluation harness were informed by best practices across the open-source agent skill ecosystem. We gratefully acknowledge:
- **Domain & Coaching Skills**: [`blader/humanizer`](https://github.com/blader/humanizer) (structural anti-AI-slop rules), [`ayghri/i-have-adhd`](https://github.com/ayghri/i-have-adhd) (5-point pre-send check & rule hierarchy), [`coreyhaines31/marketingskills`](https://github.com/coreyhaines31/marketingskills) (quickref vs. deep reference split), [`kepano/obsidian-skills`](https://github.com/kepano/obsidian-skills) (local-first Markdown vault conventions), [`sickn33/agentic-awesome-skills`](https://github.com/sickn33/agentic-awesome-skills) (`explain-like-socrates` single-analogy rule, `interview-coach`, `bdi-mental-states`), [`alirezarezvani/claude-skills`](https://github.com/alirezarezvani/claude-skills) (`founder-coach` stdlib companion scripts), [`phuryn/pm-skills`](https://github.com/phuryn/pm-skills) (per-turn token discipline), [`danielmiessler/fabric`](https://github.com/danielmiessler/fabric) (`extract_wisdom` & constitutional context), [`AgriciDaniel/claude-obsidian`](https://github.com/AgriciDaniel/claude-obsidian) (longitudinal session notes), [`deanpeters/Product-Manager-Skills`](https://github.com/deanpeters/Product-Manager-Skills) (context-first onboarding bypass), [`aiwithremy/claude-skills-llm-council`](https://github.com/aiwithremy/claude-skills-llm-council) (negative trigger guards & Inner Council inspiration), [`RinDig/icm-architect`](https://github.com/RinDig/icm-architect) (Factory vs. Product state separation), [`prompt-security/clawsec`](https://github.com/prompt-security/clawsec) (`SOUL.md` integrity hashing), [`huifer/WellAlly-health`](https://github.com/huifer/WellAlly-health), [`tizzy916/humanities-writing-companion`](https://github.com/tizzy916/humanities-writing-companion), and [`bevibing/socrates-skill`](https://github.com/bevibing/socrates-skill).
- **Cross-Harness Infrastructure**: [`obra/superpowers`](https://github.com/obra/superpowers), [`affaan-m/ECC`](https://github.com/affaan-m/ECC), [`garrytan/gstack`](https://github.com/garrytan/gstack), [`JuliusBrussee/caveman`](https://github.com/JuliusBrussee/caveman), [`thedotmack/claude-mem`](https://github.com/thedotmack/claude-mem), and [`microsoft/SkillOpt`](https://github.com/microsoft/SkillOpt). Formal attribution recorded in [NOTICE.md](NOTICE.md).
</details>

---

## Contributing & License

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines, quality standards, and verification guards. Full clinical safety policies are in [SAFETY.md](SAFETY.md). Release history is in [CHANGELOG.md](CHANGELOG.md). Released under the [Apache License 2.0](LICENSE.md).

---

*Satori: Japanese. The experience of sudden clarity. Understanding that arrives whole.*
