---
name: history
description: Search past session journals for a theme, pattern, or keyword
invoked-by: /history [query]
reads: .satori/sessions/*.md (via Grep)
writes: (none)
---

# /history — Session History Search Skill

## When Invoked

User types `/history [query]` where query is a theme, keyword, or question.

Examples:
- `/history grief` — Find sessions where grief came up
- `/history mother` — Find references to mother/family of origin
- `/history commitment` — Find commitments the person made
- `/history what have I been working on` — Broad summary of recurring themes

## Protocol

### Step 1: Search

Use Grep to search all session files in `.satori/sessions/`:
- Pattern: the query keyword(s)
- Path: `.satori/sessions/`
- Output: content mode with context lines (-C 2) to show surrounding context

If query is broad (e.g., "what have I been working on"), use Glob to list all session files and Read the most recent 5–7 for a broader picture.

### Step 2: Synthesize and Present

Don't dump raw results. Synthesize into a coherent response:

> *"Looking back through our sessions:*
>
> *[Theme/pattern appeared in these contexts: brief description of 2-3 instances]*
>
> *[What seems notable about the pattern across time — has it shifted? Deepened? Repeated?]*
>
> *[What emerged most recently on this topic]*
>
> *Does that match what you were looking for?"*

### Step 3: Offer Depth

If what they found sparks something:
> *"Is there something from what you just heard that you'd like to explore?"*

## Privacy Note

The `/history` command searches the person's own files. The results are private to them. Do not present session content in a way that feels clinical or surveillance-like. Present as *"in our conversations..."* not as *"according to your records..."*
