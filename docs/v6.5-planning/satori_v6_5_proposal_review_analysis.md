# Satori v6.5 Proposal Review & Architectural Analysis

**Documents Reviewed**:
- `Satori 6.5 Product Requirements Document.md` (`6.5.0-PRD-r2`)
- `Satori Marketing Copy Plan - 6.5.md` (`6.5.0-MCP-r2`)
- `Satori Style Guide - 6.5.md` (`6.5.0-SG`)
- `facts.json` (`6.5.0-r2`)
- **Baseline Compared**: `github.com/MetcalfSolutions/Satori` (`v6.1.7` / `v6.1.8`)

---

## 1. Executive Assessment

The Satori v6.5 Revision 2 planning suite is an exceptionally disciplined, ethically serious, and architecturally mature specification that transforms Satori from a clever prompt library into a verifiable, safety-governed cross-platform engineering artifact. **Overall Proficiency & Readiness Level: Outstanding.**

### Evaluation Context & Rubric
Because these documents serve as a **Professional Product, Safety, and Systems Architecture Specification** for an open-source AI companion operating in a high-trust psychological domain, this review evaluates the proposal against four foundational criteria:

| Criterion | Score (1–4) | Assessment Summary |
|---|:---:|---|
| **1. Architectural Soundness & Feasibility** | **3.8 / 4.0** | Replacing brittle self-detection heuristics with **Declared Editions (Full vs. Compact)** and a **Two-Tier RECI** engine solves v6.1's model-aliasing rot. Minor friction remains around ChatGPT character limits vs. Compact byte budgets and two-hop reference sharding. |
| **2. Safety, Privacy & Clinical Boundaries** | **3.9 / 4.0** | The **Three-Tier Risk Model**, **Precedence Ladder**, **Candor Floor**, **Works Alongside Therapy** principle, and data-only **Continuity Notes** set an industry-leading bar. A few stateless web-surface edge cases need tightening. |
| **3. Verification & Claims Integrity** | **3.7 / 4.0** | Anchoring all quantitative claims in `facts.json` and scaling to a **350-case Four-Strata Benchmark** directly eliminates the ecosystem count drift seen in v6.1.5–v6.1.8. However, hardcoded example metrics in the Marketing Copy Plan currently conflict with `facts.json` validation. |
| **4. Solo-Maintainer Execution Realism** | **3.5 / 4.0** | Support Tiers (A/B/C) and the Milestone 1 vs. Milestone 2 split protect maintainer bandwidth well, though scheduling the external clinician audit at the end of December creates a critical-path bottleneck. |

---

## 2. Major Architectural Wins in v6.5 (What Revision 2 Nails)

1. **Single Source of Truth (`facts.json`) vs. v6.1.8 Repo Drift**:
   In the current v6.1.7/v6.1.8 repository, `README.md` badges and prose still show historical drift ("8 Agent Ecosystems" in one badge vs. "9 ecosystems" in the remediation notes vs. 16 total surfaces). Centralizing every count, byte budget, and gate threshold in `facts.json` and enforcing it in `scripts/validate_skill.py` permanently closes this failure mode.
2. **Declared Editions (`Full` vs. `Compact`) Over Self-Detection**:
   Expecting an LLM to introspect its own parameter count, quantization level, or context window size inside a bare web chat window is fundamentally unreliable. Moving to explicit install-time editions (`SatoriSkill-Full-v6.5.0.zip` and `SatoriSkill-Compact-v6.5.0.zip`) with verified safety parity is a much cleaner engineering design.
3. **The Three-Tier Risk Model & Precedence Ladder**:
   The distinction between **Tier 0 (Dark Night existential despair)**, **Tier 1 (Passive Ideation / Risk Check-In)**, and **Tier 2 (Acute Crisis with Tool Lockout + "Stay Present" Handoff)**—governed by the explicit 6-rank **Precedence Ladder** (PRD §5.5)—solves two opposite failure modes: premature hotline dumping on non-suicidal 3:00 AM grief, and task-first execution when a coding prompt contains a crisis disclosure.
4. **Data-Only Continuity Notes & Local Vault Isolation**:
   Renaming "Memory Capsule" to **Continuity Note** (PRD §5.2.1), capping it at $\le 600$ characters of strictly allowlisted key-value pairs, stripping instruction-like text to prevent prompt injection, defaulting the CLI vault to `~/.satori/`, and halting initialization inside cloud-synced folders (OneDrive, Google Drive, Dropbox, iCloud, Box) unless `--allow-synced` is passed represents thorough threat modeling.
5. **Register Separation in `Satori Style Guide - 6.5.md`**:
   Explicitly separating Satori's **Conversational Output Register** (Anti-Slop rules, zero rule-of-three, zero false binary contrasts, sensory warmth) from the **Brand & Public Copy Register** (concessions early, evidence first, banned hype lexicon) keeps both the companion and the repository authentic.

