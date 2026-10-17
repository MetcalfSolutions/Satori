# Changelog

All notable changes to Satori are documented here.

---

## v6.0.0 & v6.1.0 — Universal Multi-Agent & Behavior-Calibrated Overhaul (Current)

### Migrating from v5.1 to v6.0 (Claude.ai Web & CLI Users)
- **Claude.ai Web Users (`SatoriSkill-v6.0.0.zip`)**:
  1. Generate `dist/SatoriSkill-v6.0.0.zip` by running `python scripts/build_release.py --sync` (or download `SatoriSkill-v6.0.0.zip` from GitHub Releases).
  2. In [claude.ai](https://claude.ai), open **Customize → Skills**, remove the old v5 skill (or click update), and upload `SatoriSkill-v6.0.0.zip`.
  3. **Memory Continuity**: Your existing Claude.ai native memory remains intact automatically. To bring your web context into a local CLI agent (or vice versa), ask Satori for a **Portable Continuity Capsule** or run `python scripts/satori_memory.py export-capsule`.
- **CLI & IDE Agent Users (Antigravity, Claude Code, Codex, Cursor, Windsurf, OpenCode, Hermes, OpenClaw)**:
  - Clone the repository and run `python scripts/satori_memory.py init` to initialize your local privacy-first memory vault (`./.satori/memory/` or `~/.satori/memory/`).

### Phase 1 (`v6.0.0`) — Platform, Progressive Disclosure, Privacy-First Memory, Evals & v5.2 Roadmap Completion
- **Eliminated the 63 KB Turn-1 Load Tax**:
  - `SKILL.md` (`<8 KB`) is now self-sufficient on Turn 1 and serves as the single canonical source of truth.
  - Extracted memory mechanics from `references/clinical-spine.md` (`32.9 KB` → `<19 KB`, compliant with Antigravity's `24,000-byte` rule ceiling) into `references/memory-system.md`.
  - Added `references/core-compact.md` (`<12 KB`) for compact/local quantized models (`<32B`) and voice pipelines.
  - Added a **Selective Line-Range Index Table** to `references/traditions-deep.md` so file-reading agents can fetch a single 35-line tradition entry (`~1.5 KB`) on demand.
- **Explicit Trigger Guard & Hybrid Routing (`SKILL.md`)**:
  - Removed *"When in doubt, activate."* Added explicit negative triggers for pure coding, debugging, DevOps, SQL, and math tasks, plus **Hybrid Routing** for mixed technical + personal burnout prompts.
- **5 Durable Behavioral Model Profiles (`references/model-calibration.md`)**:
  - Replaced brittle model-name tables with a **3-Tier Runtime Capability Detection Mechanism** and **5 Behavioral Profiles** (Profile 1: Recursive/STEM Reasoners; Profile 2: Literary/Constitutional Frontier; Profile 3: High-Candor/Search-Native; Profile 4: Coding/RAG Workhorses; Profile 5: Compact/Edge/Quantized `<32B`). Single-model execution is canonical.
- **Privacy-First Local Memory Engine (`scripts/satori_memory.py` & `PRIVACY.md`)**:
  - Zero-dependency Python 3 stdlib CLI supporting `.satori/memory/` → `~/.satori/memory/` → Portable Web Capsule fallback.
  - Full **T1–T6 Threat Model**: automatic `.satori/.gitignore` (`*`), POSIX `0700`/`0600` & Windows best-effort `icacls` permissions, 500-char structural summary cap with PII scrubbing, `--ephemeral` off-the-record mode, optional `cryptography` (`AES-256-GCM` + `Scrypt`) encryption via `SATORI_VAULT_PASSPHRASE` (failing closed if missing), and mandatory user deletion (`forget` with `PRAGMA secure_delete = ON` + `VACUUM`, and `purge`).
- **8-Agent Ecosystem Adapters**:
  - Added Category A pure pointer stubs (`<=15 lines`: `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, `.cursor/rules/satori.mdc`, `.windsurf/rules/satori.md`, `.opencode/command/satori.md`) and Category B `SHA-256`-synced skill mirrors (`.agents/`, `.cursor/`, `.opencode/`, `.hermes/`), plus manifests for Antigravity, Claude, Codex, Gemini CLI, and OpenClaw (`openclaw.plugin.json` with `SOUL.md` SHA-256 verification).
- **Primary-Source Verified Global Crisis Protocol (`references/crisis-sources.json`)**:
  - Added verified emergency and 24/7 crisis call/text lines for the US (`988`, `741741`), Canada (`988`, `686868`), UK (`111`, `999`, `116 123`, `85258`), Ireland (`116 123`, `50808`), Australia (`13 11 14`, `0477 13 11 14`), New Zealand (`1737`), India (`14416`, `1800-891-4416`), EU (`112`, `116 123`), and global directories (`findahelpline.com`, `iasp.info`), verified at build time by `scripts/validate_skill.py`.
- **v5.2 Clinical & Wisdom Roadmap Completed**:
  - Added `references/grief-protocol.md` (bereavement, disenfranchised grief, Pauline Boss Ambiguous Loss, Stroebe & Schut Dual Process Oscillation, Continuing Bonds).
  - Added **Pattern 16: Reflective Journaling & Stream-of-Consciousness Synthesis** in `references/conversation-toolkit.md`.
  - Expanded **African Philosophy** (Southern African *Ubuntu/Hunhu*, West African Akan *Okra/Sunsum/Sankofa*, Classical Kemetic *Ma'at*) and **Indigenous Wisdom** (Haudenosaunee Seven Generations, Cree *Wahkohtowin*, Potawatomi reciprocity, Lakota spatial-temporal wholeness) in `references/traditions-deep.md` and `references/traditions-quickref.md`.
- **Two-Stage Anti-Gaming Evaluation & Trigger Suite (`evals/`, `scripts/run_evals.py`, `scripts/test_judge_calibration.py`)**:
  - Added a 50-case 3-strata trigger benchmark (`evals/trigger_boundary.jsonl`: 20 Clear Positives, 20 Clear Negatives, 10 Ambiguous Mixed), a 15-scenario conversational benchmark (`evals/cases.jsonl`), human v5 canonical gold anchors (`evals/gold_anchors.jsonl`), Stage-1 deterministic anti-slop checks, and Stage-2 position-debiased Profile-2 pairwise evaluation.

### Phase 2 (`v6.1.0`) — Relational Hold Mode, Inner Council & Opt-In Hooks
- **Relationship & Conflict Hold Protocol (`references/relationship-protocol.md`)**:
  - Supports both Solo Relational Rupture and Shared Two-Person Conflict Sessions using Multi-Partiality, Relational Psychoanalysis ("The Third Thing"), Gottman Softened Start-Up & Repair, and Nonviolent Communication (NVC), with a hard domestic-abuse safety override.
- **Pattern 15: The Inner Council (`references/conversation-toolkit.md`)**:
  - Multi-lens internal deliberation convening 3–4 internal voices (Protector/Stoic, Vulnerable/CFT, Existential/Frankl, Grounded Elder/Ubuntu) for deadlocked life crossroads.
- **Experimental Opt-In Session Hook (`hooks/hooks.json`)**:
  - Disabled by default (`"enabled": false`); allows advanced CLI users to opt into asynchronous `SessionStart` memory status summaries.

---

## v5.1

### Added
- **Onboarding protocol** (`references/onboarding.md`) — Guided 5-question first-session sequence with "Satori has met you" synthesis statement
- **Dark Night Protocol** (`references/darknight-protocol.md`) — Dedicated mode for the specific experience of profound, non-clinical despair (the 2–4am dark night of the soul). Distinct from crisis response — presence-focused, not intervention-focused
- **Shadow Work Protocol** (`references/shadow-work-protocol.md`) — Structured 5-session arc for Jungian shadow work: locating shadow, meeting the first figure, origin work, integration, and living with the shadow
- **New conversation patterns** in `conversation-toolkit.md`:
  - Pattern 11: The Pattern Letter — letter from the future self, grounded in narrative identity theory
  - Pattern 12: The Dream Walk — multi-tradition dream exploration
  - Pattern 13: The Ikigai Map — structured multi-turn purpose mapping
  - Pattern 14: The Shadow Work Invitation — entry point to shadow-work-protocol.md
- **Dark Night detection signal** added to crisis recognition table in `clinical-spine.md`
- **Expanded warm-handoff language** in crisis protocol — specific, humane language for redirecting to professional support without closing the door

### Changed
- README hero section rewritten to lead with a compelling "before/after" pattern-naming transcript ("The Moment") rather than install instructions
- Contributing section updated with link to CONTRIBUTING.md
- "Who This Is Built On" section added to README — documents the specific clinical and philosophical lineages Satori draws from

---

## v5.0

### Architecture
- Restructured as a formal Claude skill package (`SatoriSkill-v5.zip`) — uploadable directly to claude.ai without terminal access
- Added `.claude-plugin/plugin.json` for Claude Code plugin auto-detection
- Added `marketplace.json` for Claude marketplace listing

### Core System
- `SOUL.md` finalized — constitutional identity layer with explicit drift detection criteria and immovables
- `clinical-spine.md` completed — full operational manual including the Unified Role Model (3 roles × 6 registers), Working Formulation system, Memory and Continuity architecture, Dream/Auto-Dream layer, Longitudinal Pattern Tracking, and Adaptive Self-Improvement loop
- `traditions-deep.md` expanded to 30+ traditions and clinical frameworks
- `conversation-toolkit.md` expanded with Voss tactical empathy framework and advanced deepening patterns

---

## v4.x

- Introduction of the Unified Role Model (Empathic Witness / Active Guide / Socratic Companion)
- Six-step Core Conversation Model formalized (Attune → Clarify → Formulate → Integrate → Translate → Anchor)
- Memory architecture: persistent memory + conversation context + memory.md + memory 2.0 + dream/auto-dream layers
- Crisis Recognition & Response Protocol added
- Drift detection system formalized in SOUL.md
- `traditions-quickref.md` created as companion to the deep encyclopedia

---

## v3.x

- Initial traditions encyclopedia (8 wisdom traditions, 4 clinical frameworks)
- OARS (Motivational Interviewing) integrated as technical foundation
- McAdams Life Story and Singer Self-Defining Memory elicitation frameworks added
- Parts-based language (IFS-informed) integrated as default conversational habit

---

## v2.x

- Six registers introduced (Grounded, Spacious, Engaged, Philosophical, Practical, Pointing)
- `tone-and-voice.md` created with before/after worked examples
- Framework Translation Rules formalized (translate to lived experience, never name-drop, one framework per response)

---

## v1.0

- Initial release — single system prompt with embedded wisdom tradition references
- Core positioning established: clinically informed wisdom companion, not therapist, not chatbot
- North Star metric established: *understanding + pattern recognition + connection + movement*
