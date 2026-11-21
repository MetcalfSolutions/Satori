import fs from "node:fs";
import path from "node:path";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Signed session cookies. The token is stateless: `${userId}.${expiresAtMs}.${hmac}`
 * where the HMAC is keyed by a server secret persisted in the data directory,
 * so sessions survive restarts without any server-side session table.
 */

export const SESSION_COOKIE = "satoriweb_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Loads (or first creates) the server's session-signing secret. */
export function createSessionSecret(dataDir) {
  const secretPath = path.join(dataDir, "session-secret");
  if (fs.existsSync(secretPath)) return fs.readFileSync(secretPath);
  const secret = randomBytes(32);
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(secretPath, secret);
  return secret;
}

function sign(secret, payload) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Mints a session token for `userId`, expiring after the TTL. */
export function issueSessionToken(secret, userId) {
  const payload = `${userId}.${Date.now() + SESSION_TTL_MS}`;
  return `${payload}.${sign(secret, payload)}`;
}

/**
 * Verifies a session token. Returns the user id, or null when the token is
 * malformed, has a bad signature, or has expired.
 */
export function verifySessionToken(secret, token) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userIdText, expiresText, mac] = parts;
  const payload = `${userIdText}.${expiresText}`;
  const expected = Buffer.from(sign(secret, payload), "hex");
  const actual = Buffer.from(mac, "hex");
  if (expected.length !== mac.length / 2 || expected.length !== actual.length) return null;
  if (!timingSafeEqual(expected, actual)) return null;
  const userId = Number(userIdText);
  const expiresAt = Number(expiresText);
  if (!Number.isInteger(userId) || !Number.isInteger(expiresAt)) return null;
  if (Date.now() >= expiresAt) return null;
  return userId;
}

/** Parses a Cookie header into a plain name→value map. */
export function parseCookies(header) {
  const cookies = {};
  if (typeof header !== "string") return cookies;
  for (const part of header.split(";")) {
    const pair = part.trim();
    const eq = pair.indexOf("=");
    if (eq > 0) cookies[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  return cookies;
}

/** The Set-Cookie header value that establishes (or, with token="", clears) a session. */
export function sessionCookie(token) {
  const base = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${token === "" ? 0 : Math.floor(SESSION_TTL_MS / 1000)}`;
  return base;
}

/** Reads the session token out of a request's Cookie header, if present. */
export function sessionTokenFrom(req) {
  return parseCookies(req.headers.cookie)[SESSION_COOKIE] ?? null;
}
