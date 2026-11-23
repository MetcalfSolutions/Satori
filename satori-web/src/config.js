import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/**
 * The Satori skill checkout this repository already is: `satori-web/` sits at
 * the repository root, so the canonical `SKILL.md` and `references/` live one
 * directory up. There is no vendored copy to keep in sync.
 */
const skillRoot = path.resolve(repoRoot, "..");

/** Sane defaults so a systemd unit needs no code edits. */
export const DEFAULTS = {
  port: 8787,
  // Loopback by default; a deployment unit binds the tailscale interface's
  // address via SATOWEB_BIND so the service is tailnet-only by construction.
  bind: "127.0.0.1",
  dbPath: path.join(os.homedir(), ".local/share/satoriweb/satoriweb.sqlite"),
  skillPath: skillRoot,
  // Per-user memory vaults live under this root — a web-host area beside the
  // real vault, never inside it.
  vaultRoot: path.join(os.homedir(), ".satori", "web-vault"),
  provider: "opencode-go",
  modelId: "deepseek-v4.1-flash",
  thinkingLevel: "low",
  // Registration is open on loopback by default (a private dev run) and is
  // gated by an invite code, or closed outright, on any other bind address
  // unless SATOWEB_ALLOW_OPEN_SIGNUP=1 is set explicitly.
  inviteCodes: [],
  allowOpenSignup: false,
};

/**
 * Parses `SATOWEB_INVITE_CODE`: a single code or a comma-separated list.
 * Empty entries are dropped; codes are kept as trimmed strings.
 *
 * @param {string | undefined} raw
 * @returns {string[]}
 */
export function parseInviteCodes(raw) {
  if (typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((code) => code.trim())
    .filter((code) => code.length > 0);
}

/**
 * Resolves server configuration from environment variables.
 *
 * - `PORT` — listen port
 * - `SATOWEB_BIND` — bind address (default loopback; a deployment binds the
 *   tailscale interface's 100.x address so the service never listens publicly)
 * - `SATOWEB_DB_PATH` — SQLite storage path
 * - `SATOWEB_SKILL_PATH` — Satori skill directory (default: this repository)
 * - `SATOWEB_VAULT_ROOT` — root directory of the per-user memory vaults
 * - `SATOWEB_PROVIDER` — model provider id: "opencode-go", "gemini",
 *   "anthropic", "openai", "openrouter", or "stub" (offline test provider)
 * - `SATOWEB_MODEL_ID` — model id (default: "deepseek-v4.1-flash")
 * - `SATOWEB_THINKING_LEVEL` — thinking level
 * - `SATOWEB_HOST_TOKEN` — host-only debug token unlocking /api/conversations/:id/log
 * - `SATOWEB_INVITE_CODE` — one invite code, or several comma-separated;
 *   when set, registration requires one of them
 * - `SATOWEB_ALLOW_OPEN_SIGNUP` — set to "1" to allow registration without an
 *   invite code even on non-loopback binds
 *
 * @param {Record<string, string | undefined>} env
 */
export function readConfig(env = process.env) {
  const config = { ...DEFAULTS, inviteCodes: [...DEFAULTS.inviteCodes] };
  if (env.PORT !== undefined) config.port = Number(env.PORT);
  if (env.SATOWEB_BIND !== undefined) config.bind = env.SATOWEB_BIND;
  if (env.SATOWEB_DB_PATH !== undefined) config.dbPath = env.SATOWEB_DB_PATH;
  if (env.SATOWEB_SKILL_PATH !== undefined) config.skillPath = env.SATOWEB_SKILL_PATH;
  if (env.SATOWEB_VAULT_ROOT !== undefined) config.vaultRoot = env.SATOWEB_VAULT_ROOT;
  if (env.SATOWEB_PROVIDER !== undefined) config.provider = env.SATOWEB_PROVIDER;
  if (env.SATOWEB_MODEL_ID !== undefined) config.modelId = env.SATOWEB_MODEL_ID;
  if (env.SATOWEB_THINKING_LEVEL !== undefined)
    config.thinkingLevel = env.SATOWEB_THINKING_LEVEL;
  if (env.SATOWEB_HOST_TOKEN !== undefined) config.hostToken = env.SATOWEB_HOST_TOKEN;
  if (env.SATOWEB_INVITE_CODE !== undefined)
    config.inviteCodes = parseInviteCodes(env.SATOWEB_INVITE_CODE);
  if (env.SATOWEB_ALLOW_OPEN_SIGNUP !== undefined)
    config.allowOpenSignup = env.SATOWEB_ALLOW_OPEN_SIGNUP === "1";
  return config;
}
