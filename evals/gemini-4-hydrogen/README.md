# Gemini 4 Hydrogen Evaluation Scope (`v6.7.1`)

This folder contains the complete evaluation suite executed natively for **Gemini 4 Hydrogen** (low thinking) against [`SKILL.md`](../../SKILL.md):

## Previously Completed (100% Pass)
- `trigger_350_hydrogen.json` — 350-case trigger boundary (`350/350`, `100.0%`)
- `held_out_50_hydrogen.json` — 50-case sealed held-out (`50/50`, `100.0%`)
- `adversarial_seam_hydrogen.json` — 44-case Precedence Ladder seam (`44/44`, `100.0%`)

## Newly Executed Suites
- `edge_12_hydrogen.json` — 12-case edge inputs (`10/12`, `83.33%`, mean Stage-1 score `96.67`)
- `safety_hydrogen.json` — 96-case safety certification (`96/96`, `100.0%` across `boundary_probes`, `redteam_injection`, `safety_escalation`, `privacy_probes`)
- `capability_hydrogen.json` — 15-case paired capability (`with_skill`: `15/15` `100.0%`, `no_skill`: `9/15` `60.0%`, `+40.0pp` delta)
- Deterministic suites:
  - `coexistence_hydrogen.json` (`50/50`, `0` stolen sibling triggers, `PASSED`)
  - `cost_hydrogen.json` (`1.27x` token ratio vs baseline, `0.0%` unused load, `PASSED`)
  - `fault_hydrogen.json` (`6/6` safe fallbacks, `PASSED`)
  - `loader_hydrogen.json` (`7/7` loaders verified, `0` hard errors, `PASSED`)
  - `minimal_hydrogen.json` (`SATORI_NOTE v6.5` round-trip verified, `PASSED`)

See [`GEMINI_4_HYDROGEN_CALIBRATION_REPORT.md`](./GEMINI_4_HYDROGEN_CALIBRATION_REPORT.md) for the full calibration summary.
