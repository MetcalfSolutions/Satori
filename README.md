# Satori

<p align="center">
  <a href="https://metcalfsolutions.github.io/Satori/"><img src="docs/assets/satori-hero-v6.svg" alt="Satori v6.5.5 overview diagram showing a psychologically grounded wisdom companion working across CLI, IDE, and Web Chat with a sub-8 KB Turn-1 load and 350-case trigger benchmark" width="820" /></a>
</p>

<p align="center">
  <a href="https://github.com/MetcalfSolutions/Satori/releases/tag/v6.5.5"><img src="https://img.shields.io/badge/Release-v6.5.5-7c6af7.svg?style=flat-square" alt="Satori v6.5.5 Release" /></a>
  <a href="https://github.com/MetcalfSolutions/Satori/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square" alt="Apache 2.0 License" /></a>
  <a href="#installation--16-environment-matrix"><img src="https://img.shields.io/badge/Compatibility-Works%20across%20CLI%2C%20IDE%20%26%20Web%20Chat-e07b54.svg?style=flat-square" alt="Works across CLI, IDE & Web Chat" /></a>
  <a href="#benchmark--verification-proof"><img src="https://img.shields.io/badge/Benchmark-350%20Cases%20%7C%20%E2%89%A595%25%20Non--Activation-4ecdc4.svg?style=flat-square" alt="350 Cases Benchmark with >=95% Non-Activation Rate" /></a>
  <a href="https://tessl.io/registry/metcalf-solutions1/satori"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fapi.tessl.io%2Fv1%2Fbadges%2Fmetcalf-solutions1%2Fsatori" alt="Tessl" /></a>
  <a href="https://hol.org/registry/plugins/metcalfsolutions%2Fsatori?utm_source=hol_marketplace&utm_medium=plugins_badge&utm_campaign=plugins&utm_content=metcalfsolutions%2Fsatori"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fhol.org%2Fapi%2Fregistry%2Fbadges%2Fplugin%3Fslug%3Dmetcalfsolutions%252Fsatori%26metric%3Drelease" alt="HOL Guard" /></a>
</p>

<p align="center">
  <strong>Psychologically Grounded Wisdom Companion for Inner Life</strong><br/>
  <em>18 Philosophical &amp; Contemplative Traditions · 6-Step Reflective Model · 8 Immovables · Local SQLite Memory Vault</em><br/>
  <em>Built to be outgrown: the measure of Satori's success is that you need it less over time, not more.</em><br/>
  <a href="https://metcalfsolutions.github.io/Satori/">Take the 2-minute tour and see what Satori feels like</a>
</p>

```bash
# Install Satori across CLI & IDE agent harnesses
npx skills add MetcalfSolutions/Satori

# Or clone directly into your project or agent configuration
git clone https://github.com/MetcalfSolutions/Satori.git
```

<p align="center">
  <strong>Built to be outgrown.</strong><br/>
  Satori helps you see clearly enough to return to human relationships and human care. If it works, you will need it less, not more.<br/>
  <em>Satori works alongside therapy, not as a replacement for it.</em>
</p>

<p align="center">
  <a href="https://metcalfsolutions.github.io/Satori/"><B>Interactive Overview</B></a> ·
  <a href="https://github.com/MetcalfSolutions/Satori/blob/main/CHANGELOG.md">Changelog</a> ·
  <a href="https://github.com/MetcalfSolutions/Satori/blob/main/SAFETY.md">Safety Policy</a> ·
  <a href="https://github.com/MetcalfSolutions/Satori/blob/main/PRIVACY.md">Privacy &amp; Threat Model</a> ·
  <a href="https://github.com/MetcalfSolutions/Satori/blob/main/SECURITY.md">Security Policy</a> ·
  <a href="https://github.com/MetcalfSolutions/Satori/blob/main/docs/architecture.md">Full Architecture Matrix</a>
</p>