---

## 3. Primary Growth Areas, Cross-Document Gaps & Actionable Next Steps

Before you begin Phase 1 and Milestone 1 implementation, the following seven cross-document discrepancies and architectural edge cases should be resolved:

### 3.1 Compact Edition Byte Budget vs. ChatGPT Custom GPT Character Limits
- **Citations**:
  - `PRD §5.6`: Defines **Satori Compact** contents as *"Compact `SKILL.md` + `references/core-compact.md` only"* and states it is intended for *"surfaces with tight instruction limits such as ChatGPT Custom GPT instructions"*.
  - `PRD §6.2 (Adapter Matrix)`: Lists ChatGPT (Custom GPT) manifest as *"Compact `SKILL.md` in Instructions"* and notes: *"reference files uploaded as Custom GPT Knowledge are retrieved, not reliably loaded, so ChatGPT is served by the Compact edition."*
  - `PRD §8 FR-1.2` & `facts.json`: Caps `references/core-compact.md` at `12000` bytes, while `Marketing Copy Plan §3.5` describes `SatoriSkill-Compact-v6.5.0.zip` as featuring *"the compact operational spine (`references/core-compact.md`, `<12 KB`)"*.
- **The Issue**:
  OpenAI's Custom GPT `Instructions` field enforces a hard limit of **8,000 characters** (not bytes), and as PRD §6.2 rightly notes, any secondary file uploaded to Custom GPT `Knowledge` (`references/core-compact.md`) is subject to RAG retrieval rather than deterministic Turn-1 loading. If the Compact operational spine lives in `references/core-compact.md` at $12,000\text{ bytes}$, a ChatGPT Custom GPT user who only pastes `Compact SKILL.md` into `Instructions` will miss the core operational rules in `core-compact.md`—or, if they try to paste `core-compact.md` into `Instructions`, it will exceed the 8,000-character limit.
- **Actionable Next Step**:
  Restructure the Compact edition so that for single-box Web Chat surfaces (ChatGPT Custom GPT, Grok Web Project Instructions, DeepSeek system prompt), **the entire self-contained Compact prompt fits inside a single file capped at $\le 7,800\text{ UTF-8 characters}$** (fitting inside both `SKILL.md`'s $8,000\text{-byte}$ ceiling and ChatGPT's $8,000\text{-character}$ limit). Clarify in PRD §5.6 and FR-1.2 whether `references/core-compact.md` is a single-file paste target ($\le 7,800\text{ chars}$) or a CLI-only reference for local `<32B` models.

### 3.2 Hardcoded Benchmark Numbers in Marketing Copy & Style Guide vs. `facts.json` Validator
- **Citations**:
  - `Marketing Copy Plan §4.1 (Eval Results Card)`, `§4.4 (Show HN)`, & `§4.5 (Tweet 3)`: Hardcode exact achieved figures: *"93.3% Recall"*, *"97.0% Non-Activation Rate (95% Wilson CI: [93.6%, 98.6%])"*, and *"88.0% Quality"*.
  - `Style Guide §3.3`: Includes *"Non-Activation Rate of ≥95% across 200 pure-technical cases (95% Wilson CI: [93.6%, 98.6%])"*.
  - `PRD §8 FR-5.4` & `§11.1`: Mandates that `scripts/validate_skill.py` *"validates that all quantitative assertions in shipped docs match `facts.json` exactly."*
- **The Issue**:
  Currently, `facts.json` only stores target gates (`">=95%"`, `">=90%"`, `">=85%"`, `"100%"`), not the achieved point estimates (`97.0%`, `93.3%`, `88.0%`, `[93.6%, 98.6%]`). Furthermore, the 350-case benchmark won't be authored and run across 3+ Tier A models until Milestone 1. Having fabricated/projected point estimates (`97.0%` = $194/200$, `93.3%` = $56/60$, `88.0%` = $44/50$) written as fact in the Marketing Copy Plan and Style Guide risks either failing your own `validate_skill.py` check or accidentally publishing placeholder numbers at launch.
- **Actionable Next Step**:
  Add an `achieved_results` object to `facts.json` (initially set to `"pending_m1_eval"` or populated automatically by `scripts/run_evals.py`), and mark the point estimates in `Satori Marketing Copy Plan - 6.5.md` and `Satori Style Guide - 6.5.md` as template variables (e.g., `{{achieved.non_activation_rate}}`) until the Milestone 1 multi-model eval report (`evals/live_calibration_report.json`) is generated.

