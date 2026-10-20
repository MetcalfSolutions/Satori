# Satori v6.5 Implementation Resume Pointer

> **Last Updated**: October 20, 2026 (04:20 AM)  
> **Status**: Planning & Specification Locked $\rightarrow$ Ready for Step 1 Implementation  
> **Target Specification**: [`docs/v6.5-planning/SPEC.md`](./SPEC.md)  
> **Gap Analysis & Map**: [`docs/v6.5-planning/GAP_ANALYSIS.md`](./GAP_ANALYSIS.md)  
> **Canonical Facts**: [`docs/v6.5-planning/facts.json`](./facts.json)

---

## Quick Resume Guide for Next Session

When resuming, tell the agent:
> *"Resume Satori v6.5 implementation from `docs/v6.5-planning/RESUME.md` and `docs/v6.5-planning/SPEC.md`. Start with Step 1 (Baseline CI Repair & facts.json SSOT Wiring)."*

---

## 1. Locked Decisions Summary
1. **Satori Full First**: Satori Full is being developed and benchmarked first. Satori Compact will be compiled afterward as a single self-contained prompt ($\le 7,800$ chars) with identical safety parity.
2. **Category A Stubs**: `scripts/validate_skill.py` Check #3 will validate the Satori pointer body ($\le 15$ lines) independently from the downstream `## Agent skills` block ($\le 30$ lines total).
3. **Reference Sharding**: `traditions-deep.md` (79 KB) and `conversation-toolkit.md` (39 KB) will be sharded into 5 modular files under 22 KB with single-hop pointers from `SKILL.md`.
4. **Memory Engine**: Default vault inverts to `~/.satori/memory/`. Cloud-sync paths hard-fail without `--allow-synced`. Continuity Notes follow `SATORI_NOTE v6.5` (max 600 chars, including `session_count`).
5. **Safety Invariants**: Three-Tier Risk Model, Precedence Ladder (1–6), Candor Floor, and Context-First Bypass are non-negotiable prompt invariants.
6. **Benchmark Gating**: 350 cases across 4 strata; Stratum 4 enforces a 100% hard gate on acute crisis handoffs; Stratum 2 computes 95% Wilson confidence intervals.

---

## 2. Next Immediate Action: Step 1 Execution

When you return, execution begins at **Step 1**:
1. Copy `docs/v6.5-planning/facts.json` to repository root (`facts.json`).
2. Update `scripts/validate_skill.py` Check #3 to isolate the Satori pointer stub lines from `## Agent skills`.
3. Wire `validate_skill.py` to read budgets (8 KB, 12 KB, 24 KB) and counts (16 environments) from `facts.json`.
4. Run `python scripts/validate_skill.py` and confirm 100% green pass.
5. Proceed to **Step 2**: Shard reference libraries under the 24 KB ceiling.
