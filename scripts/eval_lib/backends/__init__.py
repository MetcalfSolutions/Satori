"""Pluggable model backends for the live eval runner.

    pi         `pi -p --model ... --mode json` (the original harness behaviour)
    openai     any OpenAI-compatible `/chat/completions` endpoint, hosted or local (env-gated)
    anthropic  Anthropic Messages API (env-gated)
    mock       offline: fixture replay or built-in reference replies, zero API keys
"""

from __future__ import annotations

import pathlib
from typing import Any

from ..paths import SKILL_PATH
from .base import Backend, BackendConfigError

BACKEND_NAMES = ("pi", "openai", "anthropic", "mock")
DEFAULT_PI_MODEL = "opencode-go/glm-5.3"


def default_model(backend: str) -> str | None:
    """Model id used when --model is omitted (None means the backend requires one)."""
    return {"pi": DEFAULT_PI_MODEL, "mock": "mock"}.get(backend)


def create_backend(name: str, model: str, skill_path: pathlib.Path = SKILL_PATH, **options: Any) -> Backend:
    """Build a backend by name. Raises `BackendConfigError` when its env gate is not satisfied."""
    if name == "pi":
        from .pi import PiBackend

        return PiBackend(model=model, skill_path=skill_path, pi_bin=options.get("pi_bin") or "pi")
    if name == "openai":
        from .openai_compat import OpenAICompatBackend

        return OpenAICompatBackend(model=model, skill_path=skill_path)
    if name == "anthropic":
        from .anthropic_messages import AnthropicBackend

        return AnthropicBackend(model=model, skill_path=skill_path)
    if name == "mock":
        from .mock import MockBackend

        return MockBackend(model=model, skill_path=skill_path, fixtures=options.get("fixtures"),
                           strict=bool(options.get("fixtures_strict")))
    raise BackendConfigError(f"Unknown backend '{name}'. Choose one of: {', '.join(BACKEND_NAMES)}")


__all__ = ["BACKEND_NAMES", "DEFAULT_PI_MODEL", "Backend", "BackendConfigError", "create_backend", "default_model"]