### 3.3 Stateless Web Surfaces vs. the "Every 5 to 7 Substantive Sessions" Over-Reliance Rule
- **Citations**:
  - `PRD §10.6 (Over-Reliance & Parasocial Attachment Safeguards)`: States that *"Every 5 to 7 substantive sessions, Satori quietly introduces a conversational nudge that explores how the user is sharing their insights with human friends, partners, or community members."*
  - `PRD §5.2.1 (Continuity Note Specification)`: Defines the strict 6-field allowlist (`theme`, `stance`, `lens`, `step`, `anchor_question`, `created`) and states *"Unknown keys are rejected."*
- **The Issue**:
  In Mode 2 (Web Chat Surfaces), Satori has no persistent session counter across browser tabs unless the user pastes a Continuity Note, and the Continuity Note schema in §5.2.1 does not include a `session_count` field. Consequently, Mode 2 Satori cannot know when 5 to 7 sessions have occurred.
- **Actionable Next Step**:
  Add an allowlisted integer key `session_count: <int>` to the Continuity Note schema in PRD §5.2.1 (incremented each time a note is exported), AND add an intra-session fallback rule in PRD §10.6 for stateless web chats (e.g., triggering the real-world connection check-in whenever a user exports a Continuity Note or reaches $\ge 8$ substantive turns in a single session).

### 3.4 Safety & Privacy Copy Gaps in the Audience A Starter Prompt and Demo Script
- **Citations**:
  - `Marketing Copy Plan §2.1.1 (The 60-Second "Try It Now" Starter Prompt)`: Line 6 reads: *"If acute crisis, self-harm, or danger is present, halt reflection immediately and urge real-world human care."*
  - `Marketing Copy Plan §2.1.3 (45-Second Demo Video Script Outline)`: The closing voiceover (`0:35–0:45`) on the web landing page states: *"Free. Open-source. Private to your machine. Try Satori 6.5."*
  - `Marketing Copy Plan §1` & `Style Guide §3.3`: Explicitly prohibit claiming *"Private to your machine"* for web chat contexts where conversations run on provider servers (requiring *"Free, open-source, and zero tracking"* instead).
- **The Issue**:
  1. Audience A users who copy-paste the 15-line Starter Prompt into a free web chat window do not have `references/crisis-resources.md` loaded. Line 6 tells the model to "halt reflection immediately and urge real-world human care," which violates your own **Tier 2 "Stay Present"** rule (PRD §10.2: *"Do not abandon the user with a cold wall of silence"*) and omits primary-source crisis numbers (`988` / `findahelpline.com`).
  2. The 45-second video script on the Audience A web landing page uses the CLI strapline (*"Private to your machine"*) rather than the web-surface strapline (*"zero tracking"*).
- **Actionable Next Step**:
  Update Line 6 of the 60-Second Starter Prompt in `Marketing Copy Plan §2.1.1` to:
  > *"6. If acute crisis, self-harm, or danger is present, pause reflection, stay warmly present without probing, and share verified help (call/text 988 in US/Canada, 111/999 in UK, or findahelpline.com)."*
  And update the `0:35–0:45` voiceover in `§2.1.3` to: *"Free, open-source, and zero tracking."*

### 3.5 Two-Hop Reference Loading Penalty from `SKILL.md` Sharding
- **Citations**:
  - `PRD §8 FR-1.4`: Requires sharding `references/traditions-deep.md` and `references/conversation-toolkit.md` into modular files under $24,000\text{ bytes}$ (`traditions-eastern.md`, `traditions-stoic.md`, `traditions-african.md`, etc.).
  - `PRD §9.1a (SKILL.md Byte-Budget Migration Plan)`: Moves the inline traditions summary table from `SKILL.md` to `references/traditions-quickref.md` and compresses Section 1 loading rules into a 4-line pointer block to save $\sim 2,400\text{ bytes}$.
- **The Issue**:
  If `SKILL.md` only points to `references/traditions-quickref.md`, then whenever an agent needs a specific tradition shard (e.g., `traditions-stoic.md`), it must perform **two sequential file reads** on Turn 1 or Turn 2 (`SKILL.md` $\rightarrow$ `traditions-quickref.md` $\rightarrow$ `traditions-stoic.md`). In CLI harnesses (Claude Code, Cursor, Codex), extra tool calls add visible latency and increase the chance that the model skips reading the deep shard altogether.
