"""Environment and API-key lookup (process env, .env files, Windows user registry)."""

from __future__ import annotations

import os
import pathlib
import sys

from .paths import ROOT_DIR


def get_env_var(name: str) -> str | None:
    """Retrieve environment variable from os.environ, .env files, or Windows User Registry."""
    val = os.environ.get(name)
    if val:
        return val
    for p in [ROOT_DIR / ".env", pathlib.Path.home() / ".env"]:
        if p.exists():
            try:
                for line in p.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if line.startswith(f"{name}="):
                        return line.split("=", 1)[1].strip().strip('"').strip("'")
            except Exception:
                pass
    if sys.platform == "win32":
        try:
            import winreg

            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Environment") as key:
                v, _ = winreg.QueryValueEx(key, name)
                if v:
                    return str(v)
        except Exception:
            pass
    return None


def has_any_api_key() -> bool:
    return bool(
        get_env_var("ANTHROPIC_API_KEY")
        or get_env_var("GEMINI_API_KEY")
        or get_env_var("GOOGLE_API_KEY")
        or get_env_var("OPENAI_API_KEY")
        or get_env_var("GROK_API_KEY")
    )
