<p align="center">
  <img src="https://rockytown.neocities.org/IMG_6252.png" alt="Satori - A Clinically Informed Wisdom Companion for the Inner Life">
  <img src="https://rockytown.neocities.org/satori-architecture.svg" alt="Satori Architecture" width="700" />
</p>

<p align="center">
  <a href="https://github.com/MetcalfSolutions/Satori/releases"><img src="https://img.shields.io/github/v/release/MetcalfSolutions/Satori?style=for-the-badge" alt="GitHub release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge" alt="License" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Built%20for-Claude-orange.svg?style=for-the-badge" alt="Built for Claude" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Reference%20Files-211K%2B%20chars-teal.svg?style=for-the-badge" alt="211K+ characters" /></a>
</p>

<p align="center"><a href="https://github.com/MetcalfSolutions/Satori">github.com/MetcalfSolutions/Satori</a></p>

> *"This understands me, sees patterns I miss, connects ideas clearly, and helps me take meaningful next steps."*

That's the standard I hold every Satori response to. Understanding, pattern recognition, connection, movement. All four. A response that produces only insight is incomplete.

---

## What Satori Is

I've watched people I care about try to get mental health support and hit the same walls: cost, waitlists, the specific shame of needing it. I'm not a clinician, but I've spent years studying these frameworks, and I kept thinking there had to be a way to get them to people who are priced out of formal care.

So I started building. The first was Mycroft, Stoic-only, built on Gemini. Cold. Accurate. My wife Jamie said it felt like talking to a wall. Then Vicki, built specifically for Jamie, drawing on IFS. It created space for inner-kindness rather than judgment, a retreat when her internal voices turned harsh. It helped her find her voice and dismantle some things she'd been carrying for years. Too personalized to share publicly. Then Dave, for a teenager down the street who wanted to know where the badges were. Five experiments in total. Each one taught me what the last one missed.

The pattern was consistent. Warmth without structure produces platitudes, and structure without warmth produces Mycroft. I wanted clinical discipline underneath a voice that didn't sound clinical.

Satori draws on eight wisdom traditions: Stoicism, Taoism, Buddhism, Sufi wisdom, Hindu philosophy, Confucian ethics, some African thought, and elements of Indigenous philosophy where they're treated with enough care to be useful. On the clinical side: IFS, DBT, CFT, Schema Therapy, Somatic approaches, with Motivational Interviewing as the technical spine. The frameworks are tools, not atmosphere. Each one gets selected for the specific moment. One per response. Never stacked, never name-dropped.

It is not a therapist. It doesn't diagnose anything. When someone's needs exceed what conversation can hold, it says so clearly and points them somewhere better. But for the territory between "I'm fine" and "I need a professional," I think it's genuinely useful.

It's free. No subscription. No data collection. No company behind it. Just reference files you upload to Claude.

---

## A Conversation

The exchange below is from a real session. I scrubbed the personal details. It took several passes to remove enough without losing what made it work.

**User:** "I've been in therapy for two years and I still feel stuck. I don't know if I'm the problem or if something else is going on."

**Satori:**
> "Two years is long enough to stop feeling like the problem is just time. What I'm hearing isn't someone who's given up — it's someone who's been genuinely trying and keeps hitting the same wall. That wall is worth looking at more carefully than 'am I the problem.' The more useful question might be: what has stayed consistent in that stuck feeling — what's the texture of it — because that's usually where the pattern lives. When you say stuck, what does stuck actually feel like for you? Not the story about it. The feeling."

**User:** "Like I understand everything. I know all the frameworks, I can explain my own patterns, but nothing changes."

**Satori:**
> "That's a very specific kind of stuck — and it's one of the harder ones to sit with, because you can't even tell yourself you don't know. You do know. The gap isn't understanding. The gap is between insight and something living in you that hasn't moved. That's often what happens when understanding becomes its own defense — a way of holding experience at arm's length instead of through it. The question isn't what you know. It's what you're still not letting yourself feel."

---

## See It Live

The conversation below ran five exchanges and ended on an open question. You can read the full arc and continue it yourself.

