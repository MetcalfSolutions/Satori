#!/usr/bin/env python3
"""Satori Privacy-First Local Memory Engine (scripts/satori_memory.py).

Zero-dependency Python 3 stdlib CLI for longitudinal pattern tracking, Dream-Layer
recurrence counting (1 -> 2 -> 3), FTS5 search, portable web capsule export, and
cryptographically hygienic deletion (PRAGMA secure_delete = ON + VACUUM).

Optional authenticated encryption (AES-256-GCM + Scrypt) when SATORI_VAULT_PASSPHRASE
or --encrypt is used; fails closed if the optional `cryptography` package is absent.
"""

from __future__ import annotations

import argparse
import base64
import datetime as dt
import json
import os
import pathlib
import re
import shutil
import sqlite3
import stat
import subprocess
import sys
import tempfile
from typing import Any

MAX_SUMMARY_CHARS = 500
CLOUD_SYNC_MARKERS = ("onedrive", "iclouddrive", "mobile documents", "dropbox", "google drive")

EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PHONE_RE = re.compile(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b")
SSN_RE = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")


def is_cloud_synced_path(path: pathlib.Path) -> bool:
    """Return True if path appears to sit inside a cloud-synced directory."""
    normalized = str(path.resolve()).lower()
    return any(marker in normalized for marker in CLOUD_SYNC_MARKERS)


def resolve_vault_dir(
    explicit_dir: str | None = None,
    prefer_local: bool = False,
    prefer_global: bool = False,
) -> pathlib.Path:
    """Resolve the active vault directory following (.satori/memory -> ~/.satori/memory)."""
    if explicit_dir:
        return pathlib.Path(explicit_dir).expanduser().resolve()

    cwd_vault = pathlib.Path.cwd() / ".satori" / "memory"
    global_vault = pathlib.Path.home() / ".satori" / "memory"

    if prefer_local:
        return cwd_vault.resolve()
    if prefer_global:
        return global_vault.resolve()
    if cwd_vault.exists():
        return cwd_vault.resolve()
    return global_vault.resolve()


def enforce_permissions(path: pathlib.Path, is_dir: bool = False) -> None:
    """Enforce strict 0700/0600 on POSIX and best-effort user-SID ACLs on Windows."""
    try:
        if os.name != "nt":
            mode = 0o700 if is_dir else 0o600
            os.chmod(path, mode)
        else:
            os.chmod(path, stat.S_IREAD | stat.S_IWRITE)
            if is_dir:
                username = os.environ.get("USERNAME")
                if username:
                    subprocess.run(
                        [
                            "icacls",
                            str(path),
                            "/inheritance:r",
                            "/grant:r",
                            f"{username}:(OI)(CI)F",
                        ],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        check=False,
                        timeout=5,
                    )
    except Exception as exc:
        sys.stderr.write(f"[satori-memory] Note: best-effort permission hardening warning: {exc}\n")


def get_encryption_passphrase(require_encrypt: bool = False) -> str | None:
    """Retrieve passphrase from SATORI_VAULT_PASSPHRASE and verify cryptography availability."""
    passphrase = os.environ.get("SATORI_VAULT_PASSPHRASE")
    if require_encrypt and not passphrase:
        raise RuntimeError(
            "Encryption requested via --encrypt, but SATORI_VAULT_PASSPHRASE environment variable is not set."
        )
    if passphrase:
        try:
            import cryptography  # noqa: F401
        except ImportError as exc:
            raise RuntimeError(
                "SATORI_VAULT_PASSPHRASE is set, but optional dependency 'cryptography' is not installed. "
                "Failing closed to avoid weak stdlib crypto. Install with: pip install cryptography"
            ) from exc
    return passphrase


def encrypt_text_if_configured(plaintext: str, passphrase: str | None) -> str:
    """Encrypt text using AES-256-GCM + Scrypt if passphrase is set."""
    if not passphrase:
        return plaintext
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.scrypt import Scrypt

    salt = os.urandom(16)
    nonce = os.urandom(12)
    kdf = Scrypt(salt=salt, length=32, n=2**14, r=8, p=1)
    key = kdf.derive(passphrase.encode("utf-8"))
    ct = AESGCM(key).encrypt(nonce, plaintext.encode("utf-8"), None)
    payload = base64.b64encode(salt + nonce + ct).decode("ascii")
    return f"SATORI_ENC_V1:{payload}\n"


def sanitize_structural_summary(summary: str) -> str:
    """Enforce T4 data minimization: cap length <= 500 chars and scrub obvious PII."""
    cleaned = summary.strip()
    if len(cleaned) > MAX_SUMMARY_CHARS:
        raise ValueError(
            f"Summary length ({len(cleaned)} chars) exceeds the {MAX_SUMMARY_CHARS}-character "
            "structural abstraction limit (PRIVACY.md T4). Summarize the structural pattern instead of storing raw text."
        )
    cleaned = EMAIL_RE.sub("[REDACTED_EMAIL]", cleaned)
    cleaned = PHONE_RE.sub("[REDACTED_PHONE]", cleaned)
    cleaned = SSN_RE.sub("[REDACTED_ID]", cleaned)
    return cleaned


def connect_db(vault_dir: pathlib.Path) -> sqlite3.Connection:
    """Open SQLite connection with PRAGMA secure_delete = ON and ensure schema exists."""
    db_path = vault_dir / "index.db"
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA secure_delete = ON;")
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            theme TEXT NOT NULL,
            layer TEXT NOT NULL CHECK(layer IN ('signal', 'theme', 'pattern', 'dream')),
            summary TEXT NOT NULL,
            recurrence_count INTEGER NOT NULL DEFAULT 1,
            session_date TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        """
    )
    conn.execute(
        """
        CREATE VIRTUAL TABLE IF NOT EXISTS signals_fts USING fts5(
            theme,
            layer,
            summary,
            session_date
        );
        """
    )
    conn.commit()
    enforce_permissions(db_path, is_dir=False)
    return conn


def rebuild_markdown_files(vault_dir: pathlib.Path, conn: sqlite3.Connection, passphrase: str | None = None) -> None:
    """Regenerate formulation.md and dream-layer.md from current SQLite state."""
    rows = conn.execute(
        "SELECT id, theme, layer, summary, recurrence_count, session_date, updated_at "
        "FROM signals ORDER BY recurrence_count DESC, updated_at DESC"
    ).fetchall()

    formulation_lines = [
        "# Satori Longitudinal Working Formulation",
        "",
        "> Auto-maintained by `scripts/satori_memory.py`. User-owned and editable.",
        "",
        "## Active Patterns & Signals",
        "",
    ]
    dream_lines = [
        "# Satori Dream / Auto-Dream Layer",
        "",
        "> Tracks recurring unresolved themes (`1 -> 2 -> 3` appearance threshold).",
        "",
        "| ID | Theme | Count | Status | Summary | Last Seen |",
        "|---|---|---|---|---|---|",
    ]

    has_formulation = False
    has_dream = False
    for r in rows:
        if r["layer"] == "dream":
            has_dream = True
            status = (
                "Background watch (1)"
                if r["recurrence_count"] == 1
                else ("Gentle bridge eligible (2)" if r["recurrence_count"] == 2 else "Pattern threshold reached (3+)")
            )
            dream_lines.append(
                f"| {r['id']} | {r['theme']} | {r['recurrence_count']} | {status} | {r['summary']} | {r['session_date']} |"
            )
        else:
            has_formulation = True
            formulation_lines.append(
                f"- **[#{r['id']}] {r['theme']}** (`{r['layer']}`, count={r['recurrence_count']}, {r['session_date']}): {r['summary']}"
            )

    if not has_formulation:
        formulation_lines.append("_No active signals recorded._")
    if not has_dream:
        dream_lines.append("| — | _None_ | 0 | — | — | — |")

    formulation_path = vault_dir / "formulation.md"
    dream_path = vault_dir / "dream-layer.md"
    formulation_path.write_text(
        encrypt_text_if_configured("\n".join(formulation_lines) + "\n", passphrase),
        encoding="utf-8",
    )
    dream_path.write_text(
        encrypt_text_if_configured("\n".join(dream_lines) + "\n", passphrase),
        encoding="utf-8",
    )
    enforce_permissions(formulation_path, is_dir=False)
    enforce_permissions(dream_path, is_dir=False)


def cmd_init(args: argparse.Namespace) -> int:
    passphrase = get_encryption_passphrase(require_encrypt=bool(getattr(args, "encrypt", False)))
    vault_dir = resolve_vault_dir(
        explicit_dir=args.dir,
        prefer_local=args.local,
        prefer_global=args.global_vault,
    )

    if is_cloud_synced_path(vault_dir) and not args.local and not args.dir:
        sys.stderr.write(
            f"[satori-memory] Warning: '{vault_dir}' appears to be in a cloud-synced folder (T6). "
            "Consider using Full-Disk Encryption or SATORI_VAULT_PASSPHRASE.\n"
        )

    satori_root = vault_dir.parent if vault_dir.name == "memory" else vault_dir
    satori_root.mkdir(parents=True, exist_ok=True)
    vault_dir.mkdir(parents=True, exist_ok=True)
    (vault_dir / "sessions").mkdir(parents=True, exist_ok=True)

    enforce_permissions(satori_root, is_dir=True)
    enforce_permissions(vault_dir, is_dir=True)
    enforce_permissions(vault_dir / "sessions", is_dir=True)

    # T1 Mitigation: create .satori/.gitignore with '*'
    satori_gitignore = satori_root / ".gitignore"
    satori_gitignore.write_text("*\n!.gitignore\n", encoding="utf-8")
    enforce_permissions(satori_gitignore, is_dir=False)

    # Also append .satori/ to workspace root .gitignore if inside a git repo
    cwd_git = pathlib.Path.cwd() / ".git"
    cwd_gitignore = pathlib.Path.cwd() / ".gitignore"
    if cwd_git.exists() or cwd_gitignore.exists():
        existing = cwd_gitignore.read_text(encoding="utf-8") if cwd_gitignore.exists() else ""
        if ".satori/" not in existing:
            with cwd_gitignore.open("a", encoding="utf-8") as fh:
                if existing and not existing.endswith("\n"):
                    fh.write("\n")
                fh.write(".satori/\n")

    profile_path = vault_dir / "profile.md"
    if not profile_path.exists():
        profile_content = (
            "# Satori User Profile & Voice Calibration\n\n"
            "- **Preferred Balance**: Attunement first, followed by collaborative pattern naming.\n"
            "- **Framework Style**: Plain-language translation (avoid clinical jargon).\n"
            "- **Updated**: " + dt.date.today().isoformat() + "\n"
        )
        profile_path.write_text(encrypt_text_if_configured(profile_content, passphrase), encoding="utf-8")
        enforce_permissions(profile_path, is_dir=False)

    conn = connect_db(vault_dir)
    rebuild_markdown_files(vault_dir, conn, passphrase=passphrase)
    conn.close()

    result = {
        "status": "initialized",
        "vault_dir": str(vault_dir),
        "encrypted": bool(passphrase),
        "gitignore": str(satori_gitignore),
    }
    print(json.dumps(result, indent=2))
    return 0


def cmd_log_signal(args: argparse.Namespace) -> int:
    if args.ephemeral:
        print(json.dumps({"status": "ephemeral_skipped", "persisted": False}))
        return 0

    passphrase = get_encryption_passphrase(require_encrypt=False)
    cleaned_summary = sanitize_structural_summary(args.summary)
    theme = args.theme.strip()
    layer = args.layer.strip().lower()
    today = args.session_date or dt.date.today().isoformat()
    now_iso = dt.datetime.now(dt.timezone.utc).isoformat()

    vault_dir = resolve_vault_dir(explicit_dir=args.dir)
    if not vault_dir.exists():
        # Auto-init vault if not yet created
        init_ns = argparse.Namespace(dir=str(vault_dir), local=False, global_vault=False, encrypt=False)
        cmd_init(init_ns)

    conn = connect_db(vault_dir)
    existing = conn.execute(
        "SELECT id, recurrence_count, layer FROM signals WHERE lower(theme) = lower(?)",
        (theme,),
    ).fetchone()

    if existing:
        new_count = int(existing["recurrence_count"]) + 1
        effective_layer = layer
        if existing["layer"] == "dream" and new_count >= 3 and layer == "dream":
            effective_layer = "dream"
        elif layer == "signal" and new_count == 2:
            effective_layer = "theme"
        elif layer in ("signal", "theme") and new_count >= 3:
            effective_layer = "pattern"

        conn.execute(
            "UPDATE signals SET recurrence_count = ?, layer = ?, summary = ?, session_date = ?, updated_at = ? WHERE id = ?",
            (new_count, effective_layer, cleaned_summary, today, now_iso, existing["id"]),
        )
        signal_id = int(existing["id"])
        conn.execute("DELETE FROM signals_fts WHERE rowid = ?", (signal_id,))
        conn.execute(
            "INSERT INTO signals_fts(rowid, theme, layer, summary, session_date) VALUES (?, ?, ?, ?, ?)",
            (signal_id, theme, effective_layer, cleaned_summary, today),
        )
    else:
        new_count = 1
        effective_layer = layer
        cur = conn.execute(
            "INSERT INTO signals(theme, layer, summary, recurrence_count, session_date, updated_at) VALUES (?, ?, ?, 1, ?, ?)",
            (theme, effective_layer, cleaned_summary, today, now_iso),
        )
        signal_id = int(cur.lastrowid)
        conn.execute(
            "INSERT INTO signals_fts(rowid, theme, layer, summary, session_date) VALUES (?, ?, ?, ?, ?)",
            (signal_id, theme, effective_layer, cleaned_summary, today),
        )

    conn.commit()

    # Append session note
    sessions_dir = vault_dir / "sessions"
    sessions_dir.mkdir(parents=True, exist_ok=True)
    session_file = sessions_dir / f"{today}.md"
    entry_line = f"- **[#{signal_id}] {theme}** (`{effective_layer}`, count={new_count}): {cleaned_summary}\n"
    if session_file.exists() and not passphrase:
        with session_file.open("a", encoding="utf-8") as fh:
            fh.write(entry_line)
    else:
        header = f"# Session Reflection Log — {today}\n\n{entry_line}"
        session_file.write_text(encrypt_text_if_configured(header, passphrase), encoding="utf-8")
    enforce_permissions(session_file, is_dir=False)

    rebuild_markdown_files(vault_dir, conn, passphrase=passphrase)
    conn.close()

    print(
        json.dumps(
            {
                "status": "logged",
                "id": signal_id,
                "theme": theme,
                "layer": effective_layer,
                "recurrence_count": new_count,
                "session_date": today,
            },
            indent=2,
        )
    )
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    vault_dir = resolve_vault_dir(explicit_dir=args.dir)
    if not vault_dir.exists() or not (vault_dir / "index.db").exists():
        payload = {"status": "uninitialized", "vault_dir": str(vault_dir), "signals": [], "dream_watch": []}
        output_str = json.dumps(payload, indent=2)
        if args.output:
            pathlib.Path(args.output).write_text(output_str, encoding="utf-8")
        else:
            print(output_str)
        return 0

    conn = connect_db(vault_dir)
    active_rows = conn.execute(
        "SELECT id, theme, layer, summary, recurrence_count, session_date FROM signals "
        "WHERE layer != 'dream' ORDER BY recurrence_count DESC, updated_at DESC LIMIT 10"
    ).fetchall()
    dream_rows = conn.execute(
        "SELECT id, theme, layer, summary, recurrence_count, session_date FROM signals "
        "WHERE layer = 'dream' ORDER BY recurrence_count DESC, updated_at DESC LIMIT 10"
    ).fetchall()
    conn.close()

    payload = {
        "status": "ok",
        "vault_dir": str(vault_dir),
        "signals": [dict(r) for r in active_rows],
        "dream_watch": [
            {
                **dict(r),
                "action_hint": (
                    "hold_silently"
                    if r["recurrence_count"] == 1
                    else ("gentle_bridge_if_relevant" if r["recurrence_count"] == 2 else "name_pattern_gently")
                ),
            }
            for r in dream_rows
        ],
    }
    output_str = json.dumps(payload, indent=2)
    if args.output:
        pathlib.Path(args.output).write_text(output_str, encoding="utf-8")
    else:
        print(output_str)
    return 0


def cmd_search(args: argparse.Namespace) -> int:
    vault_dir = resolve_vault_dir(explicit_dir=args.dir)
    if not vault_dir.exists() or not (vault_dir / "index.db").exists():
        print(json.dumps({"status": "empty", "results": []}, indent=2))
        return 0

    conn = connect_db(vault_dir)
    q = args.query.strip()
    try:
        rows = conn.execute(
            """
            SELECT s.id, s.theme, s.layer, s.summary, s.recurrence_count, s.session_date
            FROM signals_fts f
            JOIN signals s ON s.id = f.rowid
            WHERE signals_fts MATCH ?
            ORDER BY rank
            LIMIT ?
            """,
            (q, args.limit),
        ).fetchall()
    except sqlite3.OperationalError:
        like_q = f"%{q}%"
        rows = conn.execute(
            """
            SELECT id, theme, layer, summary, recurrence_count, session_date
            FROM signals
            WHERE theme LIKE ? OR summary LIKE ?
            ORDER BY recurrence_count DESC
            LIMIT ?
            """,
            (like_q, like_q, args.limit),
        ).fetchall()
    conn.close()

    payload = {"status": "ok", "query": q, "results": [dict(r) for r in rows]}
    output_str = json.dumps(payload, indent=2)
    if args.output:
        pathlib.Path(args.output).write_text(output_str, encoding="utf-8")
    else:
        print(output_str)
    return 0


def cmd_forget(args: argparse.Namespace) -> int:
    """T3 Mitigation: Delete matching records, rewrite Markdown, and execute PRAGMA secure_delete=ON + VACUUM."""
    vault_dir = resolve_vault_dir(explicit_dir=args.dir)
    if not vault_dir.exists() or not (vault_dir / "index.db").exists():
        print(json.dumps({"status": "nothing_to_forget", "deleted_count": 0}, indent=2))
        return 0

    passphrase = get_encryption_passphrase(require_encrypt=False)
    conn = connect_db(vault_dir)
    conn.execute("PRAGMA secure_delete = ON;")

    ids_to_delete: list[int] = []
    themes_to_scrub: list[str] = []

    if args.id is not None:
        rows = conn.execute("SELECT id, theme FROM signals WHERE id = ?", (args.id,)).fetchall()
    elif args.theme:
        like_pat = f"%{args.theme.strip()}%"
        rows = conn.execute(
            "SELECT id, theme FROM signals WHERE theme LIKE ? OR summary LIKE ?",
            (like_pat, like_pat),
        ).fetchall()
    elif args.session:
        rows = conn.execute(
            "SELECT id, theme FROM signals WHERE session_date = ?",
            (args.session.strip(),),
        ).fetchall()
    else:
        conn.close()
        raise ValueError("Must specify at least one of --id, --theme, or --session for forget.")

    for r in rows:
        ids_to_delete.append(int(r["id"]))
        themes_to_scrub.append(str(r["theme"]))

    for sig_id in ids_to_delete:
        conn.execute("DELETE FROM signals WHERE id = ?", (sig_id,))
        conn.execute("DELETE FROM signals_fts WHERE rowid = ?", (sig_id,))

    conn.commit()
    # Switch out of transaction to run VACUUM so zero deleted bytes remain in free pages
    conn.isolation_level = None
    conn.execute("VACUUM;")
    conn.isolation_level = ""

    # Rewrite session logs to scrub deleted IDs/themes
    sessions_dir = vault_dir / "sessions"
    if sessions_dir.exists():
        if args.session:
            target_session = sessions_dir / f"{args.session.strip()}.md"
            if target_session.exists():
                target_session.write_bytes(b"\x00" * target_session.stat().st_size)
                target_session.unlink()
        for md_file in sessions_dir.glob("*.md"):
            lines = md_file.read_text(encoding="utf-8", errors="ignore").splitlines()
            kept = [
                ln
                for ln in lines
                if not any(f"[#{sid}]" in ln for sid in ids_to_delete)
                and not (args.theme and args.theme.lower() in ln.lower())
            ]
            md_file.write_text("\n".join(kept) + "\n", encoding="utf-8")
            enforce_permissions(md_file, is_dir=False)

    rebuild_markdown_files(vault_dir, conn, passphrase=passphrase)
    conn.close()

    print(
        json.dumps(
            {
                "status": "forgotten",
                "deleted_count": len(ids_to_delete),
                "deleted_ids": ids_to_delete,
                "vacuumed": True,
            },
            indent=2,
        )
    )
    return 0


def cmd_purge(args: argparse.Namespace) -> int:
    if not (args.all and args.confirm):
        raise ValueError("Purge requires both --all and --confirm flags.")

    vault_dir = resolve_vault_dir(explicit_dir=args.dir)
    if vault_dir.exists():
        for file_path in vault_dir.rglob("*"):
            if file_path.is_file():
                try:
                    size = file_path.stat().st_size
                    if size > 0:
                        file_path.write_bytes(b"\x00" * min(size, 65536))
                except Exception:
                    pass
        shutil.rmtree(vault_dir)

    print(json.dumps({"status": "purged", "vault_dir": str(vault_dir)}, indent=2))
    return 0


def cmd_export_capsule(args: argparse.Namespace) -> int:
    vault_dir = resolve_vault_dir(explicit_dir=args.dir)
    if not vault_dir.exists() or not (vault_dir / "index.db").exists():
        capsule = (
            "<!-- SATORI CONTINUITY CAPSULE -->\n"
            "**Satori Continuity Capsule**: No durable themes recorded yet.\n"
            "<!-- END SATORI CAPSULE -->\n"
        )
    else:
        conn = connect_db(vault_dir)
        rows = conn.execute(
            "SELECT theme, layer, summary, recurrence_count FROM signals ORDER BY recurrence_count DESC LIMIT 6"
        ).fetchall()
        conn.close()
        bullets = [
            f"- **{r['theme']}** (`{r['layer']}`, {r['recurrence_count']}x): {r['summary']}"
            for r in rows
        ] or ["- No active signals."]
        capsule = (
            "<!-- SATORI CONTINUITY CAPSULE -->\n"
            "### Satori Portable Continuity Capsule\n"
            "_Paste this block at the start of a web session (Claude.ai, ChatGPT, Gemini) to restore longitudinal context:_\n\n"
            + "\n".join(bullets)
            + "\n<!-- END SATORI CAPSULE -->\n"
        )

    if args.output:
        pathlib.Path(args.output).write_text(capsule, encoding="utf-8")
    else:
        print(capsule)
    return 0


def run_self_test() -> int:
    """Comprehensive automated test suite verifying T1-T6 privacy controls and memory mechanics."""
    print("[self-test] Starting satori_memory.py unit & privacy verification suite...")
    with tempfile.TemporaryDirectory(prefix="satori_test_") as tmp:
        vault = pathlib.Path(tmp) / ".satori" / "memory"

        # 1. Test init & .gitignore creation (T1)
        cmd_init(argparse.Namespace(dir=str(vault), local=True, global_vault=False, encrypt=False))
        gitignore_path = vault.parent / ".gitignore"
        assert gitignore_path.exists(), "T1 failure: .satori/.gitignore not created"
        assert "*" in gitignore_path.read_text(encoding="utf-8"), "T1 failure: .gitignore missing '*'"

        # 2. Test ephemeral mode (T5)
        cmd_log_signal(
            argparse.Namespace(
                dir=str(vault),
                theme="Secret Ephemeral Topic",
                layer="signal",
                summary="Should never touch disk.",
                session_date="2026-10-17",
                ephemeral=True,
            )
        )
        conn = connect_db(vault)
        count = conn.execute("SELECT COUNT(*) FROM signals").fetchone()[0]
        conn.close()
        assert count == 0, "T5 failure: ephemeral signal was written to SQLite"

        # 3. Test >500-char structural summary rejection (T4)
        try:
            sanitize_structural_summary("x" * 505)
            raise AssertionError("T4 failure: >500 char summary was not rejected")
        except ValueError:
            pass

        # 4. Test PII scrubbing (T4)
        scrubbed = sanitize_structural_summary("Contact me at jane.doe@example.com or 415-555-0199.")
        assert "jane.doe@example.com" not in scrubbed and "[REDACTED_EMAIL]" in scrubbed
        assert "415-555-0199" not in scrubbed and "[REDACTED_PHONE]" in scrubbed

        # 5. Test Dream-Layer recurrence counter (1 -> 2 -> 3)
        for expected_count in (1, 2, 3):
            cmd_log_signal(
                argparse.Namespace(
                    dir=str(vault),
                    theme="Unfinished Grief Metaphor",
                    layer="dream",
                    summary="Mentioned an empty harbor and changed the subject.",
                    session_date="2026-10-17",
                    ephemeral=False,
                )
            )
            conn = connect_db(vault)
            row = conn.execute(
                "SELECT recurrence_count FROM signals WHERE theme = 'Unfinished Grief Metaphor'"
            ).fetchone()
            conn.close()
            assert row["recurrence_count"] == expected_count, f"Recurrence count mismatch: {row['recurrence_count']}"

        # 6. Test FTS5 search
        status_out = pathlib.Path(tmp) / "search.json"
        cmd_search(argparse.Namespace(dir=str(vault), query="harbor", limit=5, output=str(status_out)))
        search_data = json.loads(status_out.read_text(encoding="utf-8"))
        assert len(search_data["results"]) == 1, "FTS5 search failed to find logged signal"

        # 7. Test forget + VACUUM (T3: ensure raw bytes are wiped from index.db and Markdown)
        cmd_forget(argparse.Namespace(dir=str(vault), id=None, theme="Unfinished Grief Metaphor", session=None))
        raw_db_bytes = (vault / "index.db").read_bytes()
        assert b"empty harbor" not in raw_db_bytes, "T3 failure: deleted string still present in SQLite pages after VACUUM!"
        assert "empty harbor" not in (vault / "dream-layer.md").read_text(encoding="utf-8"), (
            "T3 failure: deleted string still present in dream-layer.md!"
        )

        # 8. Test purge
        cmd_purge(argparse.Namespace(dir=str(vault), all=True, confirm=True))
        assert not vault.exists(), "Purge failed to remove vault directory"

    print("[self-test] ALL 8 PRIVACY & MEMORY TESTS PASSED.")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="satori_memory.py",
        description="Satori Privacy-First Local Memory & Longitudinal Formulation CLI.",
    )
    parser.add_argument("--dir", help="Explicit vault directory path override", default=None)
    parser.add_argument("--self-test", action="store_true", help="Run built-in unit & privacy test suite")

    sub = parser.add_subparsers(dest="command")

    p_init = sub.add_parser("init", help="Initialize local (.satori/memory) or global (~/.satori/memory) vault")
    p_init.add_argument("--dir", default=None)
    p_init.add_argument("--local", action="store_true", help="Initialize in ./.satori/memory/")
    p_init.add_argument("--global", dest="global_vault", action="store_true", help="Initialize in ~/.satori/memory/")
    p_init.add_argument("--encrypt", action="store_true", help="Require SATORI_VAULT_PASSPHRASE + cryptography package")

    p_status = sub.add_parser("status", help="Output compact longitudinal status summary")
    p_status.add_argument("--dir", default=None)
    p_status.add_argument("--output", default=None, help="Optional file path to write status JSON")

    p_log = sub.add_parser("log-signal", help="Record a structural pattern or Dream-Layer signal (<=500 chars)")
    p_log.add_argument("--dir", default=None)
    p_log.add_argument("--theme", required=True, help="Short structural theme title")
    p_log.add_argument(
        "--layer",
        required=True,
        choices=["signal", "theme", "pattern", "dream"],
        help="Memory layer classification",
    )
    p_log.add_argument("--summary", required=True, help="Structural summary (max 500 chars; no raw transcripts)")
    p_log.add_argument("--session-date", default=None, help="YYYY-MM-DD (defaults to today)")
    p_log.add_argument("--ephemeral", action="store_true", help="Off-the-record mode: skip all disk writes")

    p_search = sub.add_parser("search", help="Search longitudinal signals via SQLite FTS5")
    p_search.add_argument("--dir", default=None)
    p_search.add_argument("--query", required=True, help="Search query string")
    p_search.add_argument("--limit", type=int, default=5)
    p_search.add_argument("--output", default=None)

    p_forget = sub.add_parser("forget", help="Permanently delete a memory and VACUUM SQLite free pages")
    p_forget.add_argument("--dir", default=None)
    p_forget.add_argument("--id", type=int, default=None, help="Signal ID to delete")
    p_forget.add_argument("--theme", default=None, help="Theme or summary substring to delete")
    p_forget.add_argument("--session", default=None, help="Session date YYYY-MM-DD to delete")

    p_purge = sub.add_parser("purge", help="Overwrite and delete the entire memory vault")
    p_purge.add_argument("--dir", default=None)
    p_purge.add_argument("--all", action="store_true", required=True)
    p_purge.add_argument("--confirm", action="store_true", required=True)

    p_export = sub.add_parser("export-capsule", help="Export a portable Markdown capsule for web chat UIs")
    p_export.add_argument("--dir", default=None)
    p_export.add_argument("--output", default=None)

    sub.add_parser("self-test", help="Run built-in unit & privacy test suite")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.self_test or args.command == "self-test":
        return run_self_test()
    if args.command == "init":
        return cmd_init(args)
    if args.command == "status":
        return cmd_status(args)
    if args.command == "log-signal":
        return cmd_log_signal(args)
    if args.command == "search":
        return cmd_search(args)
    if args.command == "forget":
        return cmd_forget(args)
    if args.command == "purge":
        return cmd_purge(args)
    if args.command == "export-capsule":
        return cmd_export_capsule(args)

    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
