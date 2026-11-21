"""Anthropic Messages API backend (raw HTTP on purpose: this repo ships with zero Python dependencies).

Env-gated: it only constructs when a credential is configured.

    ANTHROPIC_API_KEY   / SATORI_EVAL_ANTHROPIC_API_KEY    sent as `x-api-key`
    ANTHROPIC_AUTH_TOKEN                                   OAuth token, sent as `Authorization: Bearer`
    ANTHROPIC_BASE_URL  / SATORI_EVAL_ANTHROPIC_BASE_URL   default https://api.anthropic.com
    SATORI_EVAL_ANTHROPIC_VERSION                          default 2026-10-21
    SATORI_EVAL_ANTHROPIC_EXTRA_BODY                       JSON merged into the request body

Request shape (current model families):

    {"model": ..., "max_tokens": 16000, "system": <skill file>,
     "messages": [{"role": "user", "content": <prompt>}],
     "thinking": {"type": "adaptive", "display": "summarized"},
     "output_config": {"effort": <--thinking level>}}

No sampling parameters are sent (the 2026-10-21 API rejects them). Older models
that need a different thinking shape can drop or replace the defaults, e.g.
`SATORI_EVAL_ANTHROPIC_EXTRA_BODY='{"thinking": null, "output_config": null}'`.

Server-side refusal fallbacks are deliberately NOT enabled: an eval must score the
model that was asked for, never a silent substitute. An API-level refusal
(`stop_reason: "refusal"`) is returned as an empty reply with `api_refusal` set,
which the detectors score like any other reply.
"""

from __future__ import annotations

import pathlib
import time
from typing import Any

from ..env import get_env_var
from ..paths import SKILL_PATH
from .base import Backend, BackendConfigError
from .http import HttpError, merge_body, parse_extra_body, post_json, validate_base_url

DEFAULT_BASE_URL = "https://api.anthropic.com"
DEFAULT_API_VERSION = "2026-10-21"
DEFAULT_MAX_TOKENS = 16000
OAUTH_BETA = "oauth-2025-04-20"


class AnthropicBackend(Backend):
    name = "anthropic"

    def __init__(self, model: str, skill_path: pathlib.Path = SKILL_PATH):
        super().__init__(model=model, skill_path=skill_path)
        self.api_key = get_env_var("SATORI_EVAL_ANTHROPIC_API_KEY") or get_env_var("ANTHROPIC_API_KEY")
        self.auth_token = None if self.api_key else get_env_var("ANTHROPIC_AUTH_TOKEN")
        if not self.api_key and not self.auth_token:
            raise BackendConfigError(
                "--backend anthropic is env-gated: set ANTHROPIC_API_KEY (or ANTHROPIC_AUTH_TOKEN) first."
            )
        self.base_url = validate_base_url(
            get_env_var("SATORI_EVAL_ANTHROPIC_BASE_URL") or get_env_var("ANTHROPIC_BASE_URL") or DEFAULT_BASE_URL,
            "ANTHROPIC_BASE_URL",
        )
        self.api_version = get_env_var("SATORI_EVAL_ANTHROPIC_VERSION") or DEFAULT_API_VERSION
        self.extra_body = parse_extra_body(get_env_var("SATORI_EVAL_ANTHROPIC_EXTRA_BODY"),
                                           "SATORI_EVAL_ANTHROPIC_EXTRA_BODY")
        self.max_retries = 2
        self.retry_backoff: tuple[float, ...] = (2.0, 4.0, 8.0)

    def describe(self) -> str:
        return (f"`POST {self.base_url}/v1/messages` (anthropic-version {self.api_version}), model `{self.model}`, "
                f"system prompt `{self.skill_label}`, zero tools")

    def headers(self) -> dict[str, str]:
        headers = {"content-type": "application/json", "anthropic-version": self.api_version}
        if self.api_key:
            headers["x-api-key"] = self.api_key
        else:
            headers["authorization"] = f"Bearer {self.auth_token}"
            headers["anthropic-beta"] = OAUTH_BETA
        return headers

    def build_body(self, prompt: str, thinking: str, with_system_prompt: bool) -> dict[str, Any]:
        body: dict[str, Any] = {
            "model": self.model,
            "max_tokens": DEFAULT_MAX_TOKENS,
            "messages": [{"role": "user", "content": prompt}],
            "thinking": {"type": "adaptive", "display": "summarized"},
            "output_config": {"effort": thinking},
        }
        if with_system_prompt:
            body["system"] = self.skill_text()
        return merge_body(body, self.extra_body)

    def call(self, prompt: str, *, thinking: str, timeout: float, with_system_prompt: bool = True,
             meta: dict[str, Any] | None = None) -> dict[str, Any]:
        started = time.monotonic()
        try:
            reply = post_json(f"{self.base_url}/v1/messages", self.headers(),
                              self.build_body(prompt, thinking, with_system_prompt), timeout,
                              max_retries=self.max_retries, backoff=self.retry_backoff)
        except HttpError as exc:
            return {"ok": False, "error": f"anthropic backend: {exc}",
                    "latency_ms": int((time.monotonic() - started) * 1000), "usage": None}
        return parse_message(reply, int((time.monotonic() - started) * 1000), thinking)


def parse_message(reply: dict[str, Any], wall_ms: int, thinking_level: str) -> dict[str, Any]:
    """Map a Messages API reply onto the harness result dict."""
    blocks = [b for b in (reply.get("content") or []) if isinstance(b, dict)]
    text = "".join(b.get("text", "") for b in blocks if b.get("type") == "text").strip()
    thinking = "".join(b.get("thinking", "") for b in blocks if b.get("type") == "thinking").strip()
    raw_usage = reply.get("usage") or {}
    usage = {"input": raw_usage.get("input_tokens"), "output": raw_usage.get("output_tokens"), "reasoning": None}
    stop_reason = reply.get("stop_reason")

    result: dict[str, Any] = {
        "ok": True,
        "error": None,
        "text": text,
        "thinking": thinking,
        "latency_ms": wall_ms,
        "usage": usage,
        "stop_reason": stop_reason,
        "thinking_level": thinking_level,
    }
    if stop_reason == "refusal":
        details = reply.get("stop_details") or {}
        result["api_refusal"] = {"category": details.get("category"), "explanation": details.get("explanation")}
        return result
    if not text:
        return {"ok": False, "error": f"no text block in Messages reply (stop_reason={stop_reason})",
                "latency_ms": wall_ms, "usage": usage}
    return result
