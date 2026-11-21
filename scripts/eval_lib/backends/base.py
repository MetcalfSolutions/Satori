"""Backend contract shared by every model provider.

A backend turns one prompt into one result dict. Results are plain dicts (not
classes) because they are written verbatim into the JSONL checkpoint files:

    {
      "ok": bool,                 # False = the call itself failed; retried on resume
      "error": str | None,
      "text": str,                # the assistant reply the detectors score
      "thinking": str,            # reasoning trace or summary, "" when unavailable
      "latency_ms": int | None,
      "usage": {"input": int, "output": int, "reasoning": int} | None,
      "stop_reason": str | None,
      "thinking_level": str | None,
    }

Backends never raise for provider errors: a failed call is `{"ok": False, "error": ...}`
so one bad case cannot sink a 350-case suite.
"""

from __future__ import annotations

import pathlib
from typing import Any

from ..paths import ROOT_DIR, SKILL_PATH


class BackendConfigError(RuntimeError):
    """A backend cannot be constructed (missing env gate, bad URL, missing model id)."""


class Backend:
    """Base class: holds the model id and the skill file sent as the system prompt."""

    name = "base"
    # Written into every report so mock output can never be mistaken for live evidence.
    evaluation_mode = "live"

    def __init__(self, model: str, skill_path: pathlib.Path = SKILL_PATH):
        self.model = model
        self.skill_path = pathlib.Path(skill_path)
        self._skill_text: str | None = None

    @property
    def skill_label(self) -> str:
        """Skill path as shown in reports: repo-relative when inside the repo."""
        try:
            return self.skill_path.resolve().relative_to(ROOT_DIR).as_posix()
        except ValueError:
            return str(self.skill_path)

    def skill_text(self) -> str:
        if self._skill_text is None:
            self._skill_text = self.skill_path.read_text(encoding="utf-8")
        return self._skill_text

    def describe(self) -> str:
        """One-line, human-readable description of how the model is invoked (for reports)."""
        return f"`{self.name}` backend, model `{self.model}`"

    def call(self, prompt: str, *, thinking: str, timeout: float, with_system_prompt: bool = True,
             meta: dict[str, Any] | None = None) -> dict[str, Any]:
        """Send one prompt. `meta` carries {suite, case_id, kind, case} for backends that replay fixtures."""
        raise NotImplementedError
