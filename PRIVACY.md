# Satori Privacy, Data Sovereignty & Threat Model (`PRIVACY.md`)

Because Satori accompanies people through deeply personal, therapy-adjacent introspection — grief, relationship conflict, shadow work, and existential crossroads — cross-session memory must be governed by strict data sovereignty and privacy engineering.

**Core Guarantee**: Satori's local memory engine (`scripts/satori_memory.py`) is **100% local-first**. It makes zero network calls, transmits zero telemetry, and stores data exclusively in user-owned Markdown and SQLite files that you can inspect, edit, or permanently erase at any time.

---

## 1. Threat Model & Technical Mitigations (T1–T6)

| Threat ID | Threat Description | Technical Mitigation Implemented in `scripts/satori_memory.py` |
|---|---|---|
| **T1: Accidental Git Commit of `.satori/`** | A developer uses Satori inside a code repository; `.satori/memory/` is accidentally staged via `git add .` and pushed to a remote repository. | 1. **Default Out-of-Tree Vault**: `satori_memory.py` defaults to `~/.satori/memory/` in the user home directory, completely outside project workspaces.<br>2. `satori_memory.py init` automatically writes `.satori/.gitignore` containing `*`.<br>3. If a workspace `.gitignore` exists, `.satori/` is appended automatically.<br>4. `scripts/validate_skill.py` fails the build if `.satori/` is ever git-tracked. |
| **T2: Multi-User / Shared Machine Access** | Plaintext Markdown or SQLite files in `~/.satori/` or `./.satori/` are readable by other local user accounts (`0644`). | 1. **POSIX (Linux/macOS)**: Strict `0700` directory permissions and `0600` file permissions enforced via `os.chmod` on every write.<br>2. **Windows**: Best-effort ACL restriction to the current `%USERNAME%` via `icacls <path> /inheritance:r /grant:r "%USERNAME%:(OI)(CI)F"` (with non-fatal warning fallback if restricted by group policy). |
| **T3: Residual Deleted Data in SQLite Free Pages** | A user deletes a sensitive memory, but standard SQLite `DELETE` leaves plaintext strings in unallocated database pages. | `satori_memory.py forget` enables `PRAGMA secure_delete = ON` (overwriting deleted pages with zeroes), removes matching rows from both base and FTS5 tables, executes `PRAGMA wal_checkpoint(TRUNCATE)`, rewrites the source Markdown files, and immediately runs **`VACUUM`** to rebuild the database file from scratch. |
| **T4: Over-Collection of Raw Trauma / Third-Party PII** | An agent dumps verbatim sensitive disclosures, full names, or employers into `formulation.md`. | **Structural Abstraction Enforcement**: `satori_memory.py log-signal` rejects `--summary` payloads exceeding `500 characters` and strips common PII patterns (emails, phone numbers, SSNs), requiring agents to log *structural patterns* rather than verbatim transcripts. |
| **T5: Unconsented Persistence** | A user wants a single 3am conversation "off the record" with zero trace left on disk. | **Ephemeral Mode**: Passing `--ephemeral` (or telling Satori *"off the record"* / *"don't remember this"*) bypasses all disk and SQLite writes completely. |
| **T6: Cloud Sync / Unencrypted Disk Exposure** | A workspace or home directory is synced to OneDrive, iCloud Drive, Dropbox, Google Drive, or Box, or the disk is unencrypted. | 1. **Hard Cloud-Sync Rejection**: `satori_memory.py init` checks whether the target path resides inside `OneDrive`, `iCloudDrive`, `Dropbox`, `Google Drive`, or `Box`. If detected, initialization **strictly halts with exit code 1** unless explicitly overridden with `--allow-synced`.<br>2. **Full-Disk Encryption (Recommended)**: Users should enable OS Full-Disk Encryption (**BitLocker** on Windows, **FileVault** on macOS, **LUKS** on Linux).<br>3. **Optional Authenticated Vault Encryption (`AES-256-GCM`)**: When `SATORI_VAULT_PASSPHRASE` or `--encrypt` is provided, `satori_memory.py` uses the optional `cryptography` package (`AES-256-GCM` with `Scrypt` key derivation, $N=2^{14}, r=8, p=1$) to encrypt/decrypt Markdown payloads at rest. If `SATORI_VAULT_PASSPHRASE` is set without `cryptography` installed, the CLI **fails closed** with installation instructions rather than using weak stdlib substitutes. |

---

## 2. Per-Surface Data Flows

Satori runs across diverse environments with distinct storage and data-flow characteristics:

| Surface Category | Surfaces | Data Flow & Storage Model | User Privacy Controls |
|---|---|---|---|
| **Local CLI / IDE Agents** | Antigravity, Claude Code, Codex, Cursor, Windsurf, OpenCode, Hermes | 100% local-first SQLite and Markdown in `~/.satori/memory/`. Zero telemetry. Zero third-party network egress. | `satori_memory.py forget`, `purge`, `--ephemeral`, `--encrypt`. |
| **Web Chat Surfaces** | Claude.ai, ChatGPT, Gemini Web, Grok Web | Stateless prompt execution. No local filesystem access. Optional Continuity Notes (`SATORI_NOTE v6.5`, $\le 600$ chars) emitted on user request. | User controls whether to copy/paste notes; platform chat history controls apply. |

---

## 3. What Satori Stores vs. Never Stores

### Stored (With Consent, Structural Format Only)
- **Recurring themes and life domains** (`profile.md`, `formulation.md`) — e.g., *"Navigating tension between creative autonomy and financial security."*
- **Confirmed working formulations** — hypotheses the user explicitly resonated with across 2+ sessions.
- **Voice & pacing preferences** — whether the user prefers direct pattern-naming or unhurried Socratic inquiry.
- **Dream-Layer recurrence counts (`1 → 2 → 3`)** — themes that surfaced and were set aside without resolution.

### Never Stored
- Verbatim transcripts or raw journal dumps (`>500 characters` rejected by the CLI)
- Full names, phone numbers, email addresses, or employers of third parties
- Unconfirmed hypotheses that the user pushed back on or ignored
- Anything shared during an **"off the record"** / `--ephemeral` session

---

## 4. Exercising Your Right to Be Forgotten (Deletion Commands)

You can ask Satori conversationally (*"Forget what I said about X"* or *"Wipe my memory vault"*) or run these commands directly in your terminal:

```bash
# Inspect everything currently stored in your vault
python scripts/satori_memory.py status

# Permanently forget a specific theme, keyword, record ID, or session date
# (Rewrites Markdown + runs SQLite PRAGMA secure_delete = ON + VACUUM)
python scripts/satori_memory.py forget --theme "career"
python scripts/satori_memory.py forget --session "2026-10-17"
python scripts/satori_memory.py forget --id 4

# Permanently overwrite and delete the entire vault directory
python scripts/satori_memory.py purge --all --confirm
```

---

## 5. Documentation Website Hosting & Network Disclosure

The public documentation website (`https://metcalfsolutions.github.io/Satori/`) sets zero cookies, runs zero analytics or tracking scripts, and embeds no third-party trackers.

- **Web Fonts**: Typography is loaded from Google Fonts (`fonts.googleapis.com`).
- **Infrastructure Logging**: The documentation site is hosted on **GitHub Pages**. GitHub may collect visitor IP addresses and technical request logs at the network infrastructure layer for security, abuse mitigation, and operational purposes in accordance with the [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).
- **Zero Satori Egress**: The Satori skill and local memory engine (`scripts/satori_memory.py`) never communicate with GitHub Pages, Google Fonts, or any remote server.

