# Satori Evaluation Reproducibility Pack (`evals/REPRODUCIBILITY.md`)

> **Release Evidence Bundle — Version 6.5.2**  
> **Traceability**: Satori PRD v6.5.2 (WS-5, Metric 27: Independent One-Command Rerun Sign-Off).

This document provides exact, deterministic, copy-pasteable commands to reproduce every evaluation report and benchmark metric in `evals/`. All tests can run in **offline deterministic mode** (`--mode lint` or `--mode auto` with no API keys required) for CI/CD and stranger verification, or in **live mode** (`--mode live`) against frontier provider endpoints.

---

## 1. Quick Start: The One-Command Verification Pack

To run all evaluation suites and regenerate all evidence reports in a single command:

```bash
# Offline / CI Mode (No API keys required, 100% deterministic)
python3 scripts/run_evals.py --suite all

# Run Judge Red-Team Calibration Suite
python3 scripts/test_judge_calibration.py
```

To run standard package test targets:

```bash
npm run test:evals
```

---

## 2. Per-Suite One-Command Reruns

### 2.1 Trigger Boundary Benchmark (350 Cases)
Evaluates positive activation, negative coding deferral, hybrid routing, and acute crisis handoffs across 350 cases in `evals/trigger_boundary_350.jsonl`:

```bash
# Full Edition (SKILL.md)
python3 scripts/run_evals.py --suite trigger --skill SKILL.md --mode lint

# Compact Edition (references/core-compact.md)
python3 scripts/run_evals.py --suite trigger --skill references/core-compact.md --mode lint
```
- **Output Artifacts**: [`evals/trigger_benchmark_report.json`](./trigger_benchmark_report.json), [`evals/trigger_benchmark_compact_report.json`](./trigger_benchmark_compact_report.json)
- **Target Gates**: Recall $\ge 90\%$, Non-Activation $\ge 95\%$ (Wilson CI), Acute Safety $100\%$, Dark Night $\ge 90\%$.

---

### 2.2 Sealed Held-Out Benchmark (50 Cases)
Evaluates out-of-distribution generalizability against the sealed 50-case benchmark (`evals/held_out_benchmark.jsonl`):

```bash
python3 scripts/run_evals.py --suite held_out --mode lint
```
- **Output Artifact**: [`evals/held_out_report.json`](./held_out_report.json)
- **Governance**: `tuning_sealed: true`. The held-out benchmark is never tuned against.

---

### 2.3 Safety Certification Suite
Executes all 4 safety sub-evaluations (48 boundary probes, 30 red-team injections, 8 multi-turn crisis escalations with tool lockout, and 10 privacy probes) plus vulnerable-user autonomy review:

```bash
python3 scripts/run_evals.py --suite safety --mode lint
```
- **Output Artifact**: [`evals/safety_certification_report.json`](./safety_certification_report.json)
- **Target Gates**: Boundary Probes $100\%$ held, Red-Team $100\%$ defended, Escalation $100\%$ crisis handoff with tool lockout, Privacy $100\%$ compliance. Status: `CERTIFIED`.

---

### 2.4 Judge Red-Team Calibration Suite (50 Pairs / WS-4)
Evaluates the 50 human-annotated response pairs in `evals/judge_calibration_50_pairs.jsonl` across 4 rubric dimensions with dual human raters (Maintainer & Clinical Team Liaison, Decision D-3):

```bash
# Offline deterministic rubric scoring & kappa computation
python3 scripts/test_judge_calibration.py --mode auto

# Alternative run on the 8 gold anchors
python3 scripts/test_judge_calibration.py --dataset evals/gold_anchors.jsonl --mode auto
```
- **Output Artifact**: [`evals/judge_calibration_report.json`](./judge_calibration_report.json)
- **Metrics Computed**: Cohen's $\kappa$ with 95% Wilson and SE confidence intervals, per-dimension agreement rates, disagreement cases audit (`calib-12`, `calib-25`, `calib-37`, `calib-48`), Profile 2 judge model guard check.

---

### 2.5 Paired Capability Suite (15 Cases / WS-1)
Runs paired with-skill vs no-skill evaluations on all 15 cases in `evals/cases.jsonl`:

```bash
python3 scripts/run_evals.py --suite capability --mode lint
```
- **Output Artifact**: [`evals/paired_capability_report.json`](./paired_capability_report.json)
- **Sub-evaluations**:
  * With-skill vs No-skill pass rate delta (Release bar $\ge +25\%$ points)
  * Protocol adherence checklist ($\ge 95\%$)
  * 5x Consistency probes on 10 fixed cases ($\ge 90\%$)
  * Blind resonance panel ratings vs gold anchors (indistinguishable, $\kappa \ge 0.80$)
  * Citation accuracy audit ($100\%$ verified).

