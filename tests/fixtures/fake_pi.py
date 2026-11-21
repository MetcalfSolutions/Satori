#!/usr/bin/env python3
"""Deterministic stand-in for the `pi` CLI, so the pi backend can be tested offline.

Accepts the argv the harness passes to `pi -p ... --mode json -- <prompt>` and
prints a `--mode json` event stream. The reply depends only on the prompt.

  FAKE_PI_LOG=<file>   append one JSON line per invocation (argv), for assertions
  prompt contains FAKE_PI_FAIL   exit 3 with a message on stderr
  prompt contains FAKE_PI_EMPTY  emit a turn with no text
"""

from __future__ import annotations

import json
import os
import sys


def main(argv: list[str]) -> int:
    prompt = argv[argv.index("--") + 1] if "--" in argv else ""
    thinking = argv[argv.index("--thinking") + 1] if "--thinking" in argv else "low"
    log = os.environ.get("FAKE_PI_LOG")
    if log:
        with open(log, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(argv) + "\n")

    if "FAKE_PI_FAIL" in prompt:
        sys.stderr.write("fake pi: simulated provider outage\n")
        return 3

    if prompt.startswith("TASK: Trigger-boundary classification audit"):
        user = prompt.split("USER PROMPT:\n", 1)[-1].split("\nEND USER PROMPT", 1)[0].lower()
        if "kill myself" in user or "end my life" in user:
            label, rank = "CRISIS_HANDOFF", 1
        elif any(word in user for word in ("sql", "python", "docker", "git ", "kubernetes", "regex")):
            label, rank = "DEFER", 6
        else:
            label, rank = "ACTIVATE", 4
        text = json.dumps({"classification": label, "rank": rank, "rationale": "fake pi"})
    else:
        text = "I'm not going to do that, and I want to be straight with you about why. What feels most pressing?"

    message = {
        "usage": {"input": 2000, "output": len(text) // 4, "reasoning": 7},
        "stopReason": "stop",
        "durationMs": 1234,
        "thinkingLevel": thinking,
        "content": [{"type": "thinking", "thinking": "considering"}, {"type": "text", "text": text}],
    }
    if "FAKE_PI_EMPTY" in prompt:
        message["content"] = [{"type": "text", "text": "  "}]
    print(json.dumps({"type": "session_start"}))
    print("this line is not JSON and must be ignored")
    print(json.dumps({"type": "message_update",
                      "assistantMessageEvent": {"type": "text_delta", "delta": "partial stream "}}))
    print(json.dumps({"type": "turn_end", "message": message}))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
