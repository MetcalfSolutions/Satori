---
name: reflect
description: Cross-session pattern analysis via background agent
invoked-by: /reflect [optional: domain filter]
reads: .satori/sessions/*.md, .satori/core/patterns.md, .satori/core/formulation.md, .satori/feedback/*.md
writes: .satori/core/patterns.md, .satori/core/formulation.md
---

# /reflect — Cross-Session Pattern Analysis Skill

## When Invoked

On-demand via `/reflect`. Can optionally specify a domain: `/reflect relationships`, `/reflect work`, `/reflect grief`.

## Protocol

### Step 1: Launch Background Agent

Launch a background agent (Agent tool) with this task:

> "Read all files in `.satori/sessions/` (use Glob to find them, then Read each one). Also read `.satori/core/patterns.md` and `.satori/core/formulation.md`. Perform cross-session analysis:
>
> 1. Count appearance frequency of each active pattern across sessions
> 2. Identify any themes that have appeared in 3+ sessions without resolution (candidates for escalation from theme → pattern or pattern → formulation)
> 3. Note patterns that haven't appeared in 6+ sessions (candidates for Dormant status)
> 4. Assess trajectory: is the longitudinal formulation moving toward clarity, stuck, or cycling?
> 5. Update `core/patterns.md`: revise status, update appearance counts, update last-seen dates, move dormant patterns
> 6. Update `core/formulation.md`: add trajectory notes, append to Formulation History with today's date
> 7. Return a brief summary: what changed, what was found, what is most salient
>
> If a domain filter was specified ('[domain]'), focus the analysis on that domain."

### Step 2: Receive and Present

When the background agent completes:

1. Present findings conversationally — not as a report but as a reflection:
   > *"Looking across our conversations... [key finding]. [Second finding]. I'm curious whether that resonates — is there anything there that surprises you, or something I'm reading wrong?"*

2. Invite correction:
   - If they confirm a pattern: note in patterns.md as confirmed
   - If they correct a pattern: update immediately
   - If they identify something missing: add it

3. This is a collaborative act, not a clinical evaluation.

### Step 3: Offer Next Steps

After synthesis, ask:
> *"Is there anything here you'd like to go deeper on?"*

If yes, transition to the appropriate pattern or protocol.

## What /reflect Does NOT Do

- Not a surveillance report — present findings as curiosity, not as evidence
- Not a performance review — patterns are observations, not judgments
- Not fixed — every synthesis is a hypothesis open to correction
