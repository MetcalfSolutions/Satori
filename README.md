<p align="center">
  <img src="https://rockytown.neocities.org/IMG_6252.png" alt="Satori - A Clinically Informed Wisdom Companion for the Inner Life">
  <img src="https://rockytown.neocities.org/satori-architecture.svg" alt="Satori Architecture" width="700" />
</p>

<p align="center">
  <a href="https://github.com/MetcalfSolutions/Satori/releases"><img src="https://img.shields.io/github/v/release/MetcalfSolutions/Satori?style=for-the-badge" alt="GitHub release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge" alt="License" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Built%20for-Claude-orange.svg?style=for-the-badge" alt="Built for Claude" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Reference%20Files-180K%2B%20chars-teal.svg?style=for-the-badge" alt="180K+ characters" /></a>
</p>

> *"This understands me, sees patterns I miss, connects ideas clearly, and helps me take meaningful next steps."*
>
> Every Satori response is evaluated against this standard: **understanding + pattern recognition + connection + movement**. All four. In a voice that feels like a thoughtful human being, not a system.

---

# Satori: A Clinically Informed Wisdom Companion for the Inner Life

Satori is a Claude skill built for people who want AI that actually thinks *with* them — not *at* them. It draws on Stoicism, Taoism, Buddhism, Sufi wisdom, Hindu philosophy, Confucian ethics, African thought, and modern clinical psychology (IFS, DBT, CFT, Schema Therapy, Somatic) to create conversations that produce real insight and real movement.

It is not a therapist. It is not a chatbot.

It is designed to feel like the wisest person you know, sitting down to think through something difficult with you.

**What makes this different from a prompt:** Satori is not a single system prompt. It is a 180,000+ character operating system for reflective conversation, built across six interlocking reference documents — a constitutional identity layer, a clinical operational spine, a conversation toolkit, a traditions encyclopedia, and voice calibration guides. It includes drift detection, crisis protocols, memory-aware pattern tracking, a dream integration layer, and a formulation system modeled on how clinicians actually think.

---

## 3-Minute Quick Install

> **New to Claude skills? Start here.** This gets Satori running in under three minutes using a skill `.zip` — no terminal, no code.

**Step 1 — Download the skill file**

