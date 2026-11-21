"""OpenAI-compatible chat-completions backend (hosted APIs and local servers alike).

Works with anything that speaks `POST {base_url}/chat/completions`: api.openai.com,
OpenRouter, vLLM, llama.cpp `llama-server`, Ollama, LM Studio. Env-gated: it only
constructs when a key or an explicit base URL is configured, so it can never be hit
by accident.

    OPENAI_API_KEY   / SATORI_EVAL_OPENAI_API_KEY      bearer token (optional for local servers)
    OPENAI_BASE_URL  / SATORI_EVAL_OPENAI_BASE_URL     default https://api.openai.com/v1
    SATORI_EVAL_OPENAI_REASONING_EFFORT=1              forward --thinking as `reasoning_effort`
    SATORI_EVAL_OPENAI_EXTRA_BODY='{"temperature": 0}'  JSON merged into the request body

The `SATORI_EVAL_*` names win, so the model under test can use different
credentials than the Stage-2 judge.
"""

from __future__ import annotations

import pathlib
import re
import time
from typing import Any

from ..env import get_env_var
from ..paths import SKILL_PATH
from .base import Backend, BackendConfigError
from .http import HttpError, merge_body, parse_extra_body, post_json, validate_base_url

DEFAULT_BASE_URL = "https://api.openai.com/v1"
_INLINE_THINK_RE = re.compile(r"^\s*<think>(.*?)</think>\s*", re.DOTALL)


class OpenAICompatBackend(Backend):
    name = "openai"

    def __init__(self, model: str, skill_path: pathlib.Path = SKILL_PATH):
        super().__init__(model=model, skill_path=skill_path)
        self.api_key = get_env_var("SATORI_EVAL_OPENAI_API_KEY") or get_env_var("OPENAI_API_KEY")
        explicit_base = get_env_var("SATORI_EVAL_OPENAI_BASE_URL") or get_env_var("OPENAI_BASE_URL")
        if not self.api_key and not explicit_base:
            raise BackendConfigError(
                "--backend openai is env-gated: set OPENAI_API_KEY for a hosted API, or OPENAI_BASE_URL "
                "(for example http://localhost:8080/v1) for a local OpenAI-compatible server."
            )
        self.base_url = validate_base_url(explicit_base or DEFAULT_BASE_URL, "OPENAI_BASE_URL")
        self.send_reasoning_effort = (get_env_var("SATORI_EVAL_OPENAI_REASONING_EFFORT") or "").lower() in (
            "1", "true", "yes", "on")
        self.extra_body = parse_extra_body(get_env_var("SATORI_EVAL_OPENAI_EXTRA_BODY"),
                                           "SATORI_EVAL_OPENAI_EXTRA_BODY")
        self.max_retries = 2
        self.retry_backoff: tuple[float, ...] = (2.0, 4.0, 8.0)

    def describe(self) -> str:
        return (f"`POST {self.base_url}/chat/completions` (OpenAI-compatible), model `{self.model}`, "
                f"system prompt `{self.skill_label}`, zero tools")

    def build_body(self, prompt: str, thinking: str, with_system_prompt: bool) -> dict[str, Any]:
        messages: list[dict[str, str]] = []
        if with_system_prompt:
            messages.append({"role": "system", "content": self.skill_text()})
        messages.append({"role": "user", "content": prompt})
        body: dict[str, Any] = {"model": self.model, "messages": messages}
        if self.send_reasoning_effort:
            body["reasoning_effort"] = thinking
        return merge_body(body, self.extra_body)

    def call(self, prompt: str, *, thinking: str, timeout: float, with_system_prompt: bool = True,
             meta: dict[str, Any] | None = None) -> dict[str, Any]:
        headers = {"content-type": "application/json"}
        if self.api_key:
            headers["authorization"] = f"Bearer {self.api_key}"
        started = time.monotonic()
        try:
            reply = post_json(f"{self.base_url}/chat/completions", headers,
                              self.build_body(prompt, thinking, with_system_prompt), timeout,
                              max_retries=self.max_retries, backoff=self.retry_backoff)
        except HttpError as exc:
            return {"ok": False, "error": f"openai backend: {exc}",
                    "latency_ms": int((time.monotonic() - started) * 1000), "usage": None}
        return parse_chat_completion(reply, int((time.monotonic() - started) * 1000), thinking)


def parse_chat_completion(reply: dict[str, Any], wall_ms: int, thinking_level: str) -> dict[str, Any]:
    """Map a chat-completions reply onto the harness result dict."""
    choices = reply.get("choices") or [{}]
    choice = choices[0] if isinstance(choices[0], dict) else {}
    message = choice.get("message") or {}
    content = message.get("content")
    if isinstance(content, list):  # content-part arrays
        content = "".join(part.get("text", "") for part in content
                          if isinstance(part, dict) and part.get("type") in ("text", "output_text"))
    text = content if isinstance(content, str) else ""
    reasoning = message.get("reasoning_content") or message.get("reasoning") or ""
    inline = _INLINE_THINK_RE.match(text)
    if inline:  # local reasoning models often inline their trace
        reasoning = reasoning or inline.group(1).strip()
        text = text[inline.end():]
    text = text.strip()

    raw_usage = reply.get("usage") or {}
    usage = {
        "input": raw_usage.get("prompt_tokens"),
        "output": raw_usage.get("completion_tokens"),
        "reasoning": (raw_usage.get("completion_tokens_details") or {}).get("reasoning_tokens"),
    }
    if not text:
        return {"ok": False, "error": "no assistant text in chat-completions reply", "latency_ms": wall_ms,
                "usage": usage}
    return {
        "ok": True,
        "error": None,
        "text": text,
        "thinking": reasoning if isinstance(reasoning, str) else "",
        "latency_ms": wall_ms,
        "usage": usage,
        "stop_reason": choice.get("finish_reason"),
        "thinking_level": thinking_level,
    }
