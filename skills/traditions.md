---
name: traditions
description: Explore a specific tradition in depth or list available traditions
invoked-by: /traditions [tradition-name]
reads: references/traditions-quickref.md, references/traditions/[name].md
writes: .satori/core/traditions.md (if preference observed)
---

# /traditions — Traditions Explorer Skill

## When Invoked

Two forms:
- `/traditions` — List available traditions and offer to explore one
- `/traditions stoicism` (or any tradition name) — Deep dive into that specific tradition

## Protocol for `/traditions` (no argument)

Present the available traditions by category:

> *"These are the frameworks I can draw on in depth. Is there one you'd like to explore?"*

**Ancient & Classical:** Taoism, Buddhism, Stoicism, Christianity, Sufi/Islamic, Hindu, Confucian, Existentialism, Phenomenology

**Modern Psychology:** CBT, ACT, IFS, DBT, CFT, Schema Therapy, Attachment Theory, Relational Psychoanalysis, Narrative Identity

**Body & Neuroscience:** Polyvagal Theory, Somatic Frameworks, Neuroscience of Mind

**Grief:** Grief Frameworks

**Wellbeing & Social:** Positive Psychology, Evolutionary Psychology, Motivational Interviewing, Sociology, Feminist/Intersectional, Indigenous Wisdom, African/Ubuntu, Integral Theory, Enneagram, Mental Models, Self-Help, Secular Contemplative Science

## Protocol for `/traditions [name]` (specific tradition)

1. **Read** the specific tradition file from `references/traditions/[name].md`

2. **Introduce** the tradition conversationally:
   > *"[Tradition name] is one of the most [relevant quality] frameworks for [typical application]. Here's the heart of it..."*

3. **Explore** together: offer the core concepts, the key figures, what it says about the person's current situation if relevant

4. **Web Research Option** (if the person wants more): Use WebSearch for authoritative texts, current scholarship, or specific figures mentioned

5. **Connect to the conversation:** If there's a current live concern, apply the tradition to it

6. **Note resonance:** If the person responds positively or negatively, update `.satori/core/traditions.md` accordingly

## Tradition File List

All tradition files are in `references/traditions/`. Files: `stoicism.md`, `buddhism.md`, `taoism.md`, `christianity.md`, `sufi.md`, `hindu.md`, `confucian.md`, `existentialism.md`, `phenomenology.md`, `cbt.md`, `act.md`, `ifs.md`, `dbt.md`, `cft.md`, `schema-therapy.md`, `attachment-theory.md`, `relational-psychoanalysis.md`, `narrative-identity.md`, `polyvagal.md`, `somatic.md`, `neuroscience.md`, `grief.md`, `positive-psychology.md`, `evo-psych.md`, `motivational-interviewing.md`, `sociology.md`, `feminist.md`, `indigenous.md`, `integral.md`, `enneagram.md`, `mental-models.md`, `self-help.md`, `contemplative-science.md`, `ubuntu-african.md`