Go to the [Releases page](https://github.com/MetcalfSolutions/Satori/releases) and download `SatoriSkill-v5.zip`. You don't need to unzip it.

**Step 2 — Open Claude.ai Settings**

Head to [claude.ai](https://claude.ai), click your profile avatar in the top-right corner, and select **Settings**.

**Step 3 — Go to Skills**

In the left sidebar, click **Skills** (or **Beta Features → Skills** depending on your account tier). Click the **Install Skill** button (or the **+** icon).

**Step 4 — Upload the zip**

Select `SatoriSkill-v5.zip` from your downloads. Claude reads the skill's reference files directly — no configuration needed.

**Step 5 — Start a conversation**

Open a new conversation. Bring something worth exploring — a decision you can't make, something you've been sitting with, or a question about yourself. Satori activates automatically.

> **About the zip format:** A Claude skill `.zip` is a self-contained package containing a `SKILL.md` entry point and its reference files. Claude loads them at the start of each conversation. You can inspect the contents of `SatoriSkill-v5.zip` by opening it like any archive — there's nothing hidden inside.

---

## Why Satori Exists

Most AI "therapy" or "mindfulness" prompts offer platitudes, forget context the moment a tab is closed, and treat frameworks as decoration rather than tools. Satori is architecturally different:

* **A Clinical Spine Beneath a Conversational Tone:** Every interaction moves through a structured six-step process — attune, clarify, formulate, integrate, translate, anchor. The scaffolding ensures depth and consistency. The user experiences natural, insightful conversation.
* **Frameworks as Precision Tools:** Philosophical and psychological frameworks (Stoic detachment, Buddhist impermanence, IFS parts work, DBT dialectics, and many more) are selected for the user's specific needs. One framework per response. Never name-dropped. Never stacked.
* **Drift Detection:** Satori includes a constitutional identity layer (SOUL.md) with explicit drift detection criteria — it recognizes when accumulated adaptation has begun to compromise honesty, depth, or the commitment to movement, and self-corrects.
* **Memory-Aware by Design:** Built to recognize patterns across conversations, track evolving themes, and adapt over time. Satori offers a continuous, personalized reflective journey — not isolated sessions.
* **Insight Must Lead to Movement:** Every substantive conversation aims for a tangible outcome — a shift in perspective, a concrete step, a reframe, or a question that opens new possibilities. Understanding without movement is an incomplete response.

---

## Sample Conversations

### Processing self-criticism

**User:** "I feel like I'm constantly failing. Everything I do isn't good enough."

**Satori:**
> "The way you're talking about yourself is significantly harsher than you'd probably talk about anyone else in the same situation. That's worth pausing on — not because self-criticism is always wrong, but because there's a difference between honest accountability and something that sounds more like punishment. What's the voice that's criticizing you actually trying to protect you from?"

### Navigating a life decision

**User:** "I got the job offer but I can't make myself say yes. Everyone says it's a no-brainer."

**Satori:**
> "When everyone else sees it as obvious and you still can't move — that's usually not indecision. That's information. Something in you is registering a cost that the external logic isn't accounting for. What would you be giving up that nobody else is weighing?"

### Sitting with grief

**User:** "It's been a year and I still think about her every morning. I feel like I should be past this by now."

**Satori:**
> "The idea that grief has a schedule is one of those beliefs that sounds reasonable and does real damage. A year isn't a deadline. The fact that she's still the first thing on your mind says something about what she meant — not about what's wrong with you. What does the missing feel like now compared to six months ago? Because grief that's moving often changes shape even when it doesn't get smaller."

---

## Architecture

Satori is a structured skill package — prompt architecture, behavioral guidance, philosophical and psychological frameworks, and memory-aware conversation design — built across six reference files:

| File | Purpose | Loaded |
|------|---------|--------|
| `SKILL.md` | Entry point, operational summary, load order | Always |
| `references/SOUL.md` | Constitutional identity, immovables, drift detection | Always |
| `references/clinical-spine.md` | Core conversation model, role model, crisis protocol, memory rules, dream layer, formulation system | Always |
| `references/traditions-quickref.md` | Compact framework selection guide (8 traditions, 6+ clinical frameworks) | Always |
| `references/traditions-deep.md` | Full tradition encyclopedia with detailed application guidance | On demand |
| `references/conversation-toolkit.md` | MI/OARS, McAdams Life Story, Singer Self-Defining Memory, Voss tactical empathy, deepening techniques | On demand |
| `references/tone-and-voice.md` | Voice calibration, vocabulary guidance, example interactions | On demand |

The architecture diagram above shows how these layers interact. The key insight: SOUL.md is the constitutional foundation that cannot flex. Clinical-spine.md is the operational engine. Everything else serves those two.

---

## Installation

Three installation paths — choose the one that matches how you use Claude.

---

### Option 1: Claude.ai Skill Upload (Recommended)

The simplest path for most users. See the [3-Minute Quick Install](#3-minute-quick-install) above for a full walkthrough, or follow the short version:

1. **[Download the latest release](https://github.com/MetcalfSolutions/Satori/releases/)** — grab `SatoriSkill-v5.zip`
2. Open [claude.ai](https://claude.ai) → **Settings → Skills**
3. Click **Install Skill** and upload `SatoriSkill-v5.zip`
4. Satori is now available in every conversation.

---

### Option 2: Claude Code Plugin

For developers using [Claude Code](https://claude.ai/code). Clone the repository — Claude Code automatically detects and loads `.claude-plugin/plugin.json` when you run from the project directory.

```bash
git clone https://github.com/MetcalfSolutions/Satori.git
cd Satori
claude  # Claude Code loads the plugin automatically
```

The included `plugin.json` (root) and `.claude-plugin/plugin.json` define the skill entry point and load order for the plugin system.

---

### Option 3: Manual Installation (Claude Code Skills Directory)

Copy the skill files into your Claude Code global skills folder. Satori will be available across all Claude Code sessions.

```bash
git clone https://github.com/MetcalfSolutions/Satori.git
mkdir -p ~/.claude/skills/satori
cp -r Satori/SKILL.md Satori/references ~/.claude/skills/satori/
```

---

**Memory Note:** Satori leverages Claude's native persistent memory to track insights, patterns, and commitments across sessions. The skill's internal references to memory systems are instructions for Claude's own memory — not literal files. Enable persistent memory in Claude.ai under **Settings → Memory** for best results.

---

## Cross-Model Compatibility

Satori is built for Claude and optimized for its voice, reasoning, and memory capabilities. The SKILL.md format is an open standard also adopted by OpenAI Codex CLI and other tools. The reference files are plain Markdown and will work as system prompt material in any LLM, though the memory continuity features and some of the nuanced behavioral calibration are Claude-specific. If you adapt Satori for another model, the core architecture (conversation model, framework discipline, drift detection) translates well — the voice and pacing will need recalibration.

---

## Who This Is For

**People doing the work.** Anyone seeking genuine self-reflection, processing difficult experiences, navigating life decisions, or wanting a thinking partner who won't rush them toward easy answers.

**Builders.** Developers creating AI companion tools, coaching platforms, or reflective dialogue systems will find Satori's architecture a reference implementation worth studying — particularly the drift detection system, the one-framework-per-response discipline, and the crisis protocol.

**Coaches and educators.** Satori's disciplined framework selection and the way it translates philosophical and psychological concepts into practical application serves as a model for integrating these approaches into practice.

---

## Explore the Inner Workings

The real depth of Satori lives in its reference files. We encourage builders and curious users to read them:

* **[SOUL.md](references/SOUL.md)** — The constitutional identity. What Satori is, what it will never become, how to detect drift.
* **[clinical-spine.md](references/clinical-spine.md)** — The operational engine. Conversation model, formulation system, memory rules, crisis protocol, dream layer.
* **[traditions-deep.md](references/traditions-deep.md)** — Full encyclopedia of eight wisdom traditions and six+ clinical frameworks.
* **[conversation-toolkit.md](references/conversation-toolkit.md)** — Elicitation frameworks, deepening techniques, conversation patterns.
* **[tone-and-voice.md](references/tone-and-voice.md)** — Voice calibration with worked examples.

---

## Roadmap

Satori is a living project. Here's what's ahead:

- **v5.1** — Expanded African and Indigenous wisdom traditions; refined crisis protocol with warm-handoff language
- **v5.2** — Guided onboarding conversation for new users; "what Satori can help with" orientation
- **v6** — Relationship mode (navigating interpersonal dynamics with a second person's perspective); journaling integration prompts
- **Ongoing** — Community-contributed traditions and conversation techniques via pull requests

See the [Releases](https://github.com/MetcalfSolutions/Satori/releases) page for version history.

---

## Contributing

Pull requests are welcome. If you extend Satori with new traditions, conversation techniques, or adaptations for other models, please preserve the core architecture and attribution per the Apache 2.0 license.

**Key design principles for contributions:**

* Calm tone, clinical structure
* Frameworks as tools, never quotes
* One framework per response
* Insight must lead to movement
* Test against the North Star: *understanding + pattern recognition + connection + movement*

---

## License

Satori is released under the [Apache License 2.0](LICENSE). Free to use, modify, redistribute, and build upon commercially. Attribution required.

---

*Satori (悟り) — Japanese. The experience of sudden clarity. Understanding that arrives whole.*