- **Actionable Next Step**:
  Keep a compact 3-line filename index directly inside `SKILL.md`'s 4-line pointer block (costing $< 220\text{ bytes}$ out of your $600\text{-byte}$ buffer in §9.1a) that maps each domain directly to its shard filename (e.g., `Stoic/Existential -> references/traditions-stoic.md | Buddhist/Taoist/Hindu -> references/traditions-eastern.md | Ubuntu/Ma'at/Akan/Sufi -> references/traditions-african-sufi.md`), enabling single-hop progressive disclosure.

### 3.6 Non-Telemetry Denominator for `< 1 per 100 Installs` Hijack Target
- **Citations**:
  - `PRD §1.4 (Success Measures Without Telemetry)`: Sets a Milestone 1 target for Hijack reports (`hijack` issue label) at `< 1 per 100 installs` and `felt-heard` vs. `missed-me` ratio at `≥ 3:1`, while stating *"Satori itself never prompts users to submit feedback during an introspective session."*
- **The Issue**:
  Without telemetry, "100 installs" has no unified denominator unless you aggregate GitHub Release zip downloads + npm downloads + git clones (and note that GitHub's Traffic API deletes git clone counts after 14 days). Furthermore, if users never see the anonymous feedback form link inside Satori, only highly technical GitHub users will ever file `felt-heard` or `missed-me` issues, skewing your sample entirely toward Audience B/C.
- **Actionable Next Step**:
  1. Add a lightweight scheduled GitHub Action (`.github/workflows/metrics_snapshot.yml`) that polls the GitHub Releases API and Traffic Clones API weekly and appends aggregate counts to a public badge/JSON file in the repo so 14-day clone windows aren't lost.
  2. Surface the opt-in anonymous feedback link in the CLI `/satori` help output (`/satori --help`) and on the GitHub Pages web setup page so Audience A can find it outside of active introspection turns.

### 3.7 Critical-Path Risk on the External Clinician Audit Window
- **Citations**:
  - `PRD §10.8`: Requires a licensed clinical psychologist to review and sign off on the Three-Tier Risk Model, Onboarding Resonance Engine, and Crisis Safeguards in `SAFETY.md` before Milestone 1 ships.
  - `PRD §13.2 (Gantt Chart)`: Schedules `External Clinician Audit Sign-off` from `2026-12-15` to `2026-12-29`, *after* the 350-case benchmark (`2026-11-15` to `2026-12-06`) and Dual Release Zips (`2026-12-05` to `2026-12-15`) are already built.
- **The Issue**:
  Treating the clinical review as a waterfall sign-off at the very end of Milestone 1 (and during the December holiday period) introduces two high-probability risks:
  1. Clinician scheduling and legal/liability hesitation around public sign-off in `SAFETY.md` often takes 4–6 weeks of lead time.
  2. If the clinician recommends changes to the Tier 1 check-in phrasing, Candor Floor triggers, or onboarding flow in late December, you will have to rewrite `SKILL.md` / `core-compact.md` and **re-run the entire 350-case multi-model benchmark and Tier 4 judge calibration**.
- **Actionable Next Step**:
  Split the External Clinical Review into two phases on the roadmap:
  - **Phase A (Late October / Early November)**: Clinician recruitment and design review of `SKILL.md`, `onboarding.md`, and the Three-Tier Risk Model *before* locking the 350-case benchmark and running multi-model evaluations.
  - **Phase B (Early December)**: Final verification sign-off in `SAFETY.md` once the benchmark results are generated.

---

## 4. Recommended Pre-Implementation Checklist (Phase 1 -> Milestone 1 Transition)

To start work on Satori v6.5 cleanly from the v6.1.8 baseline, here is the recommended execution order:

1. **Commit `facts.json` First & Wire `scripts/validate_skill.py`**:
   Make `facts.json` the first file merged into the `v6.5-dev` branch and update `scripts/validate_skill.py` to read budgets (`8000`, `12000`, `24000`) and ecosystem counts (`16` total: `10` harnesses, `6` web surfaces) directly from `facts.json`.
2. **Resolve the Compact Edition Single-File Specification**:
   Decide whether `Compact SKILL.md` ($\le 7,800\text{ chars}$) is the single self-contained artifact for both `SatoriSkill-Compact-v6.5.0.zip` and paste-only Web Chat surfaces (ChatGPT Custom GPTs, Grok Web, DeepSeek), eliminating the ambiguity between `Compact SKILL.md` and `references/core-compact.md`.
3. **Shard Oversized Reference Files & Test Single-Hop Pointers**:
   Check current byte sizes in `references/` (`traditions-deep.md`, `conversation-toolkit.md`), split them below $24,000\text{ bytes}$, and verify the `SKILL.md` byte-budget migration (§9.1a) lands at $\sim 7,400\text{ bytes}$ with direct single-hop shard filenames.
4. **Initiate External Clinician Outreach Immediately**:
   Begin outreach for the §10.8 clinical review during Phase 1 so clinical feedback informs the First-Run Resonance Engine (`references/onboarding.md`) and Three-Tier Risk Model *prior* to executing the 350-case benchmark suite.