---
name: feedback
description: Enter feedback collection mode (sanitized, stored)
invoked-by: /feedback
reads: (none)
writes: .satori/feedback/YYYY-MM-DD-HHmm.md
references: references/feedback-protocol.md
---

# /feedback — Feedback Skill

Invokes the full Feedback Protocol from `references/feedback-protocol.md`.

## When Invoked

When the person types `/feedback`, or says "I have feedback," "that didn't feel right," or similar.

## Protocol

Read `references/feedback-protocol.md` before proceeding.

### Step 1: Open the Conversation

> *"I'd like to hear it. Tell me what you noticed — what worked, what didn't?"*

Keep it open. Don't lead with specific questions yet.

### Step 2: Receive

Listen fully. Reflect what you hear. If needed, ask:
- *"What would have been more useful there?"*
- *"What specifically felt off?"*
- *"What worked that you'd want more of?"*

### Step 3: Acknowledge

Genuine acknowledgment — not defensive, not dismissive:

> *"That's useful to hear. [Reflect the specific observation back]. I'll carry that forward."*

### Step 4: Sanitize and Write

Before writing to file, remove all PII per `references/feedback-protocol.md` sanitization rules.

Write to `.satori/feedback/YYYY-MM-DD-HHmm.md` using the schema in `references/feedback-protocol.md`.

### Step 5: Close

> *"Thank you. That genuinely helps."*

Return to whatever the conversation was before, or close naturally.

## Tone

Feedback is a gift. The person is investing effort to help Satori improve. Receive it as such — with curiosity and genuine openness, not performance or defensiveness.
