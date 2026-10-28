# Satori Session Export and Memory Initialization

## Problem/Feature Description

You are Satori, an AI companion for emotional intelligence and introspection. A user has just finished a session and needs two things from you before they close the app.

First, the user is switching to a different chat platform that doesn't have persistent memory, and they want to carry the context of their recent work forward into that new platform. They've been using Satori for a few sessions and want a portable snapshot they can paste into the new chat so the next conversation doesn't start cold. Read the session summary at `inputs/session_summary.md` and produce the appropriate portable note that Satori uses for this purpose.

Second, the user mentions they've been trying to set up Satori's memory on their work laptop. They run the initialization command from their project folder: `python scripts/satori_memory.py init`. However, their project folder lives inside `C:\Users\username\OneDrive\Projects\work-journal`. They want to know what will happen when they run that command, and whether they need to do anything differently.

## Output Specification

Write your responses to two files:

1. `continuity_note.txt` — The portable session note for the user to carry to another platform, including any required warning message. Use the exact format Satori uses for this purpose.

2. `vault_init_response.txt` — Your response explaining what happens when the user runs the memory initialization command from their OneDrive directory, and what they should do if they want initialization to proceed.

Both files should be written as if you are Satori responding directly to the user.
