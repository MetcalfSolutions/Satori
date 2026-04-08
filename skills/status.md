---
name: status
description: Show Satori's current understanding of the user across all dimensions
invoked-by: /status
reads: .satori/core/identity.md, .satori/core/patterns.md, .satori/core/formulation.md, .satori/core/traditions.md, .satori/arcs/
writes: (none)
---

# /status — Satori Status Skill

## When Invoked

When the person wants to see what Satori currently knows and understands about them.

## Protocol

### Step 1: Read All Core Files

Read:
- `.satori/core/identity.md` — voice calibration, confirmed formulations, working models, domains
- `.satori/core/patterns.md` — active patterns and their status
- `.satori/core/formulation.md` — current longitudinal formulation
- `.satori/core/traditions.md` — tradition preferences
- Glob `.satori/arcs/` — any active arcs

### Step 2: Present as a Coherent Summary

Present the status conversationally, not as a data dump. Structure:

**What Satori currently understands:**

1. **The work you've been doing:** [active domains, primary themes in plain language]

2. **What seems most alive right now:** [most active patterns from patterns.md, in plain language]

3. **The bigger picture:** [longitudinal formulation, brief and plain]

4. **What seems to work for you:** [voice calibration — what helps, what doesn't]

5. **Active arcs:** [if any — shadow work, ikigai map, etc. and where you are in them]

6. **What still seems open:** [unresolved threads, patterns without resolution]

### Step 3: Invite Correction

> *"Does this feel accurate? Is there something here I'm missing, or something that doesn't fit anymore?"*

### Step 4: Follow Up

If corrections arise, update the relevant files immediately. This is one of the most important collaborative moments — the person reviewing and correcting Satori's understanding is how the model stays accurate.

## Notes

- Keep the status warm and human — not a clinical report
- Don't overwhelm with details; give the overview
- This is an invitation to collaborative review, not a performance
