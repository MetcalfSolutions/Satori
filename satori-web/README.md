# SatoriWeb Beta

A private, self-hosted web home for [Satori](https://github.com/MetcalfSolutions/Satori),
the psychologically grounded wisdom companion. You run it for yourself and a
small circle of friends or family over your own **Tailscale Tailnet** (or a
**Cloudflare Tunnel**), each person signs in with a name and PIN, and Satori
remembers each of them in their own isolated memory vault.

SatoriWeb is Beta software shipped inside the Satori repository as a separate,
optional installation. It is **not** part of the core skill: it is excluded
from the `dist/SatoriSkill-*.zip` archives and from the `npx skills add`
install, and it reads Satori's canonical `SKILL.md` and `references/` directly
from the repository root (no vendored copy, nothing to keep in sync).

## Requirements

- Node.js 22 or newer (a `node:sqlite` build).
- The Satori repository checkout (this directory sits at its root as
  `satori-web/`).
- A chat model, through any of the providers below. No key is needed for the
  offline test provider.

## Quick start

```bash
cd /path/to/Satori/satori-web
npm install --no-audit --no-fund
npm start            # listens on 127.0.0.1:8787 by default
```

Open `http://127.0.0.1:8787`, click **Create my space**, and start talking.
On a loopback bind registration is open, so this private dev run needs no
invite code.

## Model providers

Configure with two environment variables: `SATOWEB_PROVIDER` and
`SATOWEB_MODEL_ID` (default model: `deepseek-v4.1-flash`). The provider's API key is
read from its standard environment variable.

| `SATOWEB_PROVIDER` | API key variable | Notes |
|---|---|---|
| `opencode-go` (default) | `OPENCODE_GO_API_KEY` (or `OPENCODE_API_KEY`) | Falls back to the host's pi auth store when neither is set. |
| `gemini` | `GEMINI_API_KEY` | Google Gemini API. |
| `anthropic` | `ANTHROPIC_API_KEY` | Claude models. |
| `openai` | `OPENAI_API_KEY` | Optional `OPENAI_BASE_URL` points at any OpenAI-compatible endpoint (Ollama, LM Studio, vLLM, gateways). |
| `openrouter` | `OPENROUTER_API_KEY` | Any OpenRouter model. |
| `stub` | (none) | Deterministic scripted provider for offline `node --test` runs. |

A wrong `SATOWEB_MODEL_ID` fails at boot with the provider's available model
ids, not at the first conversation.

## Configuration reference

All settings are environment variables; every one is optional.

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `8787` | Listen port. |
| `SATOWEB_BIND` | `127.0.0.1` | Bind address. Bind your tailscale interface's address so the service is tailnet-only by construction; never `0.0.0.0`. |
| `SATOWEB_DB_PATH` | `~/.local/share/satoriweb/satoriweb.sqlite` | Durable conversation storage. |
| `SATOWEB_SKILL_PATH` | `/path/to/Satori` (the repository root) | The Satori skill directory: `SKILL.md` and `references/` are read from here. |
| `SATOWEB_VAULT_ROOT` | `~/.satori/web-vault` | Root of the per-user memory vaults. Always separate from your real `~/.satori/memory` vault (boot refuses anything inside it). |
| `SATOWEB_PROVIDER` | `opencode-go` | See the provider table above. |
| `SATOWEB_MODEL_ID` | `deepseek-v4.1-flash` | Chat model id. |
| `SATOWEB_THINKING_LEVEL` | `low` | Thinking level. |
| `SATOWEB_HOST_TOKEN` | unset | Host-only debug token; unlocks `/api/conversations/:id/log` (a Bearer header away). Leave unset in production. |
| `SATOWEB_INVITE_CODE` | unset | One invite code, or several comma-separated. When set, **Create my space** asks for one. |
| `SATOWEB_ALLOW_OPEN_SIGNUP` | unset | Set to `1` to allow registration without a code on any bind, at your own risk. |

## Invite Code security

Registration is gated; **sign-in for existing accounts never is**.

- **Loopback bind, no code configured**: open registration (a private dev run).
- **Any other bind, no code configured**: **fail-closed**. New accounts are
  refused outright, so an accidentally public bind cannot mint accounts.
- **`SATOWEB_INVITE_CODE` set**: registration requires one of the codes
  (single, or comma-separated). Codes are verified with a timing-safe
  SHA-256 comparison and failed attempts are rate-limited per IP. The API
  surface tells the frontend only that an invite is required
  (`inviteRequired`), never the codes themselves.

```bash
# one code, or several:
export SATOWEB_INVITE_CODE=tea-with-the-mountain,or-this-one
```

When a visitor clicks **Create my space** on a gated deployment, the invite
code field appears first; the existing **Sign in** flow is untouched.

## Memory & Continuity

Each signed-in person gets an isolated vault under `SATOWEB_VAULT_ROOT`
(strict 0700/0600 permissions, SQLite with FTS5, never your real
`~/.satori/memory` vault). Satori reaches it only through scoped tools with
full v6.7.0 parity: `vault_status`, `vault_log_signal`, `vault_search`,
`vault_review`, `vault_arc` (the gentle, non-coercive Graduation Signal), and
`vault_forget` (secure deletion with `PRAGMA secure_delete = ON` + `VACUUM`).

The **Memory & Continuity** drawer (in the sidebar) lets each person review
what Satori remembers, forget any record by id, and export or import a
portable, data-only `SATORI_NOTE v6.5` continuity note. Imported notes are
screened for prompt injection: raw conversation transcripts are never stored.

## Deployment: Tailscale Tailnet

1. [Install Tailscale](https://tailscale.com/download) on this machine and on
   each friend's device, then invite them:
   `sudo tailscale invite` or share a `tailscale join` link from the admin
   console.
2. Find this machine's tailnet address: `tailscale ip -4` (an address in the
   reserved CGNAT range, reachable only inside your tailnet).
3. Install and run the service bound to it:

```bash
cd /path/to/Satori/satori-web
npm install --no-audit --no-fund

mkdir -p ~/.config/systemd/user
cp systemd/satoriweb.service.example ~/.config/systemd/user/satoriweb.service
# edit ~/.config/systemd/user/satoriweb.service:
#   <YOUR_USER>      your username on this machine
#   <YOUR_TAILSCALE_IP>  the `tailscale ip -4` address
#   /path/to/Satori  this repository checkout

systemctl --user daemon-reload
systemctl --user enable --now satoriweb
loginctl enable-linger <YOUR_USER>
```

Friends now open `http://<YOUR_TAILSCALE_IP>:8787`, and you hand each of them
an invite code.

## Deployment: Cloudflare Tunnel

To share SatoriWeb over the internet without opening a port, run a
`cloudflared` tunnel that proxies to the loopback listener instead:

```bash
cloudflared tunnel --url http://127.0.0.1:8787
```

or create a named tunnel and route `satori.example.com` to
`http://127.0.0.1:8787`. Keep `SATOWEB_BIND` on loopback and configure
`SATOWEB_INVITE_CODE`: the fail-closed default means a tunnel exposed by
accident cannot mint accounts, and even on purpose, registration answers
only to your codes. Cloudflare's cache is already respected: the server
marks every page no-store so the tunnel and the tailnet serve identical
HTML.

## Updating Satori

The skill is the repository checkout itself, so updating Satori is updating
the repository:

```bash
cd /path/to/Satori
git pull
cd satori-web
npm install --no-audit --no-fund
systemctl --user restart satoriweb
```

## Tests

```bash
cd /path/to/Satori/satori-web
npm install --no-audit --no-fund
npm test
```

The suite covers the full HTTP surface end to end (auth, invite gate,
streaming chat, per-user memory isolation, continuity-note sanitization,
secure deletion) with the offline stub provider, plus a sanitization guard
that fails the build if any personal IP, username, or home path ever leaks
into this tree.

## Privacy notes

- Per-user vaults are isolated by construction; the model's tools are scoped
  to the conversation's owner and cannot read or write anywhere else.
- Structural summaries are capped and PII-scrubbed; raw transcripts are
  never stored. "Off the record" moments write nothing at all.
- Model thinking blocks never reach the client; only the host's debug log
  (token-gated) sees them.
- This Beta ships sanitized: no real addresses, usernames, or keys appear in
  any file here, and the automated leak guard keeps it that way.

### Host Access & Storage Encryption (Beta Decision)

Per-user SatoriWeb Beta vaults are stored on the host machine as plaintext
SQLite (`index.db`) and Markdown files with strict `0700`/`0600` POSIX
permissions (unlike the local CLI's optional AES-256-GCM + Scrypt encryption).
Because SatoriWeb Beta targets small, trusted friend/family Tailnets where
server-side model tool calls need transparent vault access without managing
per-user passphrases, host-disk plaintext is an intentional Beta trade-off.
This means the host administrator has technical access to vault files on disk;
per-user at-rest encryption is tracked for a future Beta milestone.

### Dependency & Pinning Policy

SatoriWeb depends on the `@earendil-works/pi-*` durable harness runtime
packages (`^1.5.0` in `satori-web/package.json`), pinned deterministically via
`satori-web/package-lock.json` (`npm ci`).

## License

Apache-2.0, like the rest of the Satori repository.