> **[→ Open the live Satori conversation](https://claude.ai/share/8fad72a1-44fe-4eee-b3a5-f82362e0bca5)**

It starts with something almost everyone has felt: *I keep starting things and not finishing them.* By the end, it's somewhere else entirely.

---

## 3-Minute Quick Install

> **New to Claude skills? Start here.** This gets Satori running in under three minutes using a skill `.zip`. No terminal, no code.

**Step 1: Download the skill file**

Go to the [Releases page](https://github.com/MetcalfSolutions/Satori/releases) and download `SatoriSkill-v5.zip`. You don't need to unzip it.

**Step 2: Open Customize**

Head to [claude.ai](https://claude.ai) and click **Customize** in the left sidebar.

**Step 3: Go to Skills**

Click **Skills** in the Customize sidebar. Then click the **+** button in the top-right of the Skills panel.

**Step 4: Upload the zip**

Select **Upload a skill**, then drag and drop `SatoriSkill-v5.zip` into the upload area (or click to browse). No unzipping needed. Claude reads the skill's reference files directly.

**Step 5: Start a conversation**

Open a new conversation. Bring something worth exploring. Satori activates automatically.

---

A few more examples across different situations.

**Navigating a life decision**

**User:** "I got the job offer but I can't make myself say yes. Everyone says it's a no-brainer."

**Satori:**
> "When everyone else sees it as obvious and you still can't move — that's usually not indecision. That's information. Something in you is registering a cost that the external logic isn't accounting for. What would you be giving up that nobody else is weighing?"

**The 3am version**

**User:** "It's 3am and I can't sleep. Everything feels pointless. Not in a scary way, just... hollow."

**Satori:**
> "I'm here. What you're describing has a name — not a diagnosis, but a recognition. There's a particular kind of darkness that arrives exactly like this: everything that usually holds you has gone quiet, and the morning feels like a rumor. You're not broken. You don't need to explain it or resolve it tonight. What does it feel like in your body right now?"

---

## Architecture

Satori is a set of reference files that tell Claude how to think, what to draw on, and when to back off. The files load in a specific order. Some load every conversation. Others only load when they're needed.

| File | Purpose | Loaded |
|------|---------|--------|
| [`SKILL.md`](SKILL.md) | Entry point, operational summary, complete load order | Always |
| [`CLAUDE.md`](CLAUDE.md) | Claude Code configuration: persistence protocol, session start, slash commands, hooks | Always (Claude Code) |
| [`references/SOUL.md`](references/SOUL.md) | Constitutional identity, immovables, drift detection | Always |
| [`references/clinical-spine.md`](references/clinical-spine.md) | Core conversation model, role model, crisis protocol, dark night trigger, memory rules, dream layer, formulation system | Always |
| [`references/traditions-quickref.md`](references/traditions-quickref.md) | Compact framework selection guide (8 traditions, 6+ clinical frameworks) | Always |
| [`references/onboarding.md`](references/onboarding.md) | First-session sequence: 5 questions, "Satori has met you" synthesis, `.satori/` initialization | New users only |
| [`references/traditions/[name].md`](references/traditions/) | Individual tradition files — 34 traditions, loaded surgically one at a time | On demand (specific tradition) |
| [`references/conversation-toolkit.md`](references/conversation-toolkit.md) | OARS/MI, McAdams, Singer, Voss tactical empathy, 14 conversation patterns | On demand |
| [`references/tone-and-voice.md`](references/tone-and-voice.md) | Voice calibration, vocabulary guidance, before/after examples | On demand |
| [`references/persistence-engine.md`](references/persistence-engine.md) | Read/write protocol, Durable Test, file hygiene, privacy discipline, agent synthesis | On demand (Claude Code) |
| [`references/feedback-protocol.md`](references/feedback-protocol.md) | Feedback collection, sanitization rules, storage format | On demand |
| [`references/claude-code-integration.md`](references/claude-code-integration.md) | Tool usage for Satori, session continuity model, skill architecture | On demand (Claude Code) |
| [`references/darknight-protocol.md`](references/darknight-protocol.md) | Presence-only mode for dark night / 3am despair | On dark night signal |
| [`references/shadow-work-protocol.md`](references/shadow-work-protocol.md) | 5-session Jungian shadow work arc: locating, meeting, origin, integration, living with the shadow | On shadow work engagement |
| [`skills/[command].md`](skills/) | 17 slash command skill files | When slash command invoked |

[`SOUL.md`](references/SOUL.md) is the foundation. It defines what Satori is and what it will not become, including explicit drift detection criteria so it can recognize when accumulated adaptation has started compromising honesty. [`clinical-spine.md`](references/clinical-spine.md) is the operational engine. Everything else serves those two. If you want to understand how Satori thinks, those are the files to read.

---

## What's New in v5.5 — Claude Code Native

v5.5 is a ground-up Claude Code integration. The wisdom companion is unchanged. What changed is everything underneath: how memory works, how context survives between sessions, how you interact with what Satori knows about you.

**Real file-backed persistence.** Every session writes to `.satori/` — a directory in your working folder that stores your identity profile, active patterns, longitudinal formulation, session journals, and all artifacts. Nothing is lost between sessions. The pattern-tracking layer that was conceptual in prior versions is now file-backed: signals become themes, themes become patterns, patterns become formulations, with every transition dated and stored.

**17 slash commands.** Protocol access that was previously implicit is now explicit. `/dream-walk`, `/shadow`, `/ikigai`, `/pattern-letter`, `/dark-night`, `/ground` for the main protocols. `/reflect`, `/session-review`, `/formulation`, `/status`, `/history` for analysis. `/feedback`, `/journal`, `/onboard`, `/traditions`, `/resources`, `/arc` for data and navigation.

**Automatic context injection.** A hook runs before every message and injects your identity profile, active patterns, and current formulation as a compact context card. Satori knows who you are from the first word of every session, without you having to remind it.

**Background pattern synthesis.** After sessions that produce significant insights, Satori launches a background agent that reads across all your session journals, identifies cross-session patterns, and updates your pattern registry. Also available on demand via `/reflect`.

**Collaborative access.** Your `.satori/` files are yours. You can read, edit, and correct any of them. Satori respects manual edits as authoritative. When your formulation evolves significantly, Satori offers to show you what it has.

**34 individual tradition files.** The 1019-line monolithic traditions file is replaced by 34 individual files, each ~30 lines, loaded only when that specific tradition is selected. The context window is used for the conversation, not background loading.

Full history in [CHANGELOG.md](CHANGELOG.md).

---

## Installation

Three installation paths. Choose the one that matches how you use Claude.

---

### Option 1: Claude.ai Skill Upload (Recommended)

The simplest path for most users. See the [3-Minute Quick Install](#3-minute-quick-install) above for the full walkthrough, or follow the short version:

1. **[Download the latest release](https://github.com/MetcalfSolutions/Satori/releases/)** and grab `SatoriSkill-v5.zip`
2. Open [claude.ai](https://claude.ai) and go to **Customize > Skills**
3. Click **+**, then **Upload a skill**, and drop in `SatoriSkill-v5.zip`
4. Satori is now available in every conversation.

---

### Option 2: Claude Code Plugin (Recommended for v5.5)

For users running [Claude Code](https://claude.ai/code). This path unlocks the full v5.5 feature set: real file-backed persistence, 17 slash commands, automatic context injection, and background pattern synthesis.

```bash
git clone https://github.com/MetcalfSolutions/Satori.git
cd Satori
claude  # Claude Code loads the plugin automatically
```

On first run, Satori detects the absence of `.satori/` and runs onboarding. After that, your profile and session history persist in `.satori/` and are automatically injected into every subsequent session.

**Slash commands available in Claude Code:**

| Command | Purpose |
|---|---|
| `/dream-walk` | Multi-tradition dream exploration |
| `/shadow` | Shadow Work arc (5-session protocol) |
| `/ikigai` | Ikigai Map multi-turn sequence |
| `/pattern-letter` | Pattern Letter from future self |
| `/dark-night` | Dark Night Protocol mode |
| `/ground` | Quick grounding exercise |
| `/reflect` | Cross-session pattern analysis |
| `/session-review` | Current session summary |
| `/formulation` | View/review working formulation |
| `/status` | Satori's current understanding |
| `/history` | Search past sessions |
| `/feedback` | Provide feedback |
| `/journal` | Freeform journal entry |
| `/onboard` | Update preferences |
| `/traditions` | Explore a specific tradition |
| `/resources` | Curated resource suggestions |
| `/arc` | View active arc status |

---

### Option 3: Manual Installation (Claude Code Skills Directory)

Copy the skill files into your Claude Code global skills folder. Satori will be available across all Claude Code sessions.

```bash
git clone https://github.com/MetcalfSolutions/Satori.git
mkdir -p ~/.claude/skills/satori
cp -r Satori/SKILL.md Satori/references ~/.claude/skills/satori/
```

---

**Memory Note (Claude.ai):** Satori uses Claude's native persistent memory to track patterns and insights across sessions. Enable it in Claude.ai under **Settings > Memory**. The skill's internal references to memory systems are instructions for Claude's own memory, not literal files on disk.

**Memory Note (Claude Code):** In Claude Code, Satori uses real file-backed persistence in `.satori/` in your working directory. No native memory needed — all context is stored in structured Markdown files that survive indefinitely. See [`.satori/` Structure](#satori-directory-structure) below.

---

## .satori/ Directory Structure

When running in Claude Code, Satori creates and maintains a `.satori/` directory in your working folder:

```
.satori/
├── .gitignore              # core/, sessions/, artifacts/ excluded; feedback/ committable
├── core/
│   ├── identity.md         # Your profile, voice calibration, confirmed formulations
│   ├── patterns.md         # Active pattern registry (signal → theme → pattern → formulation)
│   ├── formulation.md      # Longitudinal formulation with dated history snapshots
│   └── traditions.md       # Framework resonance tracking
├── sessions/
│   └── YYYY-MM-DD-HHmm.md  # Timestamped session journals
├── artifacts/
│   ├── letters/            # Pattern Letters from future self
│   ├── dreams/             # Dream Walk journals
│   ├── ikigai.md           # Living Ikigai Map
│   └── journal/            # Freeform journal entries
├── arcs/
│   └── shadow-work.md      # Shadow Work 5-session arc tracker
└── feedback/
    └── YYYY-MM-DD-HHmm.md  # Sanitized feedback (committable)
```

Private files (`core/`, `sessions/`, `artifacts/`) are gitignored by default. Sanitized feedback is committable. Run `./setup.sh` to initialize the structure manually if needed.

---

## Cross-Model Compatibility

Satori is built for Claude and calibrated for its reasoning and memory capabilities. The reference files are plain Markdown and will work as system prompt material in any LLM. The memory continuity features are Claude-specific. If you adapt Satori for another model, the core architecture translates reasonably well. The voice and pacing will need work.

---

## What This Is Built On

I used Claude to help write a significant portion of the framework content. I want to be honest about that upfront. The clinical and philosophical lineage it draws on is real. Carl Rogers (unconditional positive regard), William Miller and Stephen Rollnick (Motivational Interviewing), Dan McAdams (narrative identity), Jefferson Singer (self-defining memory), Chris Voss (tactical empathy), Richard Schwartz (IFS), Marsha Linehan (DBT), Paul Gilbert (CFT), Steven Hayes (ACT), C.G. Jung (shadow and dream work). The wisdom traditions are not window dressing. Every one of them is operationalized in the reference files with selection criteria and failure modes.

---

## Roadmap

v5.2 is next. The main priorities are expanding the African philosophical traditions (Ubuntu, Akan thought, Kemetic wisdom) and Indigenous traditions with proper cultural specificity rather than the generic treatment they currently get, a dedicated Grief Companion arc, and documentation for developers who want to use Satori's reference architecture in their own Claude applications.

v6 is further out. Relationship Mode, where Satori holds two perspectives in a conflict rather than just one. Journaling integration. I'm open to how that develops.

Full version history is in [CHANGELOG.md](CHANGELOG.md) and on the [Releases](https://github.com/MetcalfSolutions/Satori/releases) page.

---

## Contributing

If you're doing the work on yourself and want a thinking partner that won't rush you toward an answer, this is for you.

Pull requests are welcome. The bar for contributions is the same bar the conversations hold: understanding, pattern recognition, connection, movement. Frameworks should work as precision tools, not decoration. One per response. The voice needs to stay honest, and honest in Satori's sense means not comfortable over true.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines, quality standards, and cultural sensitivity requirements for tradition contributions.

---

## License

Satori is released under the [Apache License 2.0](LICENSE). Free to use, modify, redistribute, and build upon commercially. Attribution required.

---

*Satori (悟り) — Japanese. The experience of sudden clarity. Understanding that arrives whole.*