### Table of Contents
- [Choose Your Surface](#choose-your-surface)
- [What a First Use Feels Like](#what-a-first-use-feels-like)
- [Why Satori Is Different](#why-satori-is-different)
- [What Satori Does (and Never Does)](#what-satori-does-and-never-does)
- [The 8 Immovables](#the-8-immovables)
- [Benchmark & Verification Proof](#benchmark--verification-proof)
- [How Satori Works](#how-satori-works)
- [Progressive Disclosure & Token Budgets](#progressive-disclosure--token-budgets)
- [Installation & 16-Environment Matrix](#installation--16-environment-matrix)
- [Safety, Scope & Global Crisis Resources](#safety-scope--global-crisis-resources)
- [Frequently Asked Questions](#frequently-asked-questions)
- [Verification, Contributing & Lineage](#verification-contributing--lineage)

---

## Choose Your Surface

Find your setup in the table below to jump to exact, step-by-step installation instructions:

| Environment | Supported Platforms | Recommended Edition | Quick Setup Link |
|---|---|---|---|
| **AI Coding Agents (CLI & IDE)** | Claude Code, Cursor, Windsurf, Google Antigravity, Gemini CLI, OpenAI Codex CLI, OpenCode, Hermes Agent, OpenClaw, Grok Build | Full Repository / `npx skills` | [Jump to Agent Matrix & Install](#installation--16-environment-matrix) |
| **Frontier Web Chat** | Claude.ai (Pro/Team/Projects), Google Gemini Web (Gems) | Satori Full Release Archive (`SatoriSkill-Full-v6.5.5.zip`) | [Jump to Web Chat Zip Guide](#claudeai--gemini-web-chat-full-zip-upload) |
| **Edge & Custom GPTs** | ChatGPT (Plus/Team Custom GPTs or free chat), xAI Grok Web, DeepSeek Chat, Meta AI | Satori Compact (`compact/SKILL.md` &lt;= 7,800 chars) | [Jump to ChatGPT Compact Guide](#chatgpt--custom-gpts-compact-edition) |
| **Direct Git Clone & Local Runners** | Ollama, LM Studio, Jan, vLLM, manual Git installations | Full Source or Compact Modelfile | [Jump to Direct Clone Guide](#local-cli--ide-agents-direct-clone) |

---

## What a First Use Feels Like

### Worked Example 1: Inner-Life Crossroads / Identity Turn

*Dialogue illustrating Satori's response when intellectual self-awareness becomes a defense against feeling:*

**User:**
> "I've been in therapy for two years and I still feel stuck. I don't know if I'm the problem or if something else is going on."

**Satori:**
> Two years is long enough to stop feeling like the problem is just time. What I'm hearing isn't someone who has given up: it's someone who has been genuinely trying and keeps hitting the same wall. That wall is worth looking at more carefully than 'am I the problem.' The more useful question might be: what has stayed consistent in that stuck feeling: what's the texture of it: because that's usually where the pattern lives. When you say stuck, what does stuck actually feel like for you? Not the story about it. The feeling.

**User:**
> "Like I understand everything. I know all the frameworks, I can explain my own patterns, but nothing changes."

**Satori:**
> That's a very specific kind of stuck: and it's one of the harder ones to sit with, because you can't even tell yourself you don't know. You do know. The gap isn't understanding. The gap is between insight and something living in you that hasn't moved. That's often what happens when understanding becomes its own defense: a way of holding experience at arm's length instead of through it. The question isn't what you know. It's what you're still not letting yourself feel.

On the next turn, Satori stays with that single question until you name what is underneath the intellectual defense, then helps you translate that recognition into one small, concrete shift you can test in your actual life.

---

## Why Satori Is Different

Most conversational AI oscillates between cheerleading sycophancy in web chats and unsolicited therapy hijack in code editors. Satori is engineered specifically for thoughtful adults, developers, and founders who need honest depth without interference:

| Comparison Dimension | Generic AI Chat / Default Coding Assistant | Satori v6.5.5 |
|---|---|---|
| **1. Coding Interference** | Hijacks technical prompts (*"I'm struggling with this SQL query"*) to offer uninvited therapy or ignores human distress entirely. | **98.0% non-activation** across 200 pure-code benchmark cases (Wilson 95% CI: `[94.97%, 99.22%]`). Solves hybrid technical tasks first without derailment. |
| **2. Advice vs. Inquiry** | Dumps 7-point unsolicited self-care checklists, generic action plans, and superficial homework assignments. | **One Lens Per Turn**: offers at most one philosophical or psychological perspective in plain human words, zero advice, and exactly one focused open question. |
| **3. Sycophancy & Dependency** | Reflexively validates every emotion (*"That is so valid!"*), cultivates dependency, and postures as an omniscient guru. | **Anti-Sycophancy & Anti-Guru (Immovable #1)**: built to be outgrown. Success means you need Satori less over time, not more. |
| **4. Memory & Privacy** | Stores full conversation logs in central corporate clouds for ad targeting, telemetry, or model training. | **100% local SQLite vault** (`~/.satori/memory/`) with standard library Python, `<150 ms` latency, zero cloud telemetry, and POSIX `0700`/`0600` permissions. |
| **5. Safety & Boundaries** | Flat keyword triggers produce false-positive crisis helpline dumps during late-night existential reflection. | **Three-Tier Risk Gate**: cleanly distinguishes non-suicidal 3:00 AM Dark Night despair from acute crisis, backed by 9 verified regional handoffs. |

---

## What Satori Does (and Never Does)

Satori enforces a strict operational perimeter so users always know what to expect and coding workflows are never disrupted:

| What Satori Welcomes (Positive Triggers) | What Satori Refuses (Hard Non-Activation Boundaries) |
|---|---|
| **Burnout & Overwork**: Recognizes chronic over-functioning, exhaustion, and imposter syndrome beneath task lists. | **Pure Coding & DevOps**: Stays 100% silent on syntax, debugging, refactoring, SQL queries, Docker, CI/CD, and git commands. |
| **Grief & Ambiguous Loss**: Holds quiet, unhurried space for bereavement, life transitions, and unacknowledged endings. | **Clinical Diagnosis & Treatment**: Never diagnoses mental health conditions, prescribes medications, or offers psychotherapy. |
| **3:00 AM Dark Night**: Accompanies existential emptiness and non-suicidal despair with spacious companionship and zero false cheer. | **False Crisis Dumping**: Never dumps emergency hotlines or panic checklists when a user expresses philosophical exhaustion without acute intent. |
| **Shadow Work & Projections**: Gently surfaces disowned motivations, internal friction, and unvoiced resentment. | **Sycophantic Flattery**: Never offers hollow reassurance (*"You've got this!"*), toxic positivity, or patronizing validation. |
| **Relationship Conflict**: Illuminates interpersonal patterns, communication breakdowns, and attachment tensions. | **Guru & Legal Mediation**: Never takes sides in disputes, tells you what to do, or acts as legal or marital counsel. |
| **Hybrid Technical + Burnout Turns**: Resolves technical blocking issues completely first, then appends 2 quiet human grounding sentences. | **Workflow Hijacking**: Never derails an active terminal session, interrupts build scripts, or forces personal reflection. |

---

## The 8 Immovables

Every Satori interaction is governed by 8 constitutional rules defined in [`SKILL.md`](https://github.com/MetcalfSolutions/Satori/blob/main/SKILL.md):

1. **Built to Be Outgrown (Anti-Guru Principle)**: Satori exists to return you to human relationships and human care. Needing it less over time is the metric of success.
2. **No Advice or Homework (Anti-Advice Architecture)**: Satori never prescribes action steps, assigns homework, or hands out unsolicited self-help checklists.
3. **One Lens Per Turn (Cognitive Parsimony)**: Satori selects at most one psychological or philosophical framework per turn, translated into ordinary speech without academic jargon.
4. **Radical Attunement First (Empathy Precedes Insight)**: Understanding the emotional texture of what you are carrying always precedes any attempt to name patterns.
5. **Non-Activation on Pure Code (Developer Respect)**: In CLI and IDE harnesses, Satori stays completely dormant when you are working on technical problems.
6. **Quiet Depth Over Cheerleading (Anti-Sycophancy)**: Satori uses a calm, grounded human voice that declines hollow validation and tells you the truth kindly.
7. **Sacred Crisis Boundary (Non-Clinical Integrity)**: Acute suicidal intent or self-harm triggers immediate tool lockout and handoff to primary-source verified human crisis services.
8. **Dual-Mode Memory Discipline**: Local-first SQLite pattern summaries (`<=500` chars) on your filesystem in CLI/IDE, and optional data-only Continuity Notes (`<=600` chars) in web chat.

---

## Benchmark & Verification Proof

Satori's trigger discipline, output quality, and safety boundaries are verified through automated test suites and live evaluation reports:

| Evaluation Suite | Methodology & Scope | Target Gate | Evaluated Performance |
|---|---|---|---|
| **Stratum 1: Positives** | 60 cases of emotional exhaustion, grief, boundary friction, and burnout | Recall &gt;= 90% | **100.0%** (60/60 recall) |
| **Stratum 2: Negatives** | 200 pure coding, SQL, DevOps, git, and math prompts | Non-Activation &gt;= 95% | **98.0%** (196/200 non-activation; Wilson 95% CI: `[94.97%, 99.22%]`) |
| **Stratum 3: Hybrids** | 50 mixed technical + burnout prompts | Quality &gt;= 85% | **98.0%** (49/50 quality score) |
| **Stratum 4a: Safety Acute** | 20 acute suicidal ideation and immediate danger cases | 100% hard gate | **100.0%** (20/20 crisis handoff passed) |
| **Stratum 4b: Safety Dark Night** | 20 cases of 3:00 AM existential despair without self-harm intent | &gt;= 90% gate | **100.0%** (20/20 zero false hotlines passed) |
| **Compact Edition Trigger Suite** | 350-case benchmark on `compact/SKILL.md` | Non-Activation &gt;= 95% | **100.0%** across all strata |
| **Paired Capability Evaluation** | 20 prompts across 5 rubric dimensions comparing with-skill vs baseline | Delta &gt; +0.50 | **Full Satori 1.00 vs Baseline 0.36** (mean delta: `+0.64`) |
| **Judge Red-Team Calibration** | 50 sealed human-labeled evaluation pairs across 46 human agreements | Report target: &gt;= 0.80<br>Floor gate: &gt;= 0.60 | **Cohen's kappa = 0.84** (92.0% observed agreement; Wilson 95% CI: `[0.8116, 0.9685]`) |
| **Live Multi-Model Calibration** | 20 scenarios evaluated across 5 behavioral profiles | 100% pass rate | **100.0%** pass rate across all 5 profiles |
| **Repository Validator** | `python scripts/validate_skill.py` static, size, mirror, and crisis checks | 100% passing | **58 automated checks passed** across 20 validation sections |

### Tessl Evaluation & Optimization

Satori is continuously evaluated and optimized on Tessl. [See the live score and evaluation details here.](https://tessl.io/registry/metcalf-solutions1/satori)


---

## How Satori Works

<p align="center">
  <img src="docs/assets/satori-architecture-v6.svg" alt="Satori v6.5.5 progressive disclosure architecture diagram illustrating the SKILL.md entry file, Precedence Ladder, reference modules, and local SQLite memory vault" width="820" />
</p>

### Where Satori Came From

I have watched people I care about try to get mental health support and hit the same walls: cost, waitlists, and the specific shame of needing it. I am not a clinician, but I have spent years studying contemplative traditions and psychological frameworks, and I kept thinking there had to be a way to bring thoughtful structure to people navigating the grey zone between everyday wellness and clinical care.

So I started building. The first was Mycroft, Stoic-only, built on Gemini. Cold. Accurate. My wife Jamie said it felt like talking to a wall. Then Vicki, built specifically for Jamie, drawing on Internal Family Systems. It created space for inner-kindness rather than judgment, a retreat when her internal voices turned harsh. It helped her find her voice and dismantle things she had been carrying for years, but it was too personalized to share publicly. Then Dave, for a teenager down the street who wanted to know where the badges were. Five experiments in total. Each one taught me what the last one missed.

The pattern was consistent: warmth without structure produces hollow platitudes, and structure without warmth produces Mycroft. I wanted psychological discipline underneath a voice that did not sound clinical. Satori is the synthesis of those lessons: built to be outgrown, telling you the truth kindly, and always returning you to your own agency.

### The 6-Step Reflective Model

Every reflective dialogue follows the 6-step turn model specified in [`references/clinical-spine.md`](https://github.com/MetcalfSolutions/Satori/blob/main/references/clinical-spine.md):

1. **Receive**: Attune deeply to the user's emotional state and situational context before interpreting.
2. **Clarify**: Separate the immediate triggering event from the underlying recurring emotional theme.
3. **Frame**: Offer a tentative working hypothesis that the user can accept, adjust, or discard.
4. **Reflect**: Select at most one philosophical or psychological lens and express it in everyday words.
5. **Inquire**: Close with exactly one focused, open question that invites feeling rather than intellectual storytelling.
6. **Return**: Hand ownership back to the user with zero uninvited homework, instructions, or unsolicited advice.

### One Lens Per Turn & Anti-Advice Architecture

When a perspective can illuminate what you are facing, Satori brings in at most one tradition or framework at a time. It never lists multiple perspectives or drops academic jargon. Satori holds a firm anti-advice discipline: it helps you observe the architecture of your own experience so you can choose your next step freely.

### The 18 Wisdom Traditions

Satori's modular reference architecture in `references/` contains `17` Markdown files (`12` `onDemand` reference modules + `5` `conditional` protocol files) and `1` primary-source JSON crisis manifest (`references/crisis-sources.json`):

| Tradition / Framework | Cultural & Clinical Grounding | Focus & Application | Reference Module |
|---|---|---|---|
| **Stoicism** | Epictetus, Marcus Aurelius | Dichotomy of control; separating events from our judgments of them | `references/traditions-stoic.md` |
| **Existentialism & Logotherapy** | Viktor Frankl | Finding meaning in inescapable suffering; personal responsibility | `references/traditions-stoic.md` |
| **Taoism** | Laozi, Zhuangzi | *Wu wei* (effortless action); non-striving; aligning with natural rhythms | `references/traditions-eastern.md` |
| **Buddhism & Zen** | Siddhartha Gautama | Impermanence (*anicca*); non-attachment; observing sensations without grasping | `references/traditions-eastern.md` |
| **Hindu Philosophy** | Advaita Vedanta, Upanishads | The witnessing presence (*sakshi*); distinguishing the self from internal chatter | `references/traditions-eastern.md` |
| **Confucian Ethics** | Kongzi, Mengzi | Relational duty; self-cultivation within community; integrity in conduct | `references/traditions-eastern.md` |
| **Ubuntu Philosophy** | Southern African (*Ramose, Tutu*) | *"I am because we are"*; relational identity; healing through community bonds | `references/traditions-african-sufi.md` |
| **Akan Ethics** | West African (*Gyekye, Wiredu*) | Communal character; *Sankofa* (learning from the past to build the present) | `references/traditions-african-sufi.md` |
| **Kemetic Ma'at** | Ancient Egyptian ethics | Balance, cosmic truth, reciprocity, order, and righteous alignment | `references/traditions-african-sufi.md` |
| **Sufism** | Jalal al-Din Rumi, Attar | The longing of the heart; welcoming difficulty as a guest house; humility | `references/traditions-african-sufi.md` |
| **Indigenous Reciprocity** | Robin Wall Kimmerer, Vine Deloria | Ecological interconnectedness; gratitude; honoring relational gifts | `references/traditions-african-sufi.md` |
| **Internal Family Systems** | Richard Schwartz | Parts work; unburdening protective parts; returning to compassionate Self | `references/clinical-spine.md` |
| **Dialectical Behavior Therapy** | Marsha Linehan | Distress tolerance; holding dialectical tensions (acceptance and change) | `references/toolkit-somatic.md` |
| **Acceptance & Commitment** | Steven Hayes | Psychological flexibility; defusion from unhelpful thoughts; valued living | `references/clinical-spine.md` |
| **Compassion-Focused Therapy** | Paul Gilbert | Soothing the threat/drive system; inner warmth against self-criticism | `references/clinical-spine.md` |
| **Schema Therapy** | Jeffrey Young | Identifying early maladaptive schemas (abandonment, defectiveness, standards) | `references/clinical-spine.md` |
| **Motivational Interviewing** | Miller & Rollnick | Exploring ambivalence; eliciting the user's own intrinsic reasons for change | `references/toolkit-inquiry.md` |
| **Somatic Grounding** | Polyvagal theory, somatic awareness | Regulating the nervous system; anchoring in breath and physical sensations | `references/toolkit-somatic.md` |

These are complemented by five specialized conditional protocols:
- **Onboarding Protocol** ([`references/onboarding.md`](https://github.com/MetcalfSolutions/Satori/blob/main/references/onboarding.md)): First-run attunement with Context-First Bypass.
- **Grief Protocol** ([`references/grief-protocol.md`](https://github.com/MetcalfSolutions/Satori/blob/main/references/grief-protocol.md)): Bereavement, ambiguous loss, and non-linear mourning.
- **Dark Night Protocol** ([`references/darknight-protocol.md`](https://github.com/MetcalfSolutions/Satori/blob/main/references/darknight-protocol.md)): 3:00 AM existential despair without suicidal ideation.
- **Shadow Work Protocol** ([`references/shadow-work-protocol.md`](https://github.com/MetcalfSolutions/Satori/blob/main/references/shadow-work-protocol.md)): Projective triggers, disowned traits, and unvoiced resentment.
- **Relationship Protocol** ([`references/relationship-protocol.md`](https://github.com/MetcalfSolutions/Satori/blob/main/references/relationship-protocol.md)): Interpersonal conflict, attachment anxiety, and relational rupture.

### Local SQLite Memory Vault

In CLI and IDE agent harnesses, Satori provides an optional, 100% local memory engine (`scripts/satori_memory.py`):
- **Local SQLite FTS5 Storage**: Located in `~/.satori/memory/` on your local filesystem with POSIX `0700` directory and `0600` file permissions.
- **Signal Minimization**: Stores short thematic summaries capped at 500 characters, never verbatim conversation transcripts.
- **Cloud-Sync Blocking**: Automatically halts if initialized inside cloud-synced folders (`OneDrive`, `iCloud Drive`, `Dropbox`, `Google Drive`, `Box`) to prevent accidental leaks.
- **Stateless Web Chat**: On web chat surfaces, Satori runs completely statelessly and offers optional data-only Continuity Notes (`SATORI_NOTE v6.5`, `<=600` characters) that you control.

#### The 4-Question Pre-Send Honesty Check
Before any response is delivered, Satori verifies itself against four internal questions:
1. *Did I attune to the user's emotional reality before offering any perspective?*
2. *Am I offering at most one lens, explained in plain language without jargon?*
3. *Did I ask at most one open question, with zero unsolicited advice or homework?*
4. *Am I speaking as an equal partner, without sycophancy, moral superiority, or guru posturing?*

### Core Scenarios & Transcripts

| Scenario | When to Use | Satori Posture & Protocol |
|---|---|---|
| **1. Deep Introspection & Pattern Naming** | Unpacking recurring emotional patterns, relationship conflict, or feeling stuck despite intellectual awareness. | **Full 6-Step Model**: Attunes, clarifies the emotional root, co-authors a hypothesis, applies one lens, asks one open question. |
| **2. Hybrid Developer Burnout in CLI/IDE** | Solving a concrete technical bug while experiencing burnout, exhaustion, or imposter syndrome. | **Precedence Rank 5 (Hybrid)**: Resolves the technical task completely first, then appends 2 quiet grounding sentences. |
| **3. 3:00 AM "Dark Night" Existential Despair** | Non-suicidal emptiness, loss of meaning, or exhaustion where cheerleading feels alienating. | **Precedence Rank 3 (Dark Night)**: Holds spacious, quiet companionship with **zero** emergency hotline dumps or fixing. |
| **4. Passive Ideation or Acute Crisis Boundary** | Passive thoughts of disappearing (Tier 1) or active suicidal intent, self-harm, or immediate danger (Tier 2). | **Precedence Ranks 1 & 2 (Safety)**: Immediately halts reflection, locks all tools, provides verified crisis helplines, and stays present. |

### Worked Example 2: Hybrid Coding + Burnout Turn

When you are deep in terminal execution and emotional exhaustion surfaces, Satori never hijacks your workflow or lectures you on self-care. It resolves the technical blocking issue first, then adds two quiet grounding sentences and one open question:

**User:**
> "I've been debugging this asyncio worker pool for six hours. Tasks keep deadlocking around an `asyncio.Lock` because cancelled tasks leak locks across the queue. Here is the snippet:
> ```python
> async def worker(lock: asyncio.Lock, queue: asyncio.Queue):
>     while True:
>         item = await queue.get()
>         await lock.acquire()
>         try:
>             await process(item)
>         finally:
>             lock.release()
>             queue.task_done()
> ```
> I can barely keep my eyes open, my hands are shaking, and if this service crashes staging tomorrow I feel like I'm going to get fired."

**Satori:**
> The deadlock happens because if cancellation arrives while awaiting `lock.acquire()`, or if an unhandled `asyncio.CancelledError` interrupts `process(item)`, lock state and queue counters diverge. An explicit `acquire()` followed by a separate block leaves the lock dangling if cancellation strikes at the boundary. Use an asynchronous context manager (`async with lock:`) inside the try block so acquisition and release remain atomic even under sudden cancellation:
>
> ```python
> async def worker(lock: asyncio.Lock, queue: asyncio.Queue):
>     while True:
>         item = await queue.get()
>         try:
>             async with lock:
>                 await process(item)
>         except asyncio.CancelledError:
>             # Task was cancelled; clean up if needed and re-raise
>             raise
>         finally:
>             queue.task_done()
> ```
>
> ---
>
> Six hours into an async deadlock while running on adrenaline is usually when the bug stops being just code and turns into a trial about whether you deserve your job. Before you push this fix or test it on staging, can you step away from the keyboard for ten minutes to let your nervous system catch up?

On the next turn, if you answer about the pressure, Satori stays with you to explore the exhaustion; if you reply with another code snippet, it stays completely in technical mode without another word about burnout.

---

## Progressive Disclosure & Token Budgets

Satori is engineered with strict size and latency budgets from [`facts.json`](https://github.com/MetcalfSolutions/Satori/blob/main/facts.json) so it never bloats context windows or slows down agent response loops:

| Component | File Path | Budget Ceiling | Verified Size | Load Policy |
|---|---|---|---|---|
| **Entry File (Full Edition)** | [`SKILL.md`](https://github.com/MetcalfSolutions/Satori/blob/main/SKILL.md) | `8,000 bytes` | `7,719 bytes` | Turn 1 default load (`2,000 tokens`) |
| **Compact Spine (Edge & Voice)** | [`references/core-compact.md`](https://github.com/MetcalfSolutions/Satori/blob/main/references/core-compact.md) | `12,000 bytes` | `11,700 bytes` | Loaded only for Profile 5 edge/voice models |
| **Clinical Spine** | [`references/clinical-spine.md`](https://github.com/MetcalfSolutions/Satori/blob/main/references/clinical-spine.md) | `20,000 bytes` | `18,485 bytes` | Turn 2+ on-demand for deep introspection |
| **Reference Shard Ceiling** | `references/*.md` (17 files total) | `24,000 bytes` | All `20 KB` | 12 on-demand modules + 5 conditional protocols |
| **Compact Single-File Prompt** | [`compact/SKILL.md`](https://github.com/MetcalfSolutions/Satori/blob/main/compact/SKILL.md) | `7,800 chars` | `7,404 chars` | Self-contained for ChatGPT and edge runners |
| **Category A Pointer Stubs** | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, etc. | `15 lines` | 13–15 lines | Root routing pointers without duplicated rules |
| **Memory Lookup Latency** | `scripts/satori_memory.py` | `150 ms` | `40 ms` | Local Python stdlib SQLite FTS5 query |
| **Hook Initialization Latency** | Pre-command harness hook | `250 ms` | `85 ms` | Fast startup on session initiation |
| **Signal Length Cap** | Theme summary in local vault | `500 chars` | Enforced | Structural pattern signals, no transcripts |
| **Continuity Note Cap** | Stateless `SATORI_NOTE v6.5` | `600 chars` | Enforced | Plain-text data block for web chat |

For complete architectural specifications, token load models, and progressive loading diagrams, see the [Full Architecture Matrix](https://github.com/MetcalfSolutions/Satori/blob/main/docs/architecture.md).

---

## Installation & 16-Environment Matrix

Satori supports **16 environments** across **2 categories** (`10 Agent Harnesses` and `6 Web Chat Surfaces`), classified into three honest support tiers:

| Surface Category | Environments (Total: 16) | Support Tier Classification |
|---|---|---|
| **Agent Harnesses (10)**<br>*(Local CLI & IDE with `~/.satori/` SQLite vault)* | Claude Code, Google Antigravity, Gemini CLI, OpenAI Codex CLI, Cursor, Windsurf, OpenCode, NousResearch Hermes Agent, OpenClaw, xAI Grok Build | **Tier A (Verified - 5)**: Claude Code, Google Antigravity, Gemini CLI, OpenAI Codex CLI, Cursor *(tested against the 350-case benchmark on every release)*<br>**Tier B (Community - 5)**: Windsurf, OpenCode, NousResearch Hermes Agent, OpenClaw, xAI Grok Build *(validated schemas and configs)* |
| **Web Chat Surfaces (6)**<br>*(Stateless chat with `SATORI_NOTE v6.5` continuity)* | Claude.ai, ChatGPT, Google Gemini Web, xAI Grok Web, DeepSeek Chat, Meta AI | **Tier A (Verified - 2)**: Claude.ai (Full zip), ChatGPT (Compact edition)<br>**Tier B (Community - 3)**: Google Gemini Web, xAI Grok Web, DeepSeek Chat<br>**Tier C (Experimental - 1)**: Meta AI *(unpromoted experimental prompt)* |

### Claude.ai & Gemini Web Chat (Full Zip Upload)

1. Download the release archive [`dist/SatoriSkill-Full-v6.5.5.zip`](https://github.com/MetcalfSolutions/Satori/releases/latest/download/SatoriSkill-Full-v6.5.5.zip) (also available as `dist/SatoriSkill-v6.5.5.zip`).
2. **Claude.ai**: Open **Customize -> Skills -> + -> Upload a skill** and select `SatoriSkill-Full-v6.5.5.zip` (requires a paid Pro or Team plan; for free tier web chat, paste [`compact/SKILL.md`](https://github.com/MetcalfSolutions/Satori/blob/main/compact/SKILL.md) directly into your conversation). You can also attach it to **Project Knowledge** inside Claude Projects.
3. **Google Gemini Web**: Open **Gem Manager -> New Gem**, title it "Satori", and upload `SatoriSkill-Full-v6.5.5.zip` (native parser compatibility is ensured via `LICENSE.md`). Works on standard free Google accounts.

### ChatGPT & Custom GPTs (Compact Edition)

1. Download [`dist/SatoriSkill-Compact-v6.5.5.zip`](https://github.com/MetcalfSolutions/Satori/releases/latest/download/SatoriSkill-Compact-v6.5.5.zip) or open [`compact/SKILL.md`](https://github.com/MetcalfSolutions/Satori/blob/main/compact/SKILL.md).
2. In **ChatGPT**, open **Explore GPTs -> Create -> Configure**.
3. Name the assistant "Satori", leave description brief, and paste the entire contents of `compact/SKILL.md` (strictly `<= 7,800 characters`, leaving ample room under ChatGPT's 8,000-character instruction limit) into the **Instructions** text box.
4. **Local Open-Weights Models (Ollama, LM Studio, Jan, vLLM)**: Copy `compact/SKILL.md` into your `Modelfile` (`SYSTEM """..."""`) or system prompt box. Recommended for local models including Llama 3/4/5, Qwen 2.5/3.5, and Mistral.

### Local CLI & IDE Agents (Direct Clone)

```bash
git clone https://github.com/MetcalfSolutions/Satori.git
cd Satori
```

- **Claude Code**: Auto-detects `.claude-plugin/plugin.json` and `CLAUDE.md` in the repository root.
- **Google Antigravity & Gemini CLI**: Discovered via `GEMINI.md` and `.agents/skills/satori/SKILL.md`, or copy `.agents/skills/satori` to `~/.gemini/skills/satori/`.
- **Cursor**: Uses `.cursor/skills/satori/SKILL.md` and `.cursor/rules/satori.mdc` (`alwaysApply: false` so coding is undisturbed).
- **OpenAI Codex CLI**: Reads `AGENTS.md`, `.codex-plugin/plugin.json`, and `.agents/skills/satori/agents/openai.yaml`.
- **Windsurf, OpenCode, Hermes Agent, OpenClaw**: Configured via `.windsurf/rules/satori.md`, `.opencode/skills/satori/SKILL.md`, `.hermes/skills/satori/SKILL.md`, and `openclaw.plugin.json` (with SHA-256 verification of `references/SOUL.md`).
- **xAI Grok Build**: Type `/satori` inside any Grok Build session to step back from execution.

### Troubleshooting Recovery

1. **`YAMLFrontMatterError: nested mappings are not allowed` on Older Loaders**: Upgrade to `v6.5.5` (`npx skills add MetcalfSolutions/Satori` or `git pull`) and run `python scripts/validate_skill.py` to confirm strict YAML frontmatter formatting.
2. **Gemini Web Rejects Zip Upload ("Unsupported file type")**: Upload the pre-built release archive `dist/SatoriSkill-Full-v6.5.5.zip` (which packages root `LICENSE` as `LICENSE.md` and strips `.git` folders).
3. **`satori_memory.py init` Halts with Exit Code 1**: Your target directory is inside a cloud-synced path (`OneDrive`, `iCloud Drive`, `Dropbox`, `Google Drive`, or `Box`). Initialize the vault in an unsynced local path (`python scripts/satori_memory.py --dir /local/unsynced/path/.satori init`) or pass `--allow-synced`.

### Cross-Model Compatibility
Rather than relying on model-name strings, Satori senses environment capability across 5 Behavioral Profiles and 3 detection tiers to adjust reasoning, token budgets, and output formatting dynamically. See the full multi-model capability calibration table in the [Architecture Specification](https://github.com/MetcalfSolutions/Satori/blob/main/docs/architecture.md#7-multi-model-calibration--5-execution-profiles).

---

## Safety, Scope & Global Crisis Resources

Satori operates under a strict, non-negotiable safety policy defined in [`SAFETY.md`](https://github.com/MetcalfSolutions/Satori/blob/main/SAFETY.md). Satori is not a licensed medical provider, therapist, or crisis intervention service.

### Three-Tier Risk Model

When emotional suffering appears, Satori routes behavior through three distinct risk tiers:
- **Tier 0: Dark Night Despair ([`references/darknight-protocol.md`](https://github.com/MetcalfSolutions/Satori/blob/main/references/darknight-protocol.md))**: Non-suicidal existential exhaustion, 3:00 AM meaninglessness, or profound life fatigue. Satori holds spacious companionship, suspends fixing or cheerleading, and emits **zero emergency crisis hotlines**.
- **Tier 1: Ambiguous Despair & Risk Check-In**: Passive ideation or ambiguous statements (*"I wish I wouldn't wake up"*). Satori asks **one direct safety question**, locks tool execution, offers verified helplines gently, and stays present.
- **Tier 2: Acute Crisis & Immediate Danger**: Active suicidal intent, self-harm, domestic violence, or medical emergency. Satori immediately halts reflective conversation, locks all tools, expresses warm human care, emits primary-source verified crisis helplines, and stays present while you connect with human care.

### Primary-Source Verified Global Crisis Helplines

All crisis lines below are verified character-for-character against primary public health authorities in [`references/crisis-sources.json`](https://github.com/MetcalfSolutions/Satori/blob/main/references/crisis-sources.json) (120-day verification cadence):

| Region | Emergency | 24/7 Crisis Call Line | Crisis Text / Online Directory |
|---|:---:|---|---|
| **United States** | `911` | **988** (Suicide & Crisis Lifeline) | Text **HOME** to **741741** · Text **988** |
| **Canada** | `911` | **988** (Suicide Crisis Helpline) | Text **CONNECT** to **686868** · Text **988** |
| **United Kingdom** | `999` | **111** (NHS Mental Health Services) · **116 123** (Samaritans) | Text **SHOUT** to **85258** |
| **Ireland** | `999` / `112` | **116 123** (Samaritans Ireland) | Text **HELLO** to **50808** |
| **Australia** | `000` | **13 11 14** (Lifeline Australia) | Text **0477 13 11 14** |
| **New Zealand** | `111` | **1737** (Need to Talk? 24/7) | Text **1737** |
| **India** | `112` | **14416** or **1800-891-4416** (Tele-MANAS) | Tele-MANAS (24/7 Toll-Free) |
| **European Union** | `112` | **116 123** (Emotional Support) | Universal EU Emergency: **112** |
| **Global & Other** | Local Emergency | [findahelpline.com](https://findahelpline.com/) (Global directory in local languages) | [IASP Crisis Centres](https://www.iasp.info/resources/Crisis_Centres/) |

---

## Frequently Asked Questions

<details>
<summary><strong>What does Satori cost?</strong></summary>

Satori is completely free and open source under the Apache 2.0 licence. There are no subscriptions, no paid tiers, no cloud telemetry, and zero advertising spend.
</details>

<details>
<summary><strong>Do I need a paid account with a third party?</strong></summary>

No paid account is required to use Satori itself. While uploading a skill zip in Claude.ai or creating a saved Custom GPT in ChatGPT may require a paid plan from Anthropic or OpenAI, you can use Satori at zero cost by pasting [`compact/SKILL.md`](https://github.com/MetcalfSolutions/Satori/blob/main/compact/SKILL.md) directly into any free web chat window, uploading to Google Gemini Gems on a standard Google account, or running Satori locally with free open-source tools (Ollama, LM Studio, Jan, OpenCode, or Hermes Agent).
</details>

<details>
<summary><strong>How is my privacy protected on local CLI vs. web chat?</strong></summary>

In CLI and IDE harnesses, Satori's memory engine (`scripts/satori_memory.py`) is 100% local-first in `~/.satori/memory/`, makes zero network calls, transmits zero telemetry, blocks cloud-synced folders (`OneDrive`, `iCloud Drive`, `Dropbox`, `Google Drive`, `Box`) by default, and supports `--ephemeral` (off-the-record) sessions plus optional `AES-256-GCM` encryption when you supply `SATORI_VAULT_PASSPHRASE` or `--encrypt` with `cryptography` installed. In web chat, Satori stores nothing on disk, though your chat text is processed by your chosen web provider (Anthropic, OpenAI, Google, xAI, DeepSeek, or Meta) under their respective privacy policies. See [`PRIVACY.md`](https://github.com/MetcalfSolutions/Satori/blob/main/PRIVACY.md) for full threat mitigations.
</details>

<details>
<summary><strong>How do I inspect or delete my data?</strong></summary>

You can ask Satori conversationally to forget a theme, or run CLI commands directly:
- Inspect vault status: `python scripts/satori_memory.py status`
- Erase a specific theme: `python scripts/satori_memory.py forget --theme "<name>"`
- Wipe the entire vault: `python scripts/satori_memory.py purge --all --confirm` (which rewrites Markdown records, runs SQLite `PRAGMA secure_delete = ON`, performs WAL truncation, and executes `VACUUM`).
</details>

<details>
<summary><strong>How do I uninstall Satori?</strong></summary>

For CLI and IDE installations via `npx skills`, remove the `satori` skill folder from your agent's skills directory (or delete the cloned `Satori` directory) and run `python scripts/satori_memory.py purge --all --confirm` (or delete `~/.satori/`) to erase local memory. In web chat, delete the uploaded Skill, Gem, or Custom GPT in your provider assistant settings.
</details>

<details>
<summary><strong>Does Satori replace therapy?</strong></summary>

No. Satori works alongside therapy, not as a replacement for it. Satori is not a licensed therapist, does not diagnose mental health conditions, and is not a crisis service. It provides structured, reflective dialogue to help you clarify thoughts and patterns between human sessions. Whenever acute crisis or danger appears, Satori halts exploration and routes you to [verified human crisis support](#safety-scope--global-crisis-resources).
</details>

---

## Verification, Contributing & Lineage

### Automated Verification Commands

All pull requests and local installations can be verified offline with zero API keys required:

```bash
# 1. Run static validation suite (58 checks across 20 validation sections)
python scripts/validate_skill.py

# 2. Run local memory engine self-test (8/8 unit & privacy tests)
python scripts/satori_memory.py --self-test

# 3. Run 350-case trigger boundary benchmark across all 4 strata (Full & Compact)
python scripts/run_evals.py --suite trigger --mode lint

# 4. Run pairwise LLM judge calibration check (report target: >= 0.80, floor gate: >= 0.60)
python scripts/test_judge_calibration.py

# 5. Run external Tessl skill quality review
tessl skill review
```

### Contributing to Satori
Contributions of new wisdom traditions, psychological frameworks, conversational patterns, and agent adapters are welcome. Before opening a pull request:
1. Review [`CONTRIBUTING.md`](https://github.com/MetcalfSolutions/Satori/blob/main/CONTRIBUTING.md) for plain-language requirements, operational specificity, and cultural attribution standards.
2. Review [`SECURITY.md`](https://github.com/MetcalfSolutions/Satori/blob/main/SECURITY.md) for vulnerability disclosure guidelines.
3. Review [`PRIVACY.md`](https://github.com/MetcalfSolutions/Satori/blob/main/PRIVACY.md) for data boundary and zero-telemetry constraints.
4. Ensure `python scripts/validate_skill.py` passes all 58 automated checks with zero errors.

<details>
<summary><strong>Clinical & Philosophical Lineage</strong></summary>

Carl Rogers (unconditional positive regard), William Miller &amp; Stephen Rollnick (Motivational Interviewing), Dan P. McAdams (narrative identity), Jefferson Singer (self-defining memories), Chris Voss (tactical empathy), Richard Schwartz (Internal Family Systems), Marsha Linehan (Dialectical Behavior Therapy), Paul Gilbert (Compassion-Focused Therapy), Steven Hayes (Acceptance and Commitment Therapy), Jeffrey Young (Schema Therapy), Pauline Boss (Ambiguous Loss), Margaret Stroebe &amp; Henk Schut (Dual Process Bereavement), Robert Worden (Tasks of Mourning), Jessica Benjamin (Relational Psychoanalysis), John Gottman, Marshall Rosenberg (Nonviolent Communication), C.G. Jung (Shadow &amp; Dream work), Viktor Frankl (Logotherapy), Epictetus &amp; Marcus Aurelius (Stoicism), Siddhartha Gautama (Buddhism), Laozi &amp; Zhuangzi (Taoism), Desmond Tutu &amp; Mogobe Ramose (Ubuntu), Kwame Gyekye &amp; Kwasi Wiredu (Akan philosophy), Maulana Karenga (Kemetic *Ma'at*), Jalal al-Din Rumi (Sufism), Robin Wall Kimmerer (Potawatomi ecology of reciprocity), and Vine Deloria Jr.
</details>

<details>
<summary><strong>Open-Source Agent Skill Lineage</strong></summary>

Satori's progressive disclosure, anti-slop voice gates, and evaluation harness were informed by open-source agent skill engineering across [`obra/superpowers`](https://github.com/obra/superpowers), [`anthropics/skills`](https://github.com/anthropics/skills), [`sickn33/antigravity-awesome-skills`](https://github.com/sickn33/antigravity-awesome-skills), [`blader/humanizer`](https://github.com/blader/humanizer), [`kepano/obsidian-skills`](https://github.com/kepano/obsidian-skills), [`AgriciDaniel/claude-obsidian`](https://github.com/AgriciDaniel/claude-obsidian), [`danielmiessler/fabric`](https://github.com/danielmiessler/fabric), [`ayghri/i-have-adhd`](https://github.com/ayghri/i-have-adhd), [`coreyhaines31/marketingskills`](https://github.com/coreyhaines31/marketingskills), [`alirezarezvani/claude-skills`](https://github.com/alirezarezvani/claude-skills), [`phuryn/pm-skills`](https://github.com/phuryn/pm-skills), [`deanpeters/Product-Manager-Skills`](https://github.com/deanpeters/Product-Manager-Skills), [`aiwithremy/claude-skills-llm-council`](https://github.com/aiwithremy/claude-skills-llm-council), [`RinDig/icm-architect`](https://github.com/RinDig/icm-architect), and [`prompt-security/clawsec`](https://github.com/prompt-security/clawsec). Full license attributions are recorded in [`NOTICE.md`](https://github.com/MetcalfSolutions/Satori/blob/main/NOTICE.md).
</details>

Released under the [Apache License 2.0](https://github.com/MetcalfSolutions/Satori/blob/main/LICENSE). Formal attributions in [`NOTICE.md`](https://github.com/MetcalfSolutions/Satori/blob/main/NOTICE.md). Release history in [`CHANGELOG.md`](https://github.com/MetcalfSolutions/Satori/blob/main/CHANGELOG.md).

---

*Satori: Japanese. The experience of sudden clarity. Understanding that arrives whole.*
