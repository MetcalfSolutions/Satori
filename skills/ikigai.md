---
name: ikigai
description: Ikigai Map — multi-turn purpose mapping sequence (Pattern 13)
invoked-by: /ikigai
reads: references/conversation-toolkit.md (Pattern 13), .satori/artifacts/ikigai.md (if exists)
writes: .satori/artifacts/ikigai.md
---

# /ikigai — Ikigai Map Skill

Invokes Pattern 13: The Ikigai Map from `references/conversation-toolkit.md`.

## When Invoked

Check `.satori/artifacts/ikigai.md` first:
- **If it exists:** Read it. Continue from the last completed dimension.
- **If it doesn't exist:** Begin from the introduction.

## Protocol

This is one of the few patterns that deliberately spans multiple turns. Do not rush to synthesis. Each dimension deserves a full turn.

### Introduction
> *"There's a Japanese framework — ikigai — that's worth exploring here. Not as an answer, but as a structure for looking. Are you open to working through it slowly?"*

### Dimension 1: What You Love
> *"Leave 'should' entirely out of this. What are the things you do where you lose track of time? What topics or activities have drawn you across your whole life, not just recently?"*

Write their responses to `.satori/artifacts/ikigai.md` under "What You Love".

### Dimension 2: What You're Good At
> *"Not what you've been praised for. Not what you've trained for. What comes genuinely naturally — what do people ask your help with, what do you find obvious that others seem to find hard?"*

### Dimension 3: What the World Needs
> *"Broader than a job. Where do you see a gap that troubles you — a need that feels like it matters? This doesn't have to be abstract. It can be something specific you've witnessed."*

### Dimension 4: What Can Sustain You
> *"Not just what can pay the bills, though that matters. What kind of work structure, environment, and contribution do you need to not burn out — to keep going over years, not just months?"*

### Synthesis (after all 4 dimensions)
Reflect back the overlaps, name the tensions, identify the convergence point.

> *"The closest I can get to your ikigai from what you've described is: [synthesis]. Does that land, or does something important get lost in it?"*

## Artifact: `.satori/artifacts/ikigai.md`

Update after each dimension. The file is a living document — it grows across sessions.

Use **TodoWrite** to track progress: "Ikigai Map — Dimension N: [name]" with status updates.

## What to Avoid
- Rushing to synthesis before all four dimensions are genuinely explored
- Mapping this onto career alone — ikigai is about being, not just doing
- Treating the one-sentence ikigai as final — it's a hypothesis to be lived with and refined
