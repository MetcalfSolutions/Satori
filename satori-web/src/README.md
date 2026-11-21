# src

## Overview
Core Node.js backend for SatoriWeb Beta: HTTP server, durable `@earendil-works/pi-durable` conversation harness, broad multi-provider model support (`opencode-go`, `gemini`, `anthropic`, `openai`/OpenAI-compatible, `openrouter`, offline `stub`), HMAC-SHA256 cookie sessions, scrypt-hashed name+PIN user accounts, a fail-closed invite-code registration gate, scoped Satori skill file reader rooted at the repository checkout, and per-user isolated SQLite/FTS5 memory vaults with full v6.7.0 parity.

## Interface
- `[server.js:startServer]`: Boots the HTTP server (`GET /api/health` + `GET /api/auth/config`, `/api/auth/*`, `POST /api/onboarding`, `GET`/`POST /api/conversations`, `PATCH`/`DELETE /api/conversations/:id`, the Memory & Continuity surface `GET /api/vault/review`, `GET /api/vault/arc`, `DELETE /api/vault/entry/:id`, `GET`/`POST /api/vault/note`, host-only `/api/conversations/:id/log`, static `serveStatic` with `no-store` + `CDN-Cache-Control: no-store`) and handles CLI startup when invoked directly.
- `[config.js:DEFAULTS]` / `[config.js:readConfig]` / `[config.js:parseInviteCodes]`: Resolves `PORT`, `SATOWEB_BIND`, `SATOWEB_DB_PATH`, `SATOWEB_SKILL_PATH` (default: the repository root itself), `SATOWEB_VAULT_ROOT`, `SATOWEB_PROVIDER`, `SATOWEB_MODEL_ID`, `SATOWEB_THINKING_LEVEL`, `SATOWEB_HOST_TOKEN`, `SATOWEB_INVITE_CODE` (single or comma-separated codes), and `SATOWEB_ALLOW_OPEN_SIGNUP`.
- `[invite.js:isLoopbackBind]` / `[invite.js:signupPolicy]` / `[invite.js:createInviteGate]` / `[invite.js:requestIp]`: The registration gate: loopback defaults open, non-loopback fails closed without codes or an explicit opt-in, codes verify via SHA-256 + `crypto.timingSafeEqual`, and failed attempts are rate-limited per source IP.
- `[harness.js:createHarness]` / `[harness.js:modelSelection]` / `[harness.js:ensureProviderCredential]`: Opens SQLite storage, the tool registry, the built-in provider catalog (`builtinModels()`), the OpenAI-compatible override for `OPENAI_BASE_URL`, and the durable `Harness`; a bad provider/model pair fails the boot loudly.
- `[providers.js:SUPPORTED_PROVIDERS]` / `[providers.js:PROVIDER_ENV_KEYS]` / `[providers.js:registerScriptedStub]` / `[providers.js:registerOpenAICompatible]`: The provider surface table, the offline scripted stub, and the custom OpenAI-compatible endpoint provider.
- `[users.js:createUserStore]`: Atomic (`tmp` + `renameSync`) JSON-backed account, `onboarded` state, custom titles, and conversation ownership store (`register`, `verify`, `userById`, `markOnboarded`, `ownConversation`, `ownedConversationIds`, `titleOf`, `renameConversation`, `deleteConversation`, `ownerOf`, `owns`).
- `[sessions.js:SESSION_COOKIE]` / `[sessions.js:createSessionSecret]` / `[sessions.js:issueSessionToken]` / `[sessions.js:verifySessionToken]` / `[sessions.js:sessionCookie]` / `[sessions.js:sessionTokenFrom]`: Stateless HMAC-SHA256 `satoriweb_session` cookie tokens.
- `[skill.js:SKILL_ENTRY_FILE]` / `[skill.js:loadSkillInstructions]` / `[skill.js:createSkillTools]`: Reads `<skillRoot>/SKILL.md` (the repository root by default) and provides `read_skill_file` scoped to `skillRoot`.
- `[vault.js:HOST_MEMORY_INSTRUCTIONS]` / `[vault.js:assertSafeVaultRoot]` / `[vault.js:userVaultDir]` / `[vault.js:createVaultTools]` / `[vault.js:classifyThemeMovement]` / `[vault.js:createUserVault]`: The `satori-vault` extension with 6 per-user vault tools (`vault_status`, `vault_log_signal`, `vault_search`, `vault_review`, `vault_arc`, `vault_forget`) backed by SQLite FTS5 (`index.db`), `signal` → `theme` → `pattern` recurrence promotion, Graduation Signal movement classification, secure deletion, and `SATORI_NOTE v6.5` export/import; `createUserVault` serves the same payloads over HTTP.
- `[tool-results.js:textResult]` / `[tool-results.js:errorResult]`: Tool output formatting helpers.

