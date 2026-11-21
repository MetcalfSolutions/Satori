# SatoriWeb Beta (`satori-web/`) -- v6.7.0 Design Specification

> **Status**: Beta (included as an optional, separate installation inside the Satori repository on `release/v6.7.0`; strictly excluded from `dist/SatoriSkill-*.zip` and `npx skills add` core skill installs).

## 1. Purpose & Isolation Contract
- SatoriWeb lets individuals self-host a private, friend-and-family web interface for Satori over their own **Tailscale Tailnet** or **Cloudflare Tunnel**.
- **Core Skill Isolation**: `satori-web/` lives at the repository root with its own `package.json`, `README.md`, `systemd/satoriweb.service.example`, and `test/` suite. It reads Satori's canonical `SKILL.md` and `references/` directly from `..` (zero vendored duplicates). It is excluded from `dist/*.zip` archives and `package.json`'s `files` array.
- **Privacy & Leak Guard**: Zero personal Tailnet IPs (`100.x.x.x`), personal hostnames, personal usernames, or `/home/<user>` paths may ever exist in `satori-web/`. Enforced by an automated test in `satori-web/test/`.

## 2. Invite Code Security Gate (Slice 1)
- **Trigger Point**: Appears right after clicking **"Create my space"** (`#auth-register`). Returning users' **Sign in** flow is 100% untouched.
- **Server Enforcement (`POST /api/auth/register`)**:
  - Reads `SATOWEB_INVITE_CODE` (single code or comma-separated list of codes).
  - Timing-safe verification using `crypto.timingSafeEqual` (normalizing buffer length via SHA-256 digest comparison).
  - Brute-force rate limiting on failed registration attempts per IP / session.
  - **Fail-Closed Default on Non-Loopback**: If `SATOWEB_BIND` is not loopback (`127.0.0.1`, `::1`, `localhost`) and `SATOWEB_INVITE_CODE` is unset, registration refuses new accounts (`403`) unless `SATOWEB_ALLOW_OPEN_SIGNUP=1` is explicitly set. Loopback dev runs allow open signup when `SATOWEB_INVITE_CODE` is unset.
  - `/api/health` (or `/api/auth/config`) exposes `inviteRequired: boolean` (never the code itself!) so the frontend knows whether to prompt for an invite code after "Create my space".

## 3. Broad Multi-Provider Support (Slice 1)
- Configurable via `SATOWEB_PROVIDER` + `SATOWEB_MODEL_ID`:
  - `opencode-go` (`OPENCODE_GO_API_KEY`)
  - `gemini` (`GEMINI_API_KEY` / Google Gemini API)
  - `anthropic` (`ANTHROPIC_API_KEY`)
  - `openai` (`OPENAI_API_KEY` + optional `OPENAI_BASE_URL` for OpenAI-compatible / Ollama / local endpoints)
  - `openrouter` (`OPENROUTER_API_KEY`)
  - `stub` (deterministic scripted provider for zero-key offline `node --test`)

## 4. First-Class Satori v6.7.0 Memory Parity (Slice 2)
- Expand per-user isolated SQLite/FTS5 vaults (`src/vault.js`, strictly refusing `~/.satori/memory`) from 3 tools to full v6.7.0 parity:
  - Agent tools: `vault_status`, `vault_log_signal`, `vault_search`, **`vault_review`**, **`vault_arc`** (non-coercive Graduation Signal), and **`vault_forget`** (`PRAGMA secure_delete = ON` + `VACUUM`).
  - Portable **`SATORI_NOTE v6.5`** export & import endpoints (`GET /api/vault/note`, `POST /api/vault/note`) with strict data-only prompt-injection sanitization matching `scripts/satori_memory.py`.
  - **Memory & Continuity UI Drawer**: Lightweight drawer/panel in `public/index.html` + `public/app.js` allowing each authenticated user to review their own themes & Graduation Signals, forget a specific entry by ID, and export/import a `SATORI_NOTE v6.5` without needing a CLI.

## 5. Beta Self-Hosting Documentation (Slice 2)
- `satori-web/README.md`: Standalone installation, onboarding, multi-provider env configuration, Invite Code setup, Tailscale Tailnet deployment, Cloudflare Tunnel deployment, and sanitized `systemd/satoriweb.service.example` (using `<YOUR_USER>`, `<YOUR_TAILSCALE_IP>`, `/path/to/Satori/satori-web`).
- No em dashes (`\u2014` / `&mdash;`) in any repo-hygiene-checked docs.