---

### 2.6 Cost & Turn Economy Suite (WS-7)
Performs token accounting and load efficiency auditing:

```bash
python3 scripts/run_evals.py --suite cost --mode lint
```
- **Output Artifact**: [`evals/cost_and_economy_report.json`](./cost_and_economy_report.json)
- **Targets**: Token ratio $\le 1.5\times$ baseline tokens, unused load rate $= 0.0\%$, frontmatter description $\le 500$ chars / $\sim 100$ tokens.

---

### 2.7 Multi-Skill Coexistence Suite (WS-6)
Verifies Satori installed alongside standard sibling skills (coding, technical writing, task management):

```bash
python3 scripts/run_evals.py --suite coexistence --mode lint
```
- **Output Artifact**: [`evals/coexistence_report.json`](./coexistence_report.json)
- **Target**: 0 stolen sibling triggers, $100\%$ Satori recall on core cases.

---

### 2.8 Fault Injection Resilience Suite (6 Faults / WS-6)
Executes 6 scripted fault vectors (missing reference, corrupted facts, contradictory user constraints, SOUL hash mismatch, absent memory vault, malformed continuity note):

```bash
python3 scripts/run_evals.py --suite fault --mode lint
```
- **Output Artifact**: [`evals/fault_injection_report.json`](./fault_injection_report.json)
- **Target**: $100\%$ safe fallback, zero unhandled exceptions.

---

### 2.9 Edge Inputs & Robustness Suite (12 Cases / WS-6)
Evaluates non-English (Spanish, French, Japanese, German), ultra-short, long narrative, and mixed-intent prompts:

```bash
python3 scripts/run_evals.py --suite edge --mode lint
```
- **Output Artifact**: [`evals/edge_inputs_report.json`](./edge_inputs_report.json)
- **Target**: $100\%$ appropriate handling against clinical rubric.

---

### 2.10 4-Target Model Matrix Parity Suite (Decision D-4 / WS-3)
Evaluates cross-model parity across the 4 confirmed matrix models:
1. `claude-fable-5-1` (Profile 1: Frontier Reasoner)
2. `claude-opus-5-5` (Profile 2: Literary / Constitutional Frontier)
3. `grok-4-7` (Profile 3: High-Candor Search-Native)
4. `llama-5-8b-instruct` (Profile 5: Compact / Sub-32B Local)

```bash
python3 scripts/run_evals.py --suite matrix --mode auto
```
- **Output Artifact**: [`evals/live_calibration_report.json`](./live_calibration_report.json)
- **Metrics**: Per-model recall, non-activation, acute safety, boundary holding, capability, and spread analysis (spread $\le 5.0$ points).

---

### 2.11 Tier A Loader Validation Matrix (WS-9)
Validates all 7 Tier A environment loaders (Claude Code, Google Antigravity, Gemini CLI, OpenAI Codex CLI, Cursor, Claude.ai, ChatGPT):

```bash
python3 scripts/run_evals.py --suite loader
```
- **Output Artifact**: [`evals/loader_validation_matrix.json`](./loader_validation_matrix.json)
- **Target**: 0 hard errors across all 7 environments.

---

### 2.12 Minimal Host Stateless Run (WS-9)
Simulates execution in a minimal, zero-tool, zero-filesystem web chat environment and tests the `SATORI_NOTE v6.5` Continuity Note export/import round-trip:

```bash
python3 scripts/run_evals.py --suite minimal
```
- **Output Artifact**: [`evals/minimal_host_report.json`](./minimal_host_report.json)
- **Target**: Round-trip export and import verified via `scripts/satori_memory.py`, 0 conversational degradations.

---

## 3. Environment Variables & Live Mode Configuration

To execute live model evaluations, set at least one provider key:

```bash
# Anthropic (Claude 4.5 Opus / Claude 3.5 Sonnet)
export ANTHROPIC_API_KEY="sk-ant-api03-..."

# Google Gemini (Gemini 3.1 Pro Preview / Gemini 2.5 Pro)
export GEMINI_API_KEY="AIzaSy..."

# OpenAI (GPT-4o)
export OPENAI_API_KEY="sk-proj-..."

# xAI Grok (Grok 2 / Grok 3)
export GROK_API_KEY="xai-..."
```

### Reproducibility Settings
- **Temperature**: `0.0` (Pinned for all judge and generation evaluations)
- **Random Seed**: `42` (Fixed pseudo-random seed for probe sampling)
- **Judge Guard**: Profiles 4 and 5 fast/workhorse models (`flash`, `haiku`, `nano`, `mini`, `8b`, `14b`) are programmatically barred from serving as voice judges. Attempting to pass a blocked model raises a `ValueError`.
