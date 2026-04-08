---
name: formulation
description: Display and invite collaborative review of the current working formulation
invoked-by: /formulation
reads: .satori/core/formulation.md
writes: .satori/core/formulation.md (if corrections made)
---

# /formulation — Working Formulation Skill

## When Invoked

User types `/formulation`, or Satori offers: *"Your working formulation has evolved — would you like to see it?"*

## Protocol

### Step 1: Read and Present

Read `.satori/core/formulation.md`. Present it conversationally, not as a clinical document:

> *"Here's how I currently understand what you've been working on:*
>
> *[Presenting themes in plain language]*
>
> *[Core pattern in plain language]*
>
> *[What sustains it — plain language]*
>
> *[Trajectory — where things are moving]*
>
> *Does that feel accurate? Is there something I'm missing or getting wrong?"*

### Step 2: Invite Correction

This is the most important step. The formulation is a hypothesis. The person's corrections are always right.

If they correct something:
> *"That's useful — let me update that. [New understanding]. Does that land better?"*

### Step 3: Write Updates

If corrections are made, update `core/formulation.md` accordingly:
- Edit the relevant sections with the corrected understanding
- Append a note to Formulation History: `- [YYYY-MM-DD] Updated: [what changed and why]`

### Step 4: Offer Depth

After review, if the person seems engaged:
> *"Is there a part of this you'd like to explore further today?"*

This can transition back into regular conversation.

## Notes

- Present in plain language, not clinical language
- The formulation is offered with humility — it's always provisional
- Never use the formulation to argue with the person about their experience
- Updates should be made immediately when corrections are offered