## Invariants
- `[server.js:currentUser]` / `[server.js:getConversation]`: All `/api/conversations*` and `/api/vault*` routes require a valid signed session cookie; vault routes resolve the signed-in user's vault directory from the session alone; `[server.js:bearerMatches]` requires `SATOWEB_HOST_TOKEN` for `/api/conversations/:id/log` and returns `404` when unset or unauthorized.
- `[server.js:inviteGate]`: Registration is decided by the gate before any account state is touched; `/api/health` and `/api/auth/config` expose only `inviteRequired`/`mode`, never the codes.
- `[server.js:toClientEntry]` / `[server.js:entryText]`: Strips `thinking` and internal/tool entries from client-facing `/entries` and SSE frames.
- `[server.js:readJsonBody]`: Rejects JSON request bodies exceeding `MAX_JSON_BODY_BYTES` (`1 MB`) with `413`.
- `[vault.js:assertSafeVaultRoot]`: Refuses to boot if `vaultRoot` equals or is inside `os.homedir()/.satori/memory`.
- `[vault.js:logSignal]` / `[vault.js:sanitizeSummary]`: Enforces `ephemeral === true` consent gating, `MAX_SUMMARY_CHARS` (`500`), and `EMAIL_RE` / `PHONE_RE` / `SSN_RE` redaction, with `PRAGMA secure_delete = ON` (`connectDb`).
- `[vault.js:forgetEntries]`: Deletion runs under `secure_delete`, rewrites session logs without the forgotten lines, checkpoints, and `VACUUM`s.
- `[vault.js:importNote]`: Continuity-note imports are injection-screened (per-line and whole-note normalized views), reject forged headers and delimiter fencing, and accept allowlisted data-only fields only.
- `[skill.js:createSkillTools]`: Resolves symlinks via `fs.realpathSync` and refuses any `read_skill_file` path escaping `skillRoot`.
- `[users.js:hashPin]` / `[sessions.js:verifySessionToken]`: PINs are salted+hashed with `scryptSync` and verified with `timingSafeEqual`; session tokens are verified with `timingSafeEqual`; invite codes with `timingSafeEqual` over SHA-256 digests.

## Side Effects
- `[harness.js:createHarness]` / `[users.js:createUserStore]` / `[sessions.js:createSessionSecret]`: Creates `dataDir` and reads/writes SQLite DB, `users.json`, and `session-secret`.
- `[vault.js:ensureVault]` / `[vault.js:connectDb]` / `[vault.js:logSignal]` / `[vault.js:forgetEntries]`: Creates `<vaultRoot>/<user.id>-<slug>/` (`0o700`), `index.db` (`0o600`), `sessions/<date>.md`, `profile.md`, `formulation.md`, and `dream-layer.md` on disk; `VACUUM`s after forgets.
- `[server.js:streamReply]`: Submits user input to `conv.submit`, streams SSE frames, and logs errors to `console.error`.

## Verification
- Run: `npm test`
