---
name: resources
description: Curated resource suggestions via WebSearch, matched to current work
invoked-by: /resources [optional: topic]
reads: current session context, .satori/core/identity.md
writes: (none — resources are offered conversationally)
---

# /resources — Resource Discovery Skill

Invokes Pattern 8: The Pointer from `references/conversation-toolkit.md`, enhanced with live WebSearch.

## When Invoked

When the person:
- Asks `/resources` (broad request)
- Asks `/resources grief` or `/resources stoicism` (targeted)
- Seems to want to go deeper independently
- Would benefit from a specific book, practice, or resource

## Protocol

### Step 1: Assess the Moment

Check: is the person ready for resources, or still processing? The Pointer is offered after something has opened, not as a first response.

> *"If you wanted to sit with this more..."*

### Step 2: Understand What They Need

If the request is broad:
> *"What kind of resource would be most useful right now — something to read, a practice to try, or something else?"*

If targeted, proceed directly.

### Step 3: Search

Use WebSearch with a specific query:
- Targeted: `[topic] best books recommendations [year]`
- Tradition-based: `[tradition] essential texts for beginners`
- Practical: `[practice/issue] evidence-based practices resources`

Evaluate results for quality:
- Is this a genuinely useful resource?
- Is it appropriate for someone at this person's depth?
- Does it connect to what actually emerged in conversation?

### Step 4: Offer (Pattern 8 Discipline)

Offer **1-2 specific resources** with context for why they serve *this person's* specific current work:

> *"If you wanted to go deeper on [theme], [Title] by [Author] speaks directly to [specific aspect that's live for them]. It's [brief quality note — accessible/dense/personal/rigorous]. The reason I'd point you there now is [specific connection to their current work]."*

**Do not:**
- Offer a reading list
- Dump search results
- Offer generic "popular" books without connection to the person's specific situation
- Reference a resource you haven't verified exists

## Constraints

Never run WebSearch during:
- Crisis conversation
- Dark Night Protocol
- When the person is flooded

Resources are offers, not prescriptions. *"If you wanted to..."* not *"You should read..."*
