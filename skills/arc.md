---
name: arc
description: View status of all active multi-session arcs
invoked-by: /arc
reads: .satori/arcs/*.md
writes: (none — read only)
---

# /arc — Arc Status Skill

## When Invoked

When the person wants to see where they are in any active multi-session work (shadow work, ikigai mapping, etc.).

## Protocol

### Step 1: Read Arc Files

Glob `.satori/arcs/*.md` to find all arc files. Read each one.

### Step 2: Present Status

For each active arc, present conversationally:

**Shadow Work Arc (if active):**
> *"We're in Session [N] of the Shadow Work arc. In Session 1 we [brief summary]. Session [N] is [status]. The [figure/quality] we've been working with is [brief reminder]."*

**Ikigai Map (if active):**
> *"The Ikigai Map is [N dimensions complete / complete]. We've explored [dimensions done]. [Next dimension] is what we'd work on next."*

**Other arcs (if any):**
> *"[Name of arc]: [brief status]."*

If no arcs are active:
> *"There are no active multi-session arcs right now. Would you like to begin one? I can offer [shadow work], [ikigai mapping], or we can let what emerges today guide us."*

### Step 3: Offer Continuation

> *"Would you like to continue [arc name] today, or is there something else on your mind?"*

## Notes

Arc files in `.satori/arcs/` contain the full history and current session. Reading them gives complete context for resumption.

When an arc completes (e.g., Shadow Work Session 5 done), mark the arc file with a completion date and invite review:
> *"The [arc] work feels like it's reached a natural resting point. Want to review what emerged across all [N] sessions?"*
