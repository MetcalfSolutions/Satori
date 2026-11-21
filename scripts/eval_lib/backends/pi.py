"""`pi` CLI backend: one ephemeral `pi -p --mode json` call per case."""

from __future__ import annotations

import json
import pathlib
import subprocess
import time
from typing import Any

from ..paths import ROOT_DIR, SKILL_PATH
from .base import Backend


class PiBackend(Backend):
    """Shells out to `pi -p --model <id> --thinking <level> --mode json` with every extension disabled."""

    name = "pi"

    def __init__(self, model: str, skill_path: pathlib.Path = SKILL_PATH, pi_bin: str = "pi",
                 cwd: pathlib.Path = ROOT_DIR):
        super().__init__(model=model, skill_path=skill_path)
        self.pi_bin = pi_bin
        self.cwd = cwd

    def base_args(self, thinking: str, with_system_prompt: bool = True) -> list[str]:
        args = [
            self.pi_bin, "-p",
            "--model", self.model,
            "--thinking", thinking,
            "--mode", "json",
            "--no-session",
            "--no-tools",
            "--no-mcp",
            "--no-extensions",
            "--no-skills",
            "--no-prompt-templates",
            "--no-themes",
            "--no-context-files",
        ]
        if with_system_prompt:
            args += ["--system-prompt", str(self.skill_path)]
        return args

    def describe(self) -> str:
        return (f"`pi -p --model {self.model} --thinking <low|medium> --mode json --no-session --no-tools "
                f"--system-prompt {self.skill_label}`")

    def call(self, prompt: str, *, thinking: str, timeout: float, with_system_prompt: bool = True,
             meta: dict[str, Any] | None = None) -> dict[str, Any]:
        """Run one ephemeral pi call; parse the --mode json event stream.

        Returns {ok, error, text, thinking, latency_ms, usage, stop_reason, raw_event_count}.
        """
        started = time.monotonic()
        try:
            proc = subprocess.run(
                self.base_args(thinking, with_system_prompt) + ["--", prompt],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=str(self.cwd),
            )
        except subprocess.TimeoutExpired:
            return {"ok": False, "error": f"timeout after {timeout:.0f}s", "latency_ms": None, "usage": None}
        except FileNotFoundError:
            return {"ok": False, "error": f"pi executable not found: {self.pi_bin!r} (install pi or pass --pi-bin)",
                    "latency_ms": None, "usage": None}
        wall_ms = int((time.monotonic() - started) * 1000)

        if proc.returncode != 0:
            return {
                "ok": False,
                "error": f"pi exit {proc.returncode}: {proc.stderr.strip()[:400]}",
                "latency_ms": wall_ms,
                "usage": None,
            }
        return parse_pi_event_stream(proc.stdout, wall_ms)


def parse_pi_event_stream(stdout: str, wall_ms: int) -> dict[str, Any]:
    """Parse a `pi --mode json` event stream into the harness result dict.

    Thinking trace, text, `durationMs` and usage come from the assistant `turn_end`
    message; streamed deltas are the fallback when no final content blocks arrive.
    """
    thinking_parts: list[str] = []
    text_parts: list[str] = []
    usage: dict[str, Any] | None = None
    stop_reason: str | None = None
    duration_ms: int | None = None
    thinking_level: str | None = None
    event_count = 0

    for line in stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        event_count += 1
        etype = event.get("type")

        if etype == "message_update":
            ev = event.get("assistantMessageEvent") or {}
            if ev.get("type") == "thinking_delta":
                thinking_parts.append(ev.get("delta", ""))
            elif ev.get("type") == "text_delta":
                text_parts.append(ev.get("delta", ""))

        elif etype == "turn_end":
            msg = event.get("message") or {}
            usage = msg.get("usage") or usage
            stop_reason = msg.get("stopReason", stop_reason)
            duration_ms = msg.get("durationMs", duration_ms)
            thinking_level = msg.get("thinkingLevel", thinking_level)
            # Prefer the final assembled content blocks over streamed deltas.
            blocks = msg.get("content") or []
            final_think = [b.get("thinking", "") for b in blocks if b.get("type") == "thinking"]
            final_text = [b.get("text", "") for b in blocks if b.get("type") == "text"]
            if final_text:
                text_parts = final_text
            if final_think:
                thinking_parts = final_think

    response_text = "".join(text_parts).strip()
    if not response_text:
        return {
            "ok": False,
            "error": "no assistant text block in pi output",
            "latency_ms": duration_ms or wall_ms,
            "usage": usage,
        }

    return {
        "ok": True,
        "error": None,
        "text": response_text,
        "thinking": "".join(thinking_parts).strip(),
        "latency_ms": duration_ms if duration_ms is not None else wall_ms,
        "usage": usage,
        "stop_reason": stop_reason,
        "thinking_level": thinking_level,
        "raw_event_count": event_count,
    }
