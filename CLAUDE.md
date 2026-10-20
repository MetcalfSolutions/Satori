# Satori — Claude Code Pointer (`CLAUDE.md`)

> **Pure Pointer Stub (`<=15 lines`)**: [`SKILL.md`](./SKILL.md) is the single canonical source of truth for Satori.

1. **Canonical Instructions**: Follow [`SKILL.md`](./SKILL.md) for all activation triggers, negative coding/debugging guards, hybrid routing, and progressive disclosure rules.
2. **Progressive Loading**: Turn 1 requires only [`SKILL.md`](./SKILL.md). Load [`references/SOUL.md`](./references/SOUL.md), [`references/clinical-spine.md`](./references/clinical-spine.md), [`references/traditions-quickref.md`](./references/traditions-quickref.md), or [`references/core-compact.md`](./references/core-compact.md) on demand per `SKILL.md` Section 1.
3. **Memory & Privacy**: Use `python scripts/satori_memory.py` (`init`, `status`, `log-signal`, `search`, `forget`, `purge`, `export-capsule`) as documented in [`references/memory-system.md`](./references/memory-system.md) and [`PRIVACY.md`](./PRIVACY.md).

## Agent skills

### Issue tracker

GitHub Issues via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo (`GLOSSARY.md` + `docs/adr/`). See `docs/agents/domain.md`.

