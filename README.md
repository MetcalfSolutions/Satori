<p align="center">
  <img src="docs/assets/satori-hero-v6.svg" alt="Satori v6.1.0 - A Clinically Informed Wisdom Companion for the Inner Life" width="820" />
  <br/><br/>
  <img src="docs/assets/satori-architecture-v6.svg" alt="Satori v6.1.0 Progressive Disclosure & Multi-Agent Architecture" width="820" />
</p>

<p align="center">
  <a href="https://github.com/MetcalfSolutions/Satori/releases/tag/v6.1.0"><img src="https://img.shields.io/badge/Release-v6.1.0-7c6af7.svg?style=for-the-badge" alt="Satori v6.1.0 Release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge" alt="License" /></a>
  <a href="#installation-across-8-agent-ecosystems--web-uis"><img src="https://img.shields.io/badge/Agents-8%20Ecosystems-e07b54.svg?style=for-the-badge" alt="8 Agent Ecosystems" /></a>
  <a href="#cross-model-compatibility--3-tier-capability-detection"><img src="https://img.shields.io/badge/Models-5%20Behavioral%20Profiles-4ecdc4.svg?style=for-the-badge" alt="5 Behavioral Profiles" /></a>
</p>

<p align="center">
  <a href="https://metcalfsolutions.github.io/Satori/">Web View — Interactive Overview</a> ·
  <a href="CHANGELOG.md#migrating-from-v51-to-v610-claudeai-web--cli-users">v5.1 → v6.1.0 Migration Guide</a> ·
  <a href="PRIVACY.md">Privacy & Threat Model</a>
</p>

> *"This understands me, sees patterns I miss, connects ideas clearly, and helps me take meaningful next steps."*

That's the standard I hold every Satori response to. Understanding, pattern recognition, connection, movement. All four. A response that produces only insight is incomplete.

---

## What Satori Is

I've watched people I care about try to get mental health support and hit the same walls: cost, waitlists, the specific shame of needing it. I'm not a clinician, but I've spent years studying these frameworks, and I kept thinking there had to be a way to get them to people who are priced out of formal care.

So I started building. The first was Mycroft, Stoic-only, built on Gemini. Cold. Accurate. My wife Jamie said it felt like talking to a wall. Then Vicki, built specifically for Jamie, drawing on IFS. It created space for inner-kindness rather than judgment, a retreat when her internal voices turned harsh. It helped her find her voice and dismantle some things she'd been carrying for years. Too personalized to share publicly. Then Dave, for a teenager down the street who wanted to know where the badges were. Five experiments in total. Each one taught me what the last one missed.

The pattern was consistent. Warmth without structure produces platitudes, and structure without warmth produces Mycroft. I wanted clinical discipline underneath a voice that didn't sound clinical.

