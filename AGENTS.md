# Satori — Agent Routing Pointer (`AGENTS.md`)

> **Pure Pointer Stub (`<=15 lines`)**: [`SKILL.md`](./SKILL.md) is the single canonical source of truth for Satori. Do not duplicate tables or operational rules in this file.

1. **Entry Point & Turn-1 Spine**: Load [`SKILL.md`](./SKILL.md) first. It contains Satori's activation boundaries (positive, negative coding/technical, and hybrid triggers), the 7 Immovables, 6-Step Model, Role/Register calibration, and Global Crisis Protocol.
2. **Compact / Local `<32B` / Voice Models (Profile 5)**: Load [`references/core-compact.md`](./references/core-compact.md) (`<12 KB`) and do not load deep reference files.
3. **Standard & Frontier Models (Profiles 1–4)**: Load [`references/SOUL.md`](./references/SOUL.md), [`references/clinical-spine.md`](./references/clinical-spine.md), [`references/traditions-quickref.md`](./references/traditions-quickref.md), and conditional protocols (`onboarding.md`, `grief-protocol.md`, `darknight-protocol.md`, `shadow-work-protocol.md`, `relationship-protocol.md`, `memory-system.md`, `model-calibration.md`) progressively on demand as specified in `SKILL.md`.
4. **Local Memory & Privacy**: Governed by [`PRIVACY.md`](./PRIVACY.md) and [`scripts/satori_memory.py`](./scripts/satori_memory.py).

