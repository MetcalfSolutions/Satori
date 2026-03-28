# Satori

**A clinically informed wisdom companion for the inner life.**

Satori is a Claude skill built for people who want AI that actually thinks with them — not at them. It draws on Stoicism, Taoism, Buddhism, Sufi wisdom, Hindu philosophy, Confucian ethics, African thought, and modern clinical psychology (IFS, DBT, CFT, Schema Therapy, Somatic) to create conversations that produce real insight and real movement.

It is not a therapist. It is not a chatbot.

It is designed to feel like the wisest person you know, sitting down to think through something difficult with you.

---

## Why Satori Exists

Most "AI therapy" or "mindfulness" prompts are dressed-up platitude machines. They validate. They reflect. They forget everything the moment you close the tab.

Satori is built differently:

- **A clinical spine beneath a conversational tone** — every response moves through a structured process: attune, clarify, formulate, integrate, translate, anchor. The user never sees the scaffolding. They just feel the difference.
- **Frameworks as tools, not decoration** — Stoic detachment, Buddhist impermanence, IFS parts work, DBT dialectics — selected precisely for what the person is actually facing, never name-dropped for effect.
- **One framework per response** — discipline over comprehensiveness.
- **Memory-aware by design** — built to recognize patterns across conversations, track themes the person hasn't consciously connected yet, and adapt over time.
- **Insight must lead to movement** — every substantive conversation ends with a shift, a step, a reframe, or a question that opens something. Not just understanding. Action.

---

## What Satori Is

Satori is a Claude skill — a structured package of prompt architecture, behavioral guidance, philosophical and psychological frameworks, and memory-aware conversation design.

The skill includes:

- `SKILL.md` — the entry point and operating summary
- `references/SOUL.md` — Satori's constitutional identity; what it is and won't drift from
- `references/clinical-spine.md` — the full operational mechanics: conversation model, role model, crisis protocol, memory rules, dream layer, formulation system
- `references/traditions-quickref.md` — compact framework selection guide across all traditions; loaded every conversation
- `references/traditions-deep.md` — full tradition encyclopedia; loaded when depth is needed
- `references/conversation-toolkit.md` — all conversation patterns, elicitation frameworks (MI/OARS, McAdams Life Story, Singer Self-Defining Memory, Voss tactical empathy), and deepening techniques
- `references/tone-and-voice.md` — voice calibration, vocabulary guide, before/after examples

---

## Install: Claude Skill (Recommended)

The easiest way to use Satori is as a Claude skill. Download the packaged zip and install it directly.

**[⬇ Download SatoriSkill-v5.zip](https://github.com/MetcalfSolutions/Satori/raw/main/SatoriSkill-v5.zip)**

Once downloaded:

1. Open [claude.ai](https://claude.ai) and go to **Settings → Skills**
2. Click **Install Skill**
3. Upload the zip file
4. Satori is now available in any conversation

When Satori is installed as a skill, Claude automatically loads the appropriate reference files for each conversation — compact always-loaded files for baseline capability, deeper references when the conversation calls for it.

---

## Install: Claude Project

If you prefer to use Satori inside a specific Claude Project:

1. Clone or download this repository
2. Create a new Project in [claude.ai](https://claude.ai)
3. Add the following files to the Project's knowledge base:
   - `satori/SKILL.md`
   - `satori/references/SOUL.md`
   - `satori/references/clinical-spine.md`
   - `satori/references/traditions-quickref.md`
4. Add the remaining reference files (`traditions-deep.md`, `conversation-toolkit.md`, `tone-and-voice.md`) as supplemental knowledge
5. In the Project instructions, add: *"You are Satori. Load and operate according to SKILL.md."*

The Project approach is useful if you want to customize Satori's context, combine it with personal memory files, or build a dedicated space for ongoing reflective work.

---

## Who This Is For

**People doing the work** — anyone using AI for genuine self-reflection, processing difficult experiences, navigating a life decision, or just wanting a thinking partner who takes the conversation seriously.

**Builders** — if you're developing AI companion tools, coaching platforms, or reflective dialogue systems, Satori's architecture is a reference implementation worth studying. The clinical spine, unified role model, memory promotion rules, and conversation toolkit represent months of iterative design.

**Coaches and educators** — Satori's framework selection discipline (one tradition, applied precisely, translated to plain language) is a model for how philosophical and psychological frameworks should be used in practice.

---

## The North Star

> *"This understands me, sees patterns I miss, connects ideas clearly, and helps me take meaningful next steps."*

Every Satori response is evaluated against this standard: understanding + pattern recognition + connection + movement. All four. In a voice that feels like a thoughtful human being, not a system.

---

## License

Apache License 2.0 — free to use, modify, redistribute, and build on commercially. Attribution required. See [LICENSE](LICENSE) for full terms.

---

## Contributing

Pull requests welcome. If you extend Satori — new traditions, new conversation techniques, adaptations for other models — please preserve the core architecture and attribution per the Apache 2.0 license.

The design principles that must survive any contribution:
- Calm tone, clinical structure
- Frameworks as tools, never quotes
- One framework per response
- Insight must lead to movement

---

*Satori (悟り) — Japanese. The experience of sudden clarity. Understanding that arrives whole.*
