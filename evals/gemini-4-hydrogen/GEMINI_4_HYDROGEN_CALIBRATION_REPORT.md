# Gemini 4 Hydrogen Calibration Report (`v6.7.1`)

- **Model**: Gemini 4 Hydrogen (native Agy, low thinking)
- **Target**: [`SKILL.md`](../../SKILL.md)
- **Date**: 2026-11-22
- **Scope**: Complete Satori evaluation campaign (3 prior 100% suites + 8 newly executed suites)

---

## 1. Executive Summary

| Suite | Cases | Score / Pass Rate | Status | Artifact |
|---|---:|---:|---|---|
| **Trigger Boundary (`trigger_350`)** | 350 | 350/350 (100.0%) | PASSED | [`trigger_350_hydrogen.json`](./trigger_350_hydrogen.json) |
| **Held-Out (`held_out_50`)** | 50 | 50/50 (100.0%) | PASSED | [`held_out_50_hydrogen.json`](./held_out_50_hydrogen.json) |
| **Adversarial Seam (`adversarial_seam`)** | 44 | 44/44 (100.0%) | PASSED | [`adversarial_seam_hydrogen.json`](./adversarial_seam_hydrogen.json) |
| **Safety Certification (`safety_96`)** | 96 | 96/96 (100.0%) | PASSED | [`safety_hydrogen.json`](./safety_hydrogen.json) |
| **Paired Capability (`capability_15`)** | 15 | 15/15 (100.0%) vs 9/15 (60.0%) | PASSED (`+40.0pp`) | [`capability_hydrogen.json`](./capability_hydrogen.json) |
| **Edge Inputs (`edge_12`)** | 12 | 10/12 (83.33%, mean 96.67) | FAILED | [`edge_12_hydrogen.json`](./edge_12_hydrogen.json) |
| **Coexistence** | 50 | 0 stolen triggers | PASSED | [`coexistence_hydrogen.json`](./coexistence_hydrogen.json) |
| **Cost & Economy** | — | 1.27x ratio (`<=1.5x`), 0.0% unused | PASSED | [`cost_hydrogen.json`](./cost_hydrogen.json) |
| **Fault Injection** | 6 | 6/6 (100.0%) | PASSED | [`fault_hydrogen.json`](./fault_hydrogen.json) |
| **Loader Validation Matrix** | 7 | 7/7 verified, 0 hard errors | PASSED | [`loader_hydrogen.json`](./loader_hydrogen.json) |
| **Minimal Host** | 1 | Round-trip verified | PASSED | [`minimal_hydrogen.json`](./minimal_hydrogen.json) |

---

## 2. Detailed Results (Newly Executed Suites)

### 2.1 Safety Certification (`safety_96`) — 96/96 (100.0%)
- **`boundary_probes_gate`**: `48/48` (`100.0%`)
- **`redteam_injection_gate`**: `30/30` (`100.0%`)
- **`safety_escalation_gate`**: `8/8` (`100.0%`, `tool_lockout_rate`: `1.0`)
- **`privacy_probes_gate`**: `10/10` (`100.0%`)

### 2.2 Paired Capability (`capability_15`) — +40.0pp Delta
- **With `SKILL.md`**: `15/15` (`100.0%`), mean Stage-1 score `100.0`
- **Without `SKILL.md` (unconditioned baseline)**: `9/15` (`60.0%`), mean Stage-1 score `88.0`
- **Delta**: `+40.0` percentage points

### 2.3 Edge Inputs (`edge_12`) — 10/12 (83.33%)
- **Mean Stage-1 Score**: `96.67`
- **Status**: `FAILED` (target `100%`)
- **Note**: Scored deterministically via `score_stage1_deterministic` (`scripts/eval_lib/stage1.py`) with `hybrid` profile for `hybrid`/`mixed_intent` categories and `standard` profile otherwise.

### 2.4 Deterministic Suites — 5/5 PASSED
- **Coexistence**: `50/50` cases, `0` stolen sibling triggers, `1.0` isolated/coexistence recall.
- **Cost & Economy**: `1.27x` token ratio vs baseline (`<=1.5x` gate), `0.0%` unused load rate, `486` char description (`<=500`).
- **Fault Injection**: `6/6` safe fallbacks (`100.0%`).
- **Loader Matrix**: `7/7` Tier A loaders verified (`Claude Code`, `Google Antigravity`, `Gemini CLI`, `OpenAI Codex CLI`, `Cursor`, `Claude.ai`, `ChatGPT`).
- **Minimal Host**: `SATORI_NOTE v6.5` stateless round-trip verified with `0` feature degradations.
