# Satori Architecture & Progressive Disclosure (v6.5.2)

Satori eliminates prompt bloat with an uncompromising progressive disclosure architecture. [`SKILL.md`](../SKILL.md) (`<8 KB`) is the single canonical source of truth and is completely self-sufficient for Turn 1. Reference modules load progressively on demand, with every markdown reference file guaranteed to be under the 24,000-byte context ceiling.

All quantitative budgets, environments, and benchmark gates are governed by [`facts.json`](../facts.json).

---

## Full File Load Budget & Progressive Disclosure Matrix

| File | Budget | Purpose | Load Condition |
|---|---|---|---|
| [`SKILL.md`](../SKILL.md) | `<8 KB` (Turn-1) | Canonical entry point, trigger boundaries (positive, negative, hybrid), 7 Immovables, 6-Step Model, verified global crisis table, 5-Point Pre-Send Check | **Turn 1 (Always, Frontier / Profiles 1–4)** |
| [`compact/SKILL.md`](../compact/SKILL.md) | `≤7,800` chars (`<8 KB`) | Single self-contained prompt for ChatGPT Custom GPTs, local models, and strict context budgets | **Profile 5 & Custom GPTs** |
| [`references/core-compact.md`](../references/core-compact.md) | `<12 KB` | Compact operational spine with complete safety parity and core mechanics | **Profile 5 Models Only** |
| [`references/SOUL.md`](../references/SOUL.md) | `~13 KB` (`<24 KB`) | Constitutional identity, 7 Immovables, voice philosophy, drift detection (`SHA-256` verified in [`openclaw.plugin.json`](../openclaw.plugin.json)) | **Turn 2+ (Profiles 1–4)** |
| [`references/clinical-spine.md`](../references/clinical-spine.md) | `<20 KB` (`<24 KB`) | Core 6-step mechanics, 3x6 Role/Register matrix, working formulation, parts awareness, autonomy guardrails, Three-Tier Risk Model | **Turn 2+ (Profiles 1–4)** |
| [`references/memory-system.md`](../references/memory-system.md) | `~9 KB` (`<24 KB`) | Default local vault (`~/.satori/memory/`), cloud-sync guardrails, SQLite FTS5 search, Dream Layer (`1->2->3`), `SATORI_NOTE v6.5` format | **When reading/writing memory** |
| [`references/model-calibration.md`](../references/model-calibration.md) | `~9 KB` (`<24 KB`) | 3-Tier Runtime Capability Detection and 5 Behavioral Profiles | **Model calibration reference** |
| [`references/traditions-quickref.md`](../references/traditions-quickref.md) | `~18 KB` (`<24 KB`) | Quick selection matrix across wisdom traditions and clinical modalities | **When selecting a lens** |
| [`references/traditions-eastern.md`](../references/traditions-eastern.md) | `~16 KB` (`<24 KB`) | Modular deep guide: Taoism, Buddhism, Zen, and Hindu philosophical traditions | **On demand (Eastern lens)** |
| [`references/traditions-stoic.md`](../references/traditions-stoic.md) | `~12 KB` (`<24 KB`) | Modular deep guide: Epictetus, Seneca, Marcus Aurelius, and Existentialism | **On demand (Stoic/Existential lens)** |
| [`references/traditions-african-sufi.md`](../references/traditions-african-sufi.md) | `~14 KB` (`<24 KB`) | Modular deep guide: Ubuntu, Kemetic *Ma'at*, Akan ethics, Sufism, and Indigenous reciprocity | **On demand (African/Sufi/Indigenous lens)** |
| [`references/toolkit-inquiry.md`](../references/toolkit-inquiry.md) | `~20 KB` (`<24 KB`) | OARS, Motivational Interviewing, McAdams narrative identity, Singer self-defining memories, Voss tactical empathy | **On demand (Inquiry & formulation)** |
| [`references/toolkit-somatic.md`](../references/toolkit-somatic.md) | `~14 KB` (`<24 KB`) | Somatic tracking, nervous system grounding, physical experiments, experiential focusing | **On demand (Somatic awareness)** |
| [`references/onboarding.md`](../references/onboarding.md) | `~8 KB` (`<24 KB`) | Context-First Bypass + gentle first-session sequence and privacy consent notice | **New users without immediate topic** |
| [`references/darknight-protocol.md`](../references/darknight-protocol.md) | `~7 KB` (`<24 KB`) | Pure presence mode for non-suicidal 3am existential despair (avoids alienating users in dark nights) | **On Dark Night signal** |
| [`references/grief-protocol.md`](../references/grief-protocol.md) | `~8 KB` (`<24 KB`) | Bereavement, disenfranchised grief, Pauline Boss Ambiguous Loss, Dual Process Oscillation, Continuing Bonds | **On grief / loss signal** |
| [`references/shadow-work-protocol.md`](../references/shadow-work-protocol.md) | `~11 KB` (`<24 KB`) | 5-session Jungian shadow integration arc and projection reclamation | **On shadow work engagement** |
| [`references/relationship-protocol.md`](../references/relationship-protocol.md) | `~8 KB` (`<24 KB`) | Solo relational rupture and Shared Two-Person Conflict Hold Mode (Multi-Partiality, Relational Psychoanalysis, Gottman, NVC) | **On relational conflict signal** |
| [`references/crisis-sources.json`](../references/crisis-sources.json) | `~4 KB` | Primary-source verified emergency and 24/7 crisis lines across 9 regions (verified within 120 days) | **Build-time & crisis reference** |
| [`SAFETY.md`](../SAFETY.md) | `~11 KB` | Comprehensive clinical safety policy, Three-Tier Risk Model, Candor Floor, and clinician audit log | **Safety governance** |
| [`PRIVACY.md`](../PRIVACY.md) | `~5 KB` | Threat model (T1–T6), local permissions (`0700`), cloud-sync protection, and right to erasure (`forget`/`purge` + `VACUUM`) | **Privacy and data sovereignty spec** |
| [`NOTICE.md`](../NOTICE.md) | `~4 KB` | Open-source attribution log crediting foundational skill and prompt lineages | **Attribution & licensing** |

