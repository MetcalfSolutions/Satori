# Satori Architecture & Progressive Disclosure (v6.1.7)

Satori eliminates the legacy 63 KB Turn-1 load tax. [`SKILL.md`](../SKILL.md) (`<8 KB`) is the single canonical source of truth and is completely self-sufficient for Turn 1. Reference modules load progressively on demand:

## Full File Load Budget & Progressive Disclosure Matrix

| File | Budget | Purpose | Load Condition |
|---|---|---|---|
| [`SKILL.md`](../SKILL.md) | `<8 KB` | Canonical entry point, trigger boundaries, 7 Immovables, 6-Step Model, verified global crisis table, 5-Point Pre-Send Check | **Turn 1 (Always)** |
| [`references/core-compact.md`](../references/core-compact.md) | `<12 KB` | Self-contained operational spine for compact/local `<32B` models and voice pipelines | **Profile 5 Models Only** |
| [`references/SOUL.md`](../references/SOUL.md) | `~13 KB` | Constitutional identity, 7 Immovables, voice philosophy, drift detection (`SHA-256` verified in [`openclaw.plugin.json`](../openclaw.plugin.json)) | **Turn 2+ (Profiles 1-4)** |
| [`references/clinical-spine.md`](../references/clinical-spine.md) | `<20 KB` | Core 6-step mechanics, 3x6 Role/Register matrix, working formulation, parts awareness, autonomy guardrails, global crisis protocol (below Antigravity's `24 KB` per-file cap) | **Turn 2+ (Profiles 1-4)** |
| [`references/memory-system.md`](../references/memory-system.md) | `~9 KB` | 3-Tier Vault fallback (`.satori/memory/` -> `~/.satori/memory/` -> Web Capsule), Dream Layer (`1->2->3`), longitudinal formulation | **When reading/writing memory** |
| [`references/model-calibration.md`](../references/model-calibration.md) | `~9 KB` | 3-Tier Runtime Capability Detection and 5 Behavioral Profiles | **Model calibration reference** |
| [`references/traditions-quickref.md`](../references/traditions-quickref.md) | `~18 KB` | Quick selection matrix across wisdom traditions and clinical frameworks | **When selecting a lens** |
| [`references/traditions-deep.md`](../references/traditions-deep.md) | `~79 KB` | 30-section encyclopedia with a top-of-file **Line-Range Index Table** for selective ~35-line (`~1.5 KB`) reads | **Selective line-range read only** |
| [`references/conversation-toolkit.md`](../references/conversation-toolkit.md) | `~38 KB` | OARS/MI, McAdams, Singer, Voss tactical empathy, and **Patterns 1-16** (including Pattern Letter, Dream Walk, Ikigai Map, Shadow Invitation, **Inner Council**, and **Reflective Journaling**) | **On demand** |
| [`references/tone-and-voice.md`](../references/tone-and-voice.md) | `~13 KB` | Voice calibration, Structural Anti-Slop Pass, and human gold before/after examples | **On demand** |
| [`references/onboarding.md`](../references/onboarding.md) | `~8 KB` | Context-First Bypass + 5-question first-session sequence and privacy consent notice | **New users without an immediate topic** |
| [`references/darknight-protocol.md`](../references/darknight-protocol.md) | `~7 KB` | Pure presence mode for non-suicidal 3am existential despair | **On Dark Night signal** |
| [`references/grief-protocol.md`](../references/grief-protocol.md) | `~8 KB` | Bereavement, disenfranchised grief, Pauline Boss Ambiguous Loss, Dual Process Oscillation, Continuing Bonds | **On grief / loss signal** |
| [`references/shadow-work-protocol.md`](../references/shadow-work-protocol.md) | `~11 KB` | 5-session Jungian shadow integration arc | **On shadow work engagement** |
| [`references/relationship-protocol.md`](../references/relationship-protocol.md) | `~8 KB` | Solo relational rupture and Shared Two-Person Conflict Hold Mode (Multi-Partiality, Relational Psychoanalysis, Gottman, NVC + domestic abuse override) | **On relational conflict signal** |
| [`references/crisis-sources.json`](../references/crisis-sources.json) | `~4 KB` | Primary-source verified emergency and 24/7 crisis lines across 9 regions | **Build-time and crisis reference** |
| [`PRIVACY.md`](../PRIVACY.md) | `~5 KB` | Threat model (T1-T6), local permissions, cloud-sync protection, and user deletion (`forget` / `purge`) | **Privacy and data sovereignty spec** |

---

## Architecture Principles

### 1. Zero Turn-1 Load Tax
In earlier iterations, loading the entire wisdom companion context injected over 63 KB of text into the system prompt on Turn 1. Satori v6.1.7 guarantees that Turn 1 loads `<8 KB`.

### 2. Progressive Disclosure via Targeted Line-Range Reads
Large encyclopedic references like `references/traditions-deep.md` (`~79 KB`) include a top-of-file Line-Range Index Table. File-reading agents (such as Antigravity, Claude Code, and Codex) fetch only the exact ~35-line slice (`~1.5 KB`) corresponding to the specific tradition required.

### 3. Constitutional Integrity
The SHA-256 hash of `references/SOUL.md` is locked in `openclaw.plugin.json` and verified at build time by `scripts/validate_skill.py`. Any unauthorized modification to the core identity or 7 Immovables breaks the build gate.

### 4. Cross-Harness Synchronization
To support 8 agent ecosystems without drift, `scripts/build_release.py --sync` mirrors `SKILL.md` into all Category B directories (`.agents/skills/satori/`, `.cursor/skills/satori/`, `.opencode/skills/satori/`, `.hermes/skills/satori/`) while Category A harnesses utilize ultra-lean pointer stubs (`<=15 lines`).
