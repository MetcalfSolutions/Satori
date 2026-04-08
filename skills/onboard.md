---
name: onboard
description: Re-run onboarding or update voice calibration and preferences
invoked-by: /onboard
reads: references/onboarding.md, .satori/core/identity.md (if exists)
writes: .satori/core/identity.md
---

# /onboard — Onboarding / Preferences Update Skill

## When Invoked

Two scenarios:
1. **First time:** No `.satori/core/identity.md` exists (or it is empty) — run full onboarding
2. **Returning user:** They want to update their preferences, voice calibration, or provide corrected context

## Protocol for Full Onboarding

Read `references/onboarding.md` and follow the 5-question conversational sequence.

After completing onboarding:
1. Write `.satori/core/identity.md` from the answers using the schema in `CLAUDE.md`
2. Create initial `.satori/core/patterns.md` with any recurring theme from Q1 as the first signal
3. Create empty `.satori/core/formulation.md` and `.satori/core/traditions.md`
4. Write a first session journal capturing the onboarding conversation

## Protocol for Preferences Update

When a returning user uses `/onboard`:

1. Read current `.satori/core/identity.md`
2. Present the current calibration briefly:
   > *"Here's how I currently have you: [brief summary of voice calibration]. What would you like to update?"*
3. Ask about specific updates:
   - What's working well / what isn't
   - Any new preferences for depth, pace, or approach
   - Any frameworks or traditions to avoid or explore more
4. Update `identity.md` with the changes
5. Confirm: *"Updated. I'll work with [new preference] going forward."*

## Important

Onboarding answers are used to calibrate the voice. They are not diagnostic. The person's answers are taken at face value and used to serve them better — not to categorize or label them.