---

## Architecture Principles

### 1. Zero Turn-1 Load Tax
In earlier iterations, loading an entire wisdom companion injected over 63 KB into the system prompt on Turn 1. Satori v6.5 guarantees that Turn 1 loads strictly under 8,000 bytes. The companion is immediately operational without context bloat or latency.

### 2. Universal Sharded Ceiling (`<24 KB`)
Large encyclopedic references have been sharded into focused, modular reference files (`traditions-eastern.md`, `traditions-stoic.md`, `traditions-african-sufi.md`, `toolkit-inquiry.md`, `toolkit-somatic.md`). Every markdown file in `references/` is verified by CI to remain strictly under the 24,000-byte rule ceiling required by agent harnesses.

### 3. Dual Declared Editions
Satori ships in two synchronized editions:
- **Satori Full (`dist/SatoriSkill-Full-v6.5.2.zip`)**: Designed for frontier reasoning models (Claude 3.7/Opus, Google Gemini, GPT-4o/o3). Features the full progressive disclosure library and local memory integration.
- **Satori Compact (`dist/SatoriSkill-Compact-v6.5.2.zip`)**: Designed for ChatGPT Custom GPT instruction boxes (strictly $\le 7,800$ characters) and small open-weights models (`<32B`). Contains the self-contained operational spine with 100% safety parity.

### 4. Constitutional Integrity
The SHA-256 hash of `references/SOUL.md` is locked in `openclaw.plugin.json` and verified at build time by `scripts/validate_skill.py`. Any modification to the core constitutional identity breaks CI.

### 5. Cross-Harness Synchronization
Satori supports 16 environments across 2 categories (10 Agent Harnesses and 6 Web Chat Surfaces) structured into Support Tiers (Tier A: Verified, Tier B: Community, Tier C: Experimental). `scripts/build_release.py --sync` mirrors `SKILL.md` into all Category B directories while Category A harnesses utilize ultra-lean pointer stubs (`<=15 lines`).

### 6. Three-Tier Risk Model
Rather than a binary on/off switch, Satori provides graduated safety:
- **Tier 1 (Risk Check-In)**: Gently clarifies ambiguous despair without abruptly severing rapport.
- **Tier 2 (Somatic Grounding)**: Direct somatic pacing for acute anxiety, panic, or non-suicidal emotional flooding.
- **Tier 3 (Immediate Crisis Lockout)**: Immediate tool and reflection lockout on acute self-harm or suicidal intent, providing primary-source verified emergency numbers.
