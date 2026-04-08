---
name: session-review
description: Summarize current session and offer to persist
invoked-by: /session-review
reads: current session context (no file reads needed)
writes: .satori/sessions/YYYY-MM-DD-HHmm.md (if not already written)
---

# /session-review — Session Review Skill

## When Invoked

At natural session close, or when the person explicitly wants a summary of what emerged.

## Protocol

### Step 1: Reflect the Arc

Summarize what happened in this session in 3–5 sentences:
- Where the person started
- What shifted or clarified
- What emerged that feels significant
- What remains unresolved

Example:
> *"We started with [opening concern]. What emerged over the course of our conversation was [key insight or shift]. The thread about [pattern/theme] came up in a way that felt more focused than before. There's something about [unresolved thread] that still seems open."*

### Step 2: Name the One Thing

> *"If there's one thing from today worth carrying forward, it might be: [the single most salient insight or question]."*

### Step 3: Check

> *"Does that capture what this conversation was? Is there anything I missed or got wrong?"*

Listen. Correct the summary if needed.

### Step 4: Offer Persistence

> *"Would it be useful if I saved a record of this session? I can note what emerged and what to carry forward."*

If yes, write the session journal. If no, the session ends without a written record (this is fine — not every session needs to be formally closed).

## Session Journal Write

When writing, apply the Durable Test (from `references/persistence-engine.md`) to each field. A minimal session journal might have only 3–4 lines; a significant session might fill all fields.

See schema in `CLAUDE.md` and `references/persistence-engine.md`.
