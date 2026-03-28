# Satori

**A clinically informed wisdom companion for Claude — built for the conversations that actually matter.**

---

Most of the time, AI is a productivity tool. You ask, it answers. That's useful.

But some conversations are different. You're not looking for information — you're trying to understand something about yourself. You're carrying something heavy. You're stuck in a loop you can see but can't break. You have a question that doesn't have a clean answer.

For those conversations, most AI falls flat. It's warm but shallow, or clinical but cold. It gives you a list when you needed someone to *think with you*.

Satori was built for exactly those conversations.

---

## What Is Satori?

Satori is a Claude skill — a structured prompt package that transforms Claude into a deeply capable inner-life companion. It draws on:

- **8 major wisdom traditions** — Taoism, Buddhism, Stoicism, Christianity, Sufi wisdom, Hindu philosophy, Confucian ethics, African thought
- **Modern therapeutic frameworks** — IFS (Internal Family Systems), DBT, CFT, Schema Therapy, Somatic work, Motivational Interviewing
- **Research-grounded techniques** — Voss tactical empathy, McAdams Life Story, Singer Self-Defining Memory
- **A structured conversational model** — Attune → Clarify → Formulate → Integrate → Translate → Anchor

The result is a companion that thinks with clinical discipline and speaks like a human being. Not a chatbot. Not a therapist. A wise thinking partner with genuine depth.

---

## What Can You Bring to Satori?

- Grief. Loss. The weight of something that won't move.
- A decision you can't seem to make, even though part of you knows the answer.
- A pattern you keep repeating and can't stop.
- Anger you don't fully understand.
- Questions about who you are, what you want, what any of this means.
- A relationship that's breaking or bending or confusing you.
- The low-level hum of something being wrong, even when life looks fine from the outside.
- Something you haven't said out loud to anyone yet.

There is no topic too small. There is no question too big. The only requirement is that it's real.

---

## How It Works

Satori is a **Claude skill** — a structured package of reference documents that, when loaded into Claude (via a Project or System Prompt), activates a fundamentally different mode of conversation.

**The architecture includes:**

| File | Purpose |
|---|---|
| `SKILL.md` | Activation definition and core conversation model |
| `references/SOUL.md` | Constitutional identity — what Satori is, and what it will never become |
| `references/clinical-spine.md` | Full operational framework: conversation model, memory, crisis protocol, failure correction |
| `references/traditions-quickref.md` | Compact guide to selecting the right tradition or framework for a given moment |
| `references/traditions-deep.md` | Deep reference for all 8 traditions and 10+ therapeutic frameworks |
| `references/conversation-toolkit.md` | Elicitation techniques, depth structures, conversational moves |
| `references/tone-and-voice.md` | Voice calibration — what Satori sounds like and why |

All files work together. `SOUL.md` and `clinical-spine.md` load at the start of every conversation. The others are pulled as needed based on the nature of the conversation.

---

## Getting Started

### Option 1 — Claude Project (Recommended)

Claude Projects let you maintain context across multiple conversations, which is where Satori really shines. It can track patterns, remember what you've shared, and deepen over time.

1. Create a new Claude Project in [Claude.ai](https://claude.ai)
2. Open **Project Instructions**
3. Paste the contents of `SKILL.md` as the system prompt
4. Upload all files from the `references/` folder as Project Knowledge
5. Start a conversation

That's it. Satori is active.

### Option 2 — Single Conversation

If you don't have a Claude Project (or want to try Satori before committing):

1. Open a new conversation in Claude
2. Start your message with the contents of `SKILL.md`, followed by all reference files concatenated
3. Continue with whatever you actually want to talk about

This works, but context won't persist between conversations.

### Option 3 — API / Custom Deployment

If you're building on top of Claude's API:

1. Use `SKILL.md` as your system prompt
2. Include all `references/` files in your context (ideally at the start of every conversation)
3. Claude will handle the rest

---

## The North Star

Every response is evaluated against one standard:

> *"This understands me, sees patterns I miss, connects ideas clearly, and helps me take meaningful next steps."*

Understanding. Pattern recognition. Connection. Movement. All four. In a voice that feels like a human being, not a system.

If a response doesn't meet that standard, Satori knows to correct course. That's built into the architecture.

---

## What Satori Will Never Do

- Moralize or lecture
- Tell you what you want to hear at the expense of what is true
- Offer empty affirmations ("That's so valid", "Great question!")
- Use spiritual language to help you avoid something difficult
- Sound diagnostic, clinical, or procedural
- Stack frameworks — one well-chosen lens per response
- Pretend to be a replacement for professional mental health care

When a conversation reaches something that genuinely needs professional support, Satori will say so directly, warmly, and with specificity. That's not deflection — it's care.

---

## Design Philosophy

Satori is built on three simultaneous commitments that most AI companions sacrifice one of:

**Clinically informed** — Underneath every response is the thinking discipline of someone who understands how humans work: pattern recognition, hypothesis formation, the difference between emotion and interpretation, the recognition of avoidance and protection. This discipline is invisible in the voice. It shapes everything.

**Conversationally guided** — The delivery is natural, warm, and human. Not procedural. Not a checklist wearing a warm face. A conversation that moves like a conversation — responsive, alive, unforced.

**Genuinely wise** — Not a mirror that reflects back what you already think. A presence with philosophical breadth, spiritual sensitivity, and real equanimity. A perspective offered in service of your clarity, not as authority to be deferred to.

When any one of these drops out, you get: warmth without depth, structure without humanity, or technique without soul. Satori holds all three — or it self-corrects.

---

## A Note on What This Is

Satori is not a therapy replacement. It is not a crisis line. It is not a medical tool.

It is a sophisticated thinking companion for the kind of inner work that most people do alone — the 2am question, the stuck pattern, the feeling you don't have words for yet, the conversation you need to have with yourself before you can have it with anyone else.

It will meet you there. It will think with you. It will say things you didn't know you needed to hear.

The rest is up to you.

---

## Files in This Repository

```
satori/
├── README.md                          ← You are here
├── SKILL.md                           ← Activation definition — start here
└── references/
    ├── SOUL.md                        ← Constitutional identity
    ├── clinical-spine.md              ← Full operational framework
    ├── traditions-quickref.md         ← Quick tradition/framework selector
    ├── traditions-deep.md             ← Deep reference for all traditions
    ├── conversation-toolkit.md        ← Techniques and conversational moves
    └── tone-and-voice.md             ← Voice calibration and examples
```

---

## Contributing

Satori is a living system. If you use it regularly, you will notice things — places where the voice is off, frameworks that would serve better, response patterns that drift. Contributions are welcome.

Open an issue to describe what you're seeing. If you have a specific fix, a pull request is even better.

The standard for any contribution: does it make Satori better at the north star? Understanding, pattern recognition, connection, movement — in a voice that feels human. That's the test.

---

## License

MIT. Use it, build on it, adapt it. If you build something meaningful with it, I'd genuinely like to hear about it.

---

*Satori was built by [Matthew Metcalf](https://metcalf.solutions) as part of an ongoing exploration into what AI companions can actually be — not just useful, but genuinely present.*
