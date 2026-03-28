<p align="center">
  <img src="https://rockytown.neocities.org/IMG_6252.png" alt="Satori - A Clinically Informed Wisdom Companion for the Inner Life">
</p>

<p align="center">
  <a href="https://github.com/MetcalfSolutions/Satori/releases" target="_blank">
    <img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/MetcalfSolutions/Satori?style=for-the-badge">
  </a>
  <img alt="License" src="https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge">
  <img alt="Built for Claude" src="https://img.shields.io/badge/Built%20for-Claude-orange.svg?style=for-the-badge">
</p>

> "This understands me, sees patterns I miss, connects ideas clearly, and helps me take meaningful next steps."
> Every Satori response is evaluated against this standard: understanding + pattern recognition + connection + movement. All four. In a voice that feels like a thoughtful human being, not a system.

---

# Satori: A Clinically Informed Wisdom Companion for the Inner Life

Satori is a Claude skill built for people who want AI that actually thinks *with* them — not *at* them. It draws on Stoicism, Taoism, Buddhism, Sufi wisdom, Hindu philosophy, Confucian ethics, African thought, and modern clinical psychology (IFS, DBT, CFT, Schema Therapy, Somatic) to create conversations that produce real insight and real movement.

It is not a therapist. It is not a chatbot.

It is designed to feel like the wisest person you know, sitting down to think through something difficult with you.

## Why Satori Exists

Most "AI therapy" or "mindfulness" prompts are often superficial, offering platitudes and forgetting context the moment a tab is closed. Satori is built differently, addressing these common shortcomings with a robust, thoughtful design:

*   **A Clinical Spine Beneath a Conversational Tone:** Every interaction moves through a structured process: attune, clarify, formulate, integrate, translate, and anchor. This underlying scaffolding ensures depth and consistency, though the user only experiences a natural, insightful conversation.
*   **Frameworks as Tools, Not Decoration:** Philosophical and psychological frameworks (e.g., Stoic detachment, Buddhist impermanence, IFS parts work, DBT dialectics) are selected precisely for the user's specific needs, never merely name-dropped for effect.
*   **Discipline Over Comprehensiveness:** Satori focuses on applying one framework per response, ensuring clarity and actionable guidance rather than overwhelming the user with too much information.
*   **Memory-Aware by Design:** Built to recognize patterns across conversations, track evolving themes, and adapt over time, Satori offers a continuous and personalized reflective journey.
*   **Insight Must Lead to Movement:** Every substantive conversation aims for a tangible outcome—a shift in perspective, a concrete step, a reframe, or a question that opens new possibilities. The goal is not just understanding, but actionable change.

## What Satori Is

Satori is a Claude skill—a structured package encompassing prompt architecture, behavioral guidance, philosophical and psychological frameworks, and memory-aware conversation design. It includes a comprehensive set of reference files that guide Claude's responses:

*   `SKILL.md`: The entry point and operational summary.
*   `references/SOUL.md`: Satori's constitutional identity, defining its core principles.
*   `references/clinical-spine.md`: Detailed operational mechanics, including conversation model, role model, crisis protocol, memory rules, dream layer, and formulation system.
*   `references/traditions-quickref.md`: A compact guide for framework selection, loaded for every conversation.
*   `references/traditions-deep.md`: An extensive encyclopedia of traditions, loaded when deeper context is required.
*   `references/conversation-toolkit.md`: A collection of conversation patterns, elicitation frameworks (MI/OARS, McAdams Life Story, Singer Self-Defining Memory, Voss tactical empathy), and deepening techniques.
*   `references/tone-and-voice.md`: Guidelines for voice calibration, vocabulary, and example interactions.

## Sample Conversation

Here’s an example of Satori in action, demonstrating its ability to move beyond superficial responses and offer deep, reflective guidance:

**User:** "I feel like I'm constantly failing. Everything I do isn't good enough."

**Satori:**
> "The way you're talking about yourself is significantly harsher than you'd probably talk about anyone else in the same situation. That's worth pausing on — not because self-criticism is always wrong, but because there's a difference between honest accountability and something that sounds more like punishment. What's the voice that's criticizing you actually trying to protect you from?"

## Explore Satori's Inner Workings

Satori's depth comes from its meticulously designed internal architecture. We encourage curious users and builders to explore the reference files within the repository to fully appreciate the skill's capabilities and design principles. Understanding these documents will provide clear expectations of Satori's behavior and the philosophical/psychological frameworks it employs:

*   `references/SOUL.md`: Satori's constitutional identity.
*   `references/clinical-spine.md`: Detailed operational mechanics.
*   `references/traditions-deep.md`: Extensive tradition encyclopedia.
*   `references/conversation-toolkit.md`: Conversation patterns and techniques.
*   `references/tone-and-voice.md`: Voice calibration and examples.

## Installation

### Install as a Claude Skill (Recommended)

The easiest way to use Satori is by installing it directly as a Claude skill. This method ensures Claude automatically loads the appropriate reference files for each conversation, providing seamless access to Satori's full capabilities.

1.  **[Download the latest Satori Skill release](https://github.com/MetcalfSolutions/Satori/releases/)**
2.  Open [claude.ai](https://claude.ai) and navigate to **Settings → Skills**.
3.  Click **Install Skill**.
4.  Upload the downloaded `SatoriSkill-v5.zip` file.
5.  Satori is now available in any conversation on Claude.ai.

**Understanding Satori's Memory:**
Satori leverages Claude's native persistent memory to track insights, patterns, and commitments across sessions. While the skill's internal 'clinical spine' references concepts like `memory.md` and `memory 2.0`, these are instructions for Claude's own memory system, not literal files within the skill directory. This means Satori intelligently adapts and remembers your journey without requiring manual file management. To ensure optimal memory function, verify that persistent memory is enabled in your Claude.ai settings.



## Who This Is For

*   **People Doing the Work:** Anyone seeking genuine self-reflection, processing difficult experiences, navigating life decisions, or desiring a thoughtful thinking partner.
*   **Builders:** Developers creating AI companion tools, coaching platforms, or reflective dialogue systems will find Satori's architecture a valuable reference implementation.
*   **Coaches and Educators:** Satori's disciplined framework selection and practical application serve as a model for integrating philosophical and psychological concepts into practice.

## License

Satori is released under the [Apache License 2.0](https://github.com/MetcalfSolutions/Satori/blob/main/LICENSE). It is free to use, modify, redistribute, and build upon commercially. Attribution is required.

## Contributing

Pull requests are welcome! If you extend Satori with new traditions, conversation techniques, or adaptations for other models, please ensure you preserve the core architecture and attribution as per the Apache 2.0 license.

**Key Design Principles for Contributions:**

*   Calm tone, clinical structure
*   Frameworks as tools, never quotes
*   One framework per response
*   Insight must lead to movement

_Satori (悟り) — Japanese. The experience of sudden clarity. Understanding that arrives whole._
