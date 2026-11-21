"""Minimal JSON-over-HTTP client for the hosted backends (stdlib only, no dependencies)."""

from __future__ import annotations

import json
import socket
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from .base import BackendConfigError

RETRYABLE_STATUS = (408, 409, 429)


class HttpError(RuntimeError):
    """A request failed for good (non-retryable status, or retries exhausted)."""


def validate_base_url(url: str, env_hint: str) -> str:
    """Accept only http(s) base URLs; strip the trailing slash."""
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise BackendConfigError(f"{env_hint} must be an http(s) URL, got {url!r}")
    return url.rstrip("/")


def parse_extra_body(raw: str | None, env_name: str) -> dict[str, Any]:
    """Parse an optional JSON object from an env var (request-body overrides)."""
    if not raw:
        return {}
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise BackendConfigError(f"{env_name} is not valid JSON: {exc.msg}") from exc
    if not isinstance(value, dict):
        raise BackendConfigError(f"{env_name} must be a JSON object")
    return value


def merge_body(body: dict[str, Any], extra: dict[str, Any]) -> dict[str, Any]:
    """Apply request-body overrides: a `null` value removes the key, anything else replaces it."""
    merged = dict(body)
    for key, value in extra.items():
        if value is None:
            merged.pop(key, None)
        else:
            merged[key] = value
    return merged


def post_json(url: str, headers: dict[str, str], payload: dict[str, Any], timeout: float,
              max_retries: int = 2, backoff: tuple[float, ...] = (2.0, 4.0, 8.0)) -> dict[str, Any]:
    """POST a JSON body and return the decoded JSON reply.

    Retries 408/409/429 and 5xx responses plus connection errors, with backoff.
    Raises `HttpError` otherwise. Credentials only ever travel in `headers` and
    are never echoed into error messages.
    """
    data = json.dumps(payload).encode("utf-8")
    last_error = "request not attempted"
    for attempt in range(max_retries + 1):
        request = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310 - scheme validated
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace").strip()[:400]
            last_error = f"HTTP {exc.code}: {detail}"
            if exc.code not in RETRYABLE_STATUS and exc.code < 500:
                raise HttpError(last_error) from exc
        except (urllib.error.URLError, TimeoutError, socket.timeout, ConnectionError) as exc:
            last_error = f"connection error: {getattr(exc, 'reason', exc)}"
        except json.JSONDecodeError as exc:
            raise HttpError(f"reply was not JSON: {exc.msg}") from exc
        if attempt < max_retries:
            time.sleep(backoff[min(attempt, len(backoff) - 1)] if backoff else 0.0)
    raise HttpError(last_error)