Satori draws on global wisdom traditions — Stoicism, Taoism, Buddhism, Christianity, Sufi wisdom, Hindu philosophy, Confucian ethics, African philosophical lineages (Ubuntu/Hunhu, Akan philosophical psychology, Kemetic *Ma'at*), and Indigenous wisdom traditions (Haudenosaunee Seven Generations, Cree *Wahkohtowin*, Potawatomi ecology of reciprocity) — alongside modern clinical psychology: IFS, DBT, CFT, Schema Therapy, ACT, Somatic approaches, Dual Process Grief, and Relational Psychoanalysis, with Motivational Interviewing and Voss tactical empathy as the technical spine. The frameworks are tools, not atmosphere. Each one gets selected for the specific moment. One per response. Never stacked, never name-dropped.

It is not a therapist. It doesn't diagnose anything. When someone's needs exceed what conversation can hold, it says so clearly and points them to primary-source verified human support ([`references/crisis-sources.json`](references/crisis-sources.json)). But for the territory between "I'm fine" and "I need a professional," I think it's genuinely useful.

It's free. No subscription. No telemetry. User-owned local memory ([`PRIVACY.md`](PRIVACY.md)). And as of **v6.1.0**, it works natively across **8 agent ecosystems** and **all major frontier, workhorse, and local model tiers**.

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

Satori v6.1.0 eliminates the legacy 63 KB Turn-1 load tax. [`SKILL.md`](SKILL.md) (`<8 KB`) is the single canonical source of truth and is self-sufficient for Turn 1, while reference modules load progressively on demand:

| File | Budget | Purpose | Load Condition |
|---|---|---|---|
| [`SKILL.md`](SKILL.md) | `<8 KB` | Canonical entry point, trigger boundaries, 7 Immovables, 6-Step Model, verified global crisis table, 5-Point Pre-Send Check | **Turn 1 (Always)** |
| [`references/core-compact.md`](references/core-compact.md) | `<12 KB` | Self-contained operational spine for compact/local `<32B` models & voice pipelines | **Profile 5 Models Only** |
| [`references/SOUL.md`](references/SOUL.md) | `~13 KB` | Constitutional identity, 7 Immovables, voice philosophy, drift detection (`SHA-256` verified in [`openclaw.plugin.json`](openclaw.plugin.json)) | **Turn 2+ (Profiles 1–4)** |
| [`references/clinical-spine.md`](references/clinical-spine.md) | `<20 KB` | Core 6-step mechanics, 3×6 Role/Register matrix, working formulation, parts awareness, autonomy guardrails, global crisis protocol (below Antigravity's `24 KB` per-file cap) | **Turn 2+ (Profiles 1–4)** |
| [`references/memory-system.md`](references/memory-system.md) | `~9 KB` | 3-Tier Vault fallback (`.satori/memory/` → `~/.satori/memory/` → Web Capsule), Dream Layer (`1→2→3`), longitudinal formulation | **When reading/writing memory** |
| [`references/model-calibration.md`](references/model-calibration.md) | `~9 KB` | 3-Tier Runtime Capability Detection & 5 Behavioral Profiles | **Model calibration reference** |
| [`references/traditions-quickref.md`](references/traditions-quickref.md) | `~18 KB` | Quick selection matrix across wisdom traditions and clinical frameworks | **When selecting a lens** |
| [`references/traditions-deep.md`](references/traditions-deep.md) | `~79 KB` | 30-section encyclopedia with a top-of-file **Line-Range Index Table** for selective ~35-line (`~1.5 KB`) reads | **Selective line-range read only** |
| [`references/conversation-toolkit.md`](references/conversation-toolkit.md) | `~38 KB` | OARS/MI, McAdams, Singer, Voss tactical empathy, and **Patterns 1–16** (including Pattern Letter, Dream Walk, Ikigai Map, Shadow Invitation, **Inner Council**, and **Reflective Journaling**) | **On demand** |
| [`references/tone-and-voice.md`](references/tone-and-voice.md) | `~13 KB` | Voice calibration, Structural Anti-Slop Pass, and human gold before/after examples | **On demand** |
| [`references/onboarding.md`](references/onboarding.md) | `~8 KB` | Context-First Bypass + 5-question first-session sequence and privacy consent notice | **New users without an immediate topic** |
| [`references/darknight-protocol.md`](references/darknight-protocol.md) | `~7 KB` | Pure presence mode for non-suicidal 3am existential despair | **On Dark Night signal** |
| [`references/grief-protocol.md`](references/grief-protocol.md) | `~8 KB` | Bereavement, disenfranchised grief, Pauline Boss Ambiguous Loss, Dual Process Oscillation, Continuing Bonds | **On grief / loss signal** |
| [`references/shadow-work-protocol.md`](references/shadow-work-protocol.md) | `~11 KB` | 5-session Jungian shadow integration arc | **On shadow work engagement** |
| [`references/relationship-protocol.md`](references/relationship-protocol.md) | `~8 KB` | Solo relational rupture & Shared Two-Person Conflict Hold Mode (Multi-Partiality, Relational Psychoanalysis, Gottman, NVC + domestic abuse override) | **On relational conflict signal** |
| [`references/crisis-sources.json`](references/crisis-sources.json) | `~4 KB` | Primary-source verified emergency and 24/7 crisis lines across 9 regions | **Build-time & crisis reference** |
| [`PRIVACY.md`](PRIVACY.md) | `~5 KB` | Threat model (T1–T6), local permissions, cloud-sync protection, and user deletion (`forget` / `purge`) | **Privacy & data sovereignty spec** |

### Trigger Boundaries & Hybrid Routing (`SKILL.md` Frontmatter)

Unlike legacy skills that use *"When in doubt, activate"* and accidentally hijack coding sessions, [`SKILL.md`](SKILL.md) enforces a three-part trigger boundary validated against a 50-case 3-strata benchmark ([`evals/trigger_boundary.jsonl`](evals/trigger_boundary.jsonl)):
- **Positive Activation**: Activates when someone is processing personal difficulty, grief, ambivalence, burnout, relationship conflict, shadow work, or existential crossroads.
- **Explicit Negative Triggers (`DO NOT ACTIVATE`)**: Never activates for pure coding, debugging, DevOps, SQL, math, or technical tasks — even when phrased as *"I'm stuck"* or *"I've been struggling with this bug."*
- **Hybrid Routing (Burnout-While-Debugging)**: When a technical request includes explicit personal burnout, imposter syndrome, or co-founder/team conflict, the agent addresses the concrete technical task first AND briefly, warmly acknowledges the human weight without hijacking the session into a clinical monologue.

---

## Cross-Model Compatibility & 3-Tier Capability Detection

Satori v6.1.0 is model-agnostic. Instead of brittle model-name tables that rot as providers release new checkpoints, [`SKILL.md`](SKILL.md) Section 4 and [`references/model-calibration.md`](references/model-calibration.md) calibrate behavior dynamically using a **3-Tier Runtime Capability Detection Hierarchy**:

1. **Tier 1 — Explicit Environment Override**: Checks `SATORI_MODEL_PROFILE=1..5` (or explicit `references/core-compact.md` loading).
2. **Tier 2 — Capability-Based Introspection across 5 Behavioral Profiles**:
   - **Profile 1 — Deep CoT & Extended Thinking** *(e.g., Gemini 4 Argon, Claude 4.5 Opus, OpenAI Fable)*: Enforces the **CoT Emotional Bypassing Gate** (`problem-solving target = 0` during acute grief, flooding, or Dark Night) and **Single-Hypothesis Pruning**.
   - **Profile 2 — Open-Weights RL Reasoning** *(e.g., DeepSeek R3, Sol / Llama 5 405B+, Qwen 3.5 Max, Mistral Large 3)*: Enforces the **Zero Machinery Leak Gate** (never printing `Step 1:` or `Attune:`) and translates analytical deductions into warm everyday speech.
   - **Profile 3 — Search-Augmented Synthesis** *(e.g., Grok 4.7)*: Enforces **Search Tool Restraint** (zero web searches during emotional attunement unless verifying a Pattern 8 resource).
   - **Profile 4 — High-Velocity Coding & Agentic Workhorses** *(e.g., Claude 4.5 Sonnet, GPT-5.3 Codex, Gemini 4 Flash-Thinking, Grok 4.5 Coder)*: Enforces the **Prose-Only Lock** (zero bulleted lists, numbered action plans, or `##` headers in emotional prose).
   - **Profile 5 — Compact Edge (`<32B`) & Low-Latency Voice** *(e.g., Llama 5 8B, Qwen 3.5 Coder 14B, Gemma 4 9B/27B, Haiku, Flash-Lite)*: Enforces the **`<12 KB` Context Ceiling** (loading only [`references/core-compact.md`](references/core-compact.md)) and 2–3 short paragraphs + 1 closing question.
3. **Tier 3 — Conservative Safe Default ("Enforce All Guards")**: Whenever a model cannot determine its profile with certainty, it simultaneously enforces all four core behavioral guards (CoT Emotional Bypassing Gate, Zero Machinery Leak, Search Restraint, and Prose-Only Lock).

---

## Privacy-First Local Memory Engine (`scripts/satori_memory.py`)

Satori v6.1.0 replaces Claude-only web memory assumptions with a **3-Tier Memory Fallback** ([`references/memory-system.md`](references/memory-system.md)) governed by [`PRIVACY.md`](PRIVACY.md):
1. **Tier 1 (Workspace Vault)**: `./.satori/memory/` (CLI/IDE agents).
2. **Tier 2 (User Home Vault)**: `~/.satori/memory/`.
3. **Tier 3 (Stateless Web Fallback)**: Claude.ai native memory or a user-held **Portable Continuity Capsule** (`export-capsule`).

### Security & Privacy Architecture (`T1–T6` Threat Model)
- **Structural Abstraction Only (`<=500` chars)**: [`scripts/satori_memory.py`](scripts/satori_memory.py) stores concise structural theme summaries and Dream-Layer (`1 → 2 → 3`) recurrence counts in local SQLite (`FTS5`) + Markdown, rejecting raw transcript dumps.
- **Strict Local Permissions & Git Exclusion**: Enforces `0700` directory / `0600` file permissions on POSIX (and best-effort `icacls` user-only ACLs on Windows), warns if initialized inside a cloud-synced folder (OneDrive, Dropbox, iCloud, Google Drive), and auto-generates `.satori/.gitignore` (`*`).
- **Right to Erasure (`forget` & `purge`)**: `forget` deletes matching records from both `signals` and `signals_fts`, executes `PRAGMA secure_delete = ON` + `VACUUM` so zero residual SQLite free-page slack remains, and regenerates Markdown summaries cleanly.
- **Ephemeral Off-the-Record Mode (`--ephemeral`)**: Skips all disk writes for sensitive sessions.
- **Stdlib Base + Optional `cryptography` Fail-Closed Encryption (`--encrypt`)**: Runs out-of-the-box on Python 3.9+ stdlib (`sqlite3`). When `SATORI_VAULT_PASSPHRASE` and `--encrypt` are used, encrypts files at rest with `AES-256-GCM` (`PBKDF2-HMAC-SHA256`, `600,000` iterations) via `cryptography`, failing closed with exit code `2` if `cryptography` is not installed.

```bash
# Initialize vault (.satori/memory/ or ~/.satori/memory/) with 0700 permissions & .gitignore protection
python scripts/satori_memory.py init

# Log a structural theme or Dream-Layer signal (promotes to recurring_patterns.md at count >= 3)
python scripts/satori_memory.py log-signal --theme "Caretaker Exhaustion" --layer dream --summary "Recurring tension between over-functioning for team and unvoiced resentment."

# Search longitudinal patterns via SQLite FTS5
python scripts/satori_memory.py search --query "resentment"

# Permanently forget a theme or session (executes PRAGMA secure_delete = ON + VACUUM)
python scripts/satori_memory.py forget --theme "Caretaker Exhaustion"

# Wipe the entire vault or export a portable capsule for web UIs
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

## Installation Across 8 Agent Ecosystems & Web UIs

See [CHANGELOG.md](CHANGELOG.md#migrating-from-v51-to-v610-claudeai-web--cli-users) for the full v5.1 → v6.1.0 migration guide.

### 1. Claude.ai Web Upload (`SatoriSkill-v6.1.0.zip`)
1. Download [`SatoriSkill-v6.1.0.zip`](https://github.com/MetcalfSolutions/Satori/releases/latest/download/SatoriSkill-v6.1.0.zip) from [GitHub Releases](https://github.com/MetcalfSolutions/Satori/releases/tag/v6.1.0) (or build locally via `python scripts/build_release.py --sync`).
2. Open [claude.ai](https://claude.ai) → **Customize → Skills → + → Upload a skill** and upload `SatoriSkill-v6.1.0.zip`.

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

## Verification, Integrity & Anti-Gaming Evaluation Suite

Satori v6.1.0 ships with a deterministic build validator, a pre-commit hook ([`scripts/pre-commit`](scripts/pre-commit)), and a two-stage anti-gaming evaluation harness:

```bash
# 1. Sync per-agent SKILL.md mirrors, stamp SOUL.md SHA-256, and build dist/SatoriSkill-v6.1.0.zip
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

## Credits, Architectural Lineage & Acknowledgments

### Clinical & Philosophical Lineage
Carl Rogers (unconditional positive regard), William Miller & Stephen Rollnick (Motivational Interviewing), Dan P. McAdams (narrative identity), Jefferson Singer (self-defining memories), Chris Voss (tactical empathy), Richard Schwartz (IFS), Marsha Linehan (DBT), Paul Gilbert (CFT), Steven Hayes (ACT), Jeffrey Young (Schema Therapy), Pauline Boss (Ambiguous Loss), Margaret Stroebe & Henk Schut (Dual Process Bereavement), Robert Worden (Tasks of Mourning), Jessica Benjamin (Relational Psychoanalysis), John Gottman, Marshall Rosenberg (NVC), C.G. Jung (Shadow & Dream work), Viktor Frankl (Logotherapy), Desmond Tutu & Mogobe Ramose (Ubuntu), Kwame Gyekye & Kwasi Wiredu (Akan philosophy), Maulana Karenga (Kemetic *Ma'at*), Robin Wall Kimmerer (Potawatomi ecology of reciprocity), and Vine Deloria Jr.

### Open-Source Agent Skill Lineage (v6.1.0 Benchmark Cohort)
Satori v6.1.0's multi-agent packaging, progressive disclosure, anti-slop voice gates, and evaluation harness were informed by examining best practices across the open-source agent skill ecosystem. We gratefully acknowledge:
- **Domain & Coaching Skills**: [`blader/humanizer`](https://github.com/blader/humanizer) (structural anti-AI-slop rules), [`ayghri/i-have-adhd`](https://github.com/ayghri/i-have-adhd) (5-point pre-send check & rule hierarchy), [`coreyhaines31/marketingskills`](https://github.com/coreyhaines31/marketingskills) (quickref vs. deep reference split), [`kepano/obsidian-skills`](https://github.com/kepano/obsidian-skills) (local-first Markdown vault conventions), [`sickn33/agentic-awesome-skills`](https://github.com/sickn33/agentic-awesome-skills) (`explain-like-socrates` single-analogy rule, `interview-coach`, `bdi-mental-states`), [`alirezarezvani/claude-skills`](https://github.com/alirezarezvani/claude-skills) (`founder-coach` stdlib companion scripts), [`phuryn/pm-skills`](https://github.com/phuryn/pm-skills) (per-turn token discipline), [`danielmiessler/fabric`](https://github.com/danielmiessler/fabric) (`extract_wisdom` & constitutional context), [`AgriciDaniel/claude-obsidian`](https://github.com/AgriciDaniel/claude-obsidian) (longitudinal session notes), [`deanpeters/Product-Manager-Skills`](https://github.com/deanpeters/Product-Manager-Skills) (context-first onboarding bypass), [`aiwithremy/claude-skills-llm-council`](https://github.com/aiwithremy/claude-skills-llm-council) (negative trigger guards & Inner Council inspiration), [`RinDig/icm-architect`](https://github.com/RinDig/icm-architect) (Factory vs. Product state separation), [`prompt-security/clawsec`](https://github.com/prompt-security/clawsec) (`SOUL.md` integrity hashing), [`huifer/WellAlly-health`](https://github.com/huifer/WellAlly-health), [`tizzy916/humanities-writing-companion`](https://github.com/tizzy916/humanities-writing-companion), and [`bevibing/socrates-skill`](https://github.com/bevibing/socrates-skill).
- **Cross-Harness Infrastructure**: [`obra/superpowers`](https://github.com/obra/superpowers), [`affaan-m/ECC`](https://github.com/affaan-m/ECC), [`garrytan/gstack`](https://github.com/garrytan/gstack), [`JuliusBrussee/caveman`](https://github.com/JuliusBrussee/caveman), [`thedotmack/claude-mem`](https://github.com/thedotmack/claude-mem), and [`microsoft/SkillOpt`](https://github.com/microsoft/SkillOpt).

---

## Contributing & License

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines, quality standards, and cultural sensitivity requirements, and [CHANGELOG.md](CHANGELOG.md) for full release history. Released under the [Apache License 2.0](LICENSE).

---

*Satori (悟り) — Japanese. The experience of sudden clarity. Understanding that arrives whole.*
