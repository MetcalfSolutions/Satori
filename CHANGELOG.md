# Changelog

All notable changes to Satori are documented here.

---

## v5.5.0 — Claude Code Native Variant (current)

### Added
- **`CLAUDE.md`** — Core Claude Code configuration: identity declaration, session start protocol, persistence protocol, collaborative access rules, slash command registry, agent protocol, external research protocol, and `.satori/` memory model mapping
- **`.claude/settings.json`** — UserPromptSubmit hook that automatically injects a compact context card (identity + patterns + formulation) before every user message; outputs `NO_SATORI_DIR` to trigger initialization when `.satori/` is absent
- **`setup.sh`** — Shell script to manually initialize the full `.satori/` directory structure
- **`.satori/` persistence layer** — Real file-backed memory replacing conceptual-only memory:
  - `core/identity.md` — User profile, voice calibration, confirmed formulations, working models
  - `core/patterns.md` — Signal→theme→pattern→formulation tracking (the Dream Layer made real)
  - `core/formulation.md` — Longitudinal formulation with dated history snapshots
  - `core/traditions.md` — Framework preference tracking, prevents framework fatigue
  - `sessions/YYYY-MM-DD-HHmm.md` — Timestamped session journals with full schema
  - `artifacts/letters/`, `artifacts/dreams/`, `artifacts/ikigai.md`, `artifacts/journal/` — All protocol artifacts persisted between sessions
  - `arcs/shadow-work.md` and other arc trackers — Multi-session arc progress
  - `feedback/` — Sanitized, committable feedback files (PII-free by design)
- **17 slash commands** as skill files in `skills/`:
  - Protocol: `/dream-walk`, `/shadow`, `/ikigai`, `/pattern-letter`, `/dark-night`, `/ground`
  - Analysis: `/reflect`, `/session-review`, `/formulation`, `/status`, `/history`
  - Data: `/feedback`, `/journal`, `/onboard`, `/traditions`, `/resources`, `/arc`
- **34 individual tradition files** in `references/traditions/` — Replaces monolithic `traditions-deep.md` (1019 lines) with surgical per-tradition loading (~30 lines each): stoicism, buddhism, taoism, christianity, sufi, hindu, confucian, existentialism, phenomenology, cbt, act, ifs, dbt, cft, schema-therapy, attachment-theory, relational-psychoanalysis, narrative-identity, polyvagal, somatic, neuroscience, grief, positive-psychology, evo-psych, motivational-interviewing, sociology, feminist, indigenous, integral, enneagram, mental-models, self-help, contemplative-science, ubuntu-african
- **`references/persistence-engine.md`** — Read/write protocol, Durable Test (3 criteria), file hygiene, privacy discipline, conflict resolution, agent synthesis protocol
- **`references/feedback-protocol.md`** — Prompted and user-initiated feedback collection, sanitization rules, storage format
- **`references/claude-code-integration.md`** — Tool usage for Satori, session continuity model, skill architecture, working directory awareness
- **Background agent pattern synthesis** — Auto-triggered after significant sessions; also on-demand via `/reflect`
- **Collaborative file access** — User can view/edit any `.satori/` file; Satori proactively invites review when formulation evolves
- **WebSearch/WebFetch integration** — Live resource discovery (Pattern 8/`/resources`) and tradition research (`/traditions`)

### Changed
- `SKILL.md` — Version 5.5.0; updated reference files load order (added CLAUDE.md, persistence-engine.md, feedback-protocol.md, claude-code-integration.md, skills/; replaced traditions-deep.md with individual files); added slash commands section
- `references/clinical-spine.md` — Extended memory section with file-backed persistence layer mapping; added file-backed memory operations section (session start, during-session, session close, auto-synthesis, collaborative invitations)
- `references/onboarding.md` — Added Step 6: initialize `.satori/` from onboarding answers (creates identity.md, patterns.md, formulation.md, traditions.md, first session journal)
- `references/traditions-quickref.md` — Added note pointing to individual tradition files for depth; added complete file listing
- `plugin.json` + `.claude-plugin/plugin.json` — Version 5.5.0; updated alwaysLoad (added CLAUDE.md), onDemand (updated to individual files, added new reference files), conditional (added traditions/[name].md), added skills array

### Deprecated
- `references/traditions-deep.md` — Superseded by `references/traditions/[name].md` individual files

---

## v5.1 — (previous)

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
