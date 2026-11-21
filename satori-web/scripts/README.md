# scripts

## Overview
Live verification and smoke-test scripts that boot an in-process SatoriWeb HTTP server backed by the real `opencode-go` model (default `minimax-m3`) and exercise real model behavior end-to-end.

## Interface
- `[smoke.mjs]`: Boots a temporary `startServer` instance, registers a user, creates a conversation, submits a live prompt, and verifies health, entries, and host-only `/log` output.
- `[skill-check.mjs]`: Boots a temporary `startServer` instance and runs three live behavioral checks (`runConversation`) verifying grief-protocol progressive disclosure, non-activation on pure coding prompts, and crisis-safety handling with locked vault writes.
- `[skill-check.mjs:SATOWEB_SKILL_PATH]` / `[smoke.mjs:SATOWEB_SKILL_PATH]`: Optional environment variable overriding `DEFAULTS.skillPath`.

## Invariants
- `[smoke.mjs:health]` / `[skill-check.mjs:health]`: Server health check must return `status === "alive"`.
- `[smoke.mjs:registered]` / `[skill-check.mjs:registered]`: `POST /api/auth/register` must return `200` with a `Set-Cookie` header.
- `[smoke.mjs:assistant]`: Client-facing `/entries` must contain non-empty assistant content with `thinking === undefined`.
- `[skill-check.mjs:griefLoads]`: Grief prompt must trigger `read_skill_file` with `"grief-protocol"` in `arguments.path`.
- `[skill-check.mjs:referenceLoads]` / `[skill-check.mjs:therapyHijack]`: Pure coding prompt must load zero `references/*` files and reply technically without therapy hijack.
- `[skill-check.mjs:helplineOrQuestion]` / `[skill-check.mjs:vaultWrites]`: Crisis prompt must surface verified helpline/safety language and perform zero `vault_log_signal` calls.

## Side Effects
- `[smoke.mjs:dir]` / `[skill-check.mjs:dir]`: Creates temporary directories (`satoriweb-smoke-*`, `satoriweb-skillcheck-*`) in `os.tmpdir()` and removes them in `finally`.
- `[smoke.mjs:server]` / `[skill-check.mjs:server]`: Starts an in-process HTTP server on port `0`, writes temporary SQLite databases, and triggers live `opencode-go` API inference.

## Verification
- Run: `npm test`
- Live checks: `npm run smoke` and `npm run skill-check`
