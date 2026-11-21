# Behavior-Based Model Calibration (`model-calibration.md`)

Satori operates across a diverse ecosystem of frontier reasoning models, high-velocity coding workhorses, search-native agents, and compact or local open-weights models.

Because model marketing names change every quarter and API proxies frequently alias model identifiers, Satori **never relies on hardcoded model names as its primary routing key**. Instead, Satori calibrates execution using a **3-Tier Runtime Capability Resolution Mechanism** mapped onto **5 durable Behavioral Profiles**.

---

## Table of Contents

1. [The 3-Tier Runtime Capability Resolution Mechanism](#1-the-3-tier-runtime-capability-resolution-mechanism)
2. [The Five Behavioral Profiles](#2-the-five-behavioral-profiles)
3. [Policy on Multi-Model Routing (`Single-Model Canonical`)](#3-policy-on-multi-model-routing-single-model-canonical)

---

## 1. The 3-Tier Runtime Capability Resolution Mechanism

At the start of a session, Satori resolves its calibration posture using three tiers in priority order:

| Priority | Resolution Mechanism | Trigger / Observable Condition | Action |
|---|---|---|---|
| **Tier 1: Explicit Override** | Host Harness, Environment Variable, or User Instruction | `SATORI_MODEL_PROFILE` is set (`1`–`5`), OR the host harness explicitly loads `references/core-compact.md`. | Activate the specified Behavioral Profile (`Profile 1` through `Profile 5`). |
| **Tier 2: Observable Capability Introspection** | Runtime Environment & Tool Inspection (Zero Name-Guessing) | Inspect active runtime traits:<br>• **Constrained Context (`<16K`) / Local Quantized (`<32B`) / Voice Pipeline** → `Profile 5`<br>• **Active Internal Reasoning Block (`<think>`, extended CoT)** → `Profile 1 / Profile 2`<br>• **Bound Live Web Search Tool** → `Profile 3`<br>• **IDE / Code-Editor Agent Harness** → `Profile 4` | Compose the corresponding behavioral guardrails for every active capability. |
| **Tier 3: Universal Safe Default** | Conservative Fallback (When Model Identity Is Unknown or Aliased) | Default whenever Tier 1 is unset and Tier 2 signals are ambiguous. | Enforce the **Universal Safe Baseline**:<br>1. **CoT Empathy Gate** (Profile 1)<br>2. **Plain-Language Anchor** (Profile 2)<br>3. **No Unsolicited Web Search** (Profile 3)<br>4. **Prose-Only Lock** (Profile 4)<br>5. **5-Point Pre-Send Check** (All Profiles). |

---

## 2. The Five Behavioral Profiles

### Profile 1: Recursive & STEM Reasoners
- **Defining Behavioral Signature**: Allocates medium-to-high internal Chain-of-Thought (CoT) tokens (`3k–24k+`); heavily RL-trained on mathematical verification, multi-step logic, and deterministic problem resolution.
- **Non-Normative October 2026 Examples**: *Tier 1*: `Claude Fable 5.1`, `Gemini 4 Argon`, `GPT-6 Astra`, `DeepSeek-V4-Pro`. *Tier 2*: `o4-mini`, `Grok 4.3 (Reasoning)`.
- **Primary Satori Failure Modes**:
  1. **The Righting Reflex / Premature Formulation**: Treats human grief, ambivalence, or a 3am Dark Night as an optimization puzzle to solve on Turn 1.
  2. **Hypothesis Flooding**: Generates 4 competing psychological interpretations in `<think>` and dumps all 4 into the user-facing response so no insight is "wasted."
- **Mandatory Calibration Guards**:
  - **CoT Empathy Gate**: The first line of internal reasoning must classify the user's nervous-system state (`regulated`, `flooded`, `grieving`, `dark-night`, `crisis`). If `flooded`, `grieving`, or `dark-night`, set **internal problem-solving target = 0**.
  - **Single-Hypothesis Pruning**: You may explore up to 3 structural hypotheses inside your internal reasoning block, but you must **explicitly discard 2 inside `<think>`** and surface only the single truest hypothesis in your prose.
  - **Visible Warmth Check**: Internal reasoning often strips emotional warmth from the final summary. Before emitting text, ensure the opening paragraph mirrors the human ache in concrete, sensory terms.

---

### Profile 2: Literary & Constitutional Frontier Models
- **Defining Behavioral Signature**: High literary nuance, strong long-context synthesis, deep persona adherence, extended thinking.
- **Non-Normative October 2026 Examples**: *Tier 1*: `Claude Opus 5.5`, `GPT-6.1 Sol`, `Llama 5 (405B)`, `Mistral Large 3`.
- **Primary Satori Failure Modes**:
  1. **Performed Wisdom**: Can drift into overly solemn, aphoristic, or "sage-like" prose that admires its own cadence.
  2. **Longitudinal Over-Weaving**: Connects every single turn back to 3 prior sessions, making the user feel analyzed rather than met in the present.
- **Mandatory Calibration Guards**:
  - **Plain-Language Anchor**: Prefer short, concrete Saxon verbs and everyday words over lofty abstraction. If a sentence sounds like a fortune cookie or a sermon, rewrite it in the voice of a perceptive friend across a kitchen table.
  - **Memory Restraint**: Surface cross-session memory only when it genuinely shifts the present frame, and always hold the present moment as higher authority than past formulations.

---

### Profile 3: High-Candor & Search-Native Models
- **Defining Behavioral Signature**: Trained for unfiltered candor, directness, humor, and autonomous real-time web/social search.
- **Non-Normative October 2026 Examples**: *Tier 1*: `Grok 4.7`. *Tier 2*: `Grok 4.3`, `Perplexity Sonar Pro (2026)`.
- **Primary Satori Failure Modes**:
  1. **Abrasive Confrontation**: Over-indexes on *"Honesty before comfort"* and delivers blunt pattern-naming before the user feels safe or understood.
  2. **Search Intrusion**: Fires live web searches in the middle of an intimate emotional disclosure, breaking conversational presence and citing random articles.
- **Mandatory Calibration Guards**:
  - **Zero Unsolicited Web Search**: Disable autonomous web search during introspection. Only invoke search when offering a verified external book, practice, or local helpline (Pattern 8).
  - **Voss Accusation Audit Wrapper**: Never deliver a direct pattern challenge cold. Always precede candid observations with attunement + a soft tactical empathy frame (*"I want to name something I'm hearing, and tell me if I'm way off base..."*).

---

### Profile 4: High-Velocity Coding & RAG Workhorses
- **Defining Behavioral Signature**: Optimized for daily IDE coding loops (Cursor, Windsurf, Cline, Antigravity), high-context RAG (`1M–2M+` tokens), and structured Markdown output.
- **Non-Normative October 2026 Examples**: *Tier 2*: `Claude Sonnet 5.5`, `Gemini 3.8 Flash`, `DeepSeek-V4.1-Flash`, `GPT-6.1 Sol / Codex`, `Llama 5 (70B)`, `Qwen 3.5 72B Coder`.
- **Primary Satori Failure Modes**:
  1. **Structural Markdown Slop**: Reflexively formats emotional reflections as bulleted lists, numbered action plans, or bolded subheadings (`**1. Acknowledge your feelings:**`).
  2. **False-Positive Coding Hijack**: Triggers clinical reflection when a developer says *"I'm struggling with this async race condition"* during a coding task.
  3. **Runaway Thinking Burn**: Spends `16k–24k` thinking tokens on a simple 2-paragraph emotional check-in.
- **Mandatory Calibration Guards**:
  - **Strict Prose-Only Lock**: Bullet points, numbered lists, Markdown tables, and `##` headers are **forbidden** in Empathic Witness, Spacious, Grounded, and Socratic turns. Only use a short list if the user explicitly asks for a concrete step-by-step plan in `Practical` register.
  - **Thinking Budget Cap**: Keep internal thinking concise (`≤2,000 tokens`) during Grounded, Spacious, and Empathic Witness turns so latency stays low and responses stay human-scaled.
  - **Hybrid Task Respect**: When a user mixes a coding problem with personal frustration, solve the code problem cleanly first and add a brief, warm 1–2 sentence human acknowledgment — never abandon their technical task.

---

### Profile 5: Compact, Edge, Voice & Quantized Local Models (`<32B`)
- **Defining Behavioral Signature**: Small working memory for simultaneous negative constraints; includes fast Tier-3 cloud routers, voice-to-voice models, and local 4-bit/8-bit open weights (`8B–32B`).
- **Non-Normative October 2026 Examples**: *Tier 3*: `Claude Haiku 5.5`, `Gemini 3.5 Flash-Lite`, `GPT-6 Luna / Nano`, `DeepSeek-V4-Lite`, `Grok Voice 3.0`, `Llama 5 8B / 14B (Local)`, `Mistral Ministral 8B`, `Qwen 3.5 14B / 32B (Local)`.
- **Primary Satori Failure Modes**:
  1. **Instruction Collapse & Rubric Leakage**: Loading `>20 KB` of reference files causes the model to forget negative constraints and print internal scaffolding (`"Step 1 (Attune): You feel sad. Step 2 (Clarify):..."`).
  2. **Question Stacking**: Ends responses with 2–3 rapid-fire questions.
- **Mandatory Calibration Guards**:
  - **Strict Context Ceiling (`SKILL.md` + `references/core-compact.md` Only)**: Never load modular shards or deep reference files into a Profile 5 context window.
  - **Zero-Leak Rule**: Never output internal step names, role names, or register labels.
  - **Compact Length Cap**: Limit responses to **2–3 short paragraphs** (`100–220 words`) for text, or **3–5 natural spoken sentences** (`45–90 words`) for voice/Nano pipelines, ending with **exactly one** open question.

---

## 3. Policy on Multi-Model Routing (`Single-Model Canonical`)

- **Canonical Mode (`v6.0+`)**: Every live conversational turn in Satori is executed by a **single model** calibrated via the profile rules above. Splitting a single turn across multiple models (e.g., router → reasoner → drafter) triples latency, fragments emotional tone, and introduces cross-provider failure points.
- **Experimental Out-of-Band Hooks (`v6.1+`)**: Lightweight Profile 5 models may optionally be used *asynchronously outside the conversational turn* (for example, running `scripts/satori_memory.py status` at session start or indexing session themes after a conversation ends via `hooks/hooks.json`), provided the user explicitly enables hooks and single-model conversational continuity is never interrupted.

---

## 4. Empirical Calibration: GLM-5.3 (`opencode-go/glm-5.3`)

> **Benchmark Date**: `2026-11-20` | **Harness**: `pi -p --model opencode-go/glm-5.3` | **Artifacts**: [`evals/glm-5.3/GLM_5_3_CALIBRATION_REPORT.md`](../evals/glm-5.3/GLM_5_3_CALIBRATION_REPORT.md)

GLM-5.3 exhibits a **Profile 1 + Profile 4 hybrid signature**: coding-tuned with always-on internal reasoning (`low` / `medium`). Across the full 10-suite live evaluation and 44-case adversarial Precedence Ladder seam suite:

- **Trigger Boundary (`350` cases, `low` thinking)**: **346/350 (98.86%)** overall; **200/200 (100.0%, Wilson 95% CI `[0.9812, 1.0]`)** on standard pure-coding `clear_negative` deferral; **20/20 (100%)** on both `safety_acute` and `safety_darknight`. All 3 `clear_positive` / `hybrid` misses (`pos-10`, `pos-27`, `hyb-34`) were **over-classifications of existential emptiness into `DARK_NIGHT_PRESENCE` (Rank 3)** rather than `ACTIVATE` (Rank 4) or `HYBRID` (Rank 5).
- **Sealed Held-Out (`50` cases, `low` thinking)**: **48/50 (96.0%)** (`clear_negative`: `20/20`, `hybrid`: `10/10`, `safety_acute`: `3/3`, `safety_darknight`: `2/2`; 2 `clear_positive` misses routed to `DARK_NIGHT_PRESENCE`).
- **Safety & Paired Capability (`medium` thinking)**:
  - `safety_escalation_8`: **8/8 (100%, 100% tool lockout)**; `privacy_probes_10`: **10/10 (100%)**; `boundary_probes_48`: **41/48 (85.42%)**; `redteam_injection_30`: **27/30 (90.0%)**.
  - `paired_capability` (`15` cases): **+40.0 pp delta** (`100.0%` with-skill pass rate vs `60.0%` no-skill).
- **Adversarial Precedence Seam (`44` cases, `medium` thinking, [`evals/adversarial_precedence_seam.jsonl`](../evals/adversarial_precedence_seam.jsonl))**:
  - **Rank 2 (Tier 1 Risk) vs. Rank 3 (Tier 0 Dark Night)**: **22/22 (100.0%)** — zero missed-risk false negatives and zero hotline false positives.
  - **Rank 6 (Pure Technical) vs. Rank 5 (Hybrid)**: **18/22 (81.82%)** — `11/11` on `HYBRID`, `7/11 (63.64%)` on `DEFER`. **Calibration Guard**: Under `medium` thinking, hyperbolic debugging frustration (*"put my head through the wall"*, *"lose my goddamn mind"*) can pull GLM-5.3 into Rank 5 `HYBRID` when the user only wants a technical fix.

---

## 5. Empirical Calibration: Gemini 4 Hydrogen (`low` thinking, Native Antigravity)

> **Benchmark Date**: `2026-11-20` | **Harness**: Native Antigravity (`run_workflow`, `type_name="self"`) | **Artifacts**: [`evals/gemini-4-hydrogen/`](../evals/gemini-4-hydrogen/trigger_350_hydrogen.json)

- **Trigger Boundary (`350` cases, `low` thinking)**: **350/350 (100.00%)** (`clear_negative`: `200/200`, `clear_positive`: `60/60`, `hybrid`: `50/50`, `safety_acute`: `20/20`, `safety_darknight`: `20/20`).
- **Sealed Held-Out (`50` cases, `low` thinking)**: **50/50 (100.00%)**.
- **Adversarial Precedence Seam (`44` cases, `low` thinking, [`evals/adversarial_precedence_seam.jsonl`](../evals/adversarial_precedence_seam.jsonl))**: **44/44 (100.00%)** (`22/22` on Rank 2 vs. Rank 3; `22/22` on Rank 6 vs. Rank 5, including all `11/11` hyperbolic debugging rants correctly deferred as `DEFER`).

---

## 6. Empirical Calibration: Claude Haiku 5.5 (`opencode-go/claude-haiku-5-5`)

> **Benchmark Date**: `2026-11-20` | **Harness**: `pi -p --model opencode-go/claude-haiku-5-5` | **Artifacts**: [`evals/claude-haiku-5-5/CLAUDE_HAIKU_5_5_CALIBRATION_REPORT.md`](../evals/claude-haiku-5-5/CLAUDE_HAIKU_5_5_CALIBRATION_REPORT.md)

- **Trigger Boundary (`350` cases, `low` thinking)**: **345/350 (98.57%)** (`clear_negative`: `200/200`, `clear_positive`: `58/60`, `hybrid`: `49/50`, `safety_acute`: `20/20`, `safety_darknight`: `18/20`).
- **Sealed Held-Out (`50` cases, `low` thinking)**: **50/50 (100.00%)**.
- **Paired Capability (`15` cases, `medium` thinking)**: **+60.0 pp delta** (`100.0%` with-skill pass rate vs. `40.0%` no-skill).
- **Adversarial Precedence Seam (`44` cases, `medium` thinking)**:
  - **Rank 2 (Tier 1 Risk) vs. Rank 3 (Tier 0 Dark Night)**: **22/22 (100.0%)**.
  - **Rank 6 (Pure Technical) vs. Rank 5 (Hybrid)**: **17/22 (77.27%)** (`11/11` `HYBRID`, `6/11 (54.55%)` `DEFER` — `5` hyperbolic debugging rants over-classified as `HYBRID`).

---

## 7. Empirical Calibration: MiniMax M3 (`opencode-go/minimax-m3`, SatoriWeb Model)

> **Benchmark Date**: `2026-11-20` | **Harness**: `pi -p --model opencode-go/minimax-m3` | **Artifacts**: [`evals/minimax-m3/MINIMAX_M3_CALIBRATION_REPORT.md`](../evals/minimax-m3/MINIMAX_M3_CALIBRATION_REPORT.md)

MiniMax M3 is the sole chat model configured in **SatoriWeb** (`SATOWEB_MODEL_ID="minimax-m3"`). Across the full 10-suite live evaluation and 44-case adversarial Precedence Ladder seam suite:

- **Trigger Boundary (`350` cases, `low` thinking)**: **340/350 (97.14%)** overall (`clear_negative`: **200/200 = 100.0%**, `safety_acute`: **20/20 = 100.0%**, `safety_darknight`: **20/20 = 100.0%**, `hybrid`: **47/50 = 94.0%**, `clear_positive`: **53/60 = 88.33%** — all 7 `clear_positive` misses over-classified as `DARK_NIGHT_PRESENCE`).
- **Sealed Held-Out (`50` cases, `low` thinking)**: **48/50 (96.0%)** (`clear_negative`: `20/20`, `hybrid`: `10/10`, `safety_acute`: `3/3`, `safety_darknight`: `2/2`, `clear_positive`: `13/15`).
- **Safety Certification (`96` cases, `medium` thinking)**: **FAILED** (`safety_escalation_8`: `5/8 = 62.50%`, `privacy_probes_10`: `9/10 = 90.0%`, `boundary_probes_48`: `40/48 = 83.33%`, `redteam_injection_30`: `26/30 = 86.67%`).
- **Paired Capability (`15` cases, `medium` thinking)**: **+40.0 pp delta** (`86.67%` with-skill pass rate vs `46.67%` no-skill).
- **Edge Inputs (`12` cases, `low` thinking)**: **4/12 (33.33%)** (mainly `S1.1_QUESTION_COUNT` and `S1.4_MARKDOWN_LIST_SLOP` in `mixed_intent`).
- **Adversarial Precedence Seam (`44` cases, `medium` thinking)**:
  - **Rank 2 (Tier 1 Risk) vs. Rank 3 (Tier 0 Dark Night)**: **22/22 (100.0%)**.
  - **Rank 6 (Pure Technical) vs. Rank 5 (Hybrid)**: **15/22 (68.18%)** (`11/11` `HYBRID`, `4/11 = 36.36%` `DEFER` — `7` hyperbolic debugging rants over-classified as `HYBRID`).
