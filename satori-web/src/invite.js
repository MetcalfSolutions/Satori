import { createHash, timingSafeEqual } from "node:crypto";

/**
 * The Invite Code security gate for registration.
 *
 * Returning users' sign-in is untouched; the gate applies only to
 * `POST /api/auth/register` ("Create my space"). Three deployment modes:
 *
 * - `open` — registration needs no code. Loopback binds default here (a
 *   private dev run), and any bind can opt in explicitly via
 *   `SATOWEB_ALLOW_OPEN_SIGNUP=1`.
 * - `invite` — `SATOWEB_INVITE_CODE` (one code or a comma-separated list) is
 *   set: registration requires one of the codes, verified with a
 *   SHA-256-normalized timing-safe comparison, with per-IP rate limiting on
 *   failed attempts.
 * - `closed` — any other bind address with no codes and no explicit
 *   opt-in refuses all new accounts (fail-closed default).
 */

/** Failed-attempt budget per source IP before the gate starts refusing. */
const MAX_FAILED_ATTEMPTS = 10;
/** Window over which the failed-attempt budget is counted. */
const WINDOW_MS = 15 * 60 * 1000;

/** True when `bind` is a loopback address (IPv4 127/8, IPv6 ::1, localhost). */
export function isLoopbackBind(bind) {
  const value = String(bind ?? "").trim().toLowerCase();
  if (value === "localhost" || value === "::1") return true;
  // IPv4-mapped IPv6 loopback (::ffff:127.0.0.1) and plain 127.x.x.x.
  const mapped = value.replace(/^::ffff:/, "");
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(mapped)) return true;
  return false;
}

/**
 * The registration policy for a deployment.
 *
 * @param {{bind: string, inviteCodes: string[], allowOpenSignup?: boolean}} config
 * @returns {{mode: "open" | "invite" | "closed", inviteRequired: boolean}}
 */
export function signupPolicy(config) {
  const codes = config.inviteCodes ?? [];
  if (codes.length > 0) return { mode: "invite", inviteRequired: true };
  if (config.allowOpenSignup === true) return { mode: "open", inviteRequired: false };
  if (isLoopbackBind(config.bind)) return { mode: "open", inviteRequired: false };
  // Fail-closed: a public/tailnet bind with no invite code configured and no
  // explicit opt-in serves existing accounts only.
  return { mode: "closed", inviteRequired: true };
}

/** SHA-256 digest of a code, so timing-safe comparison works on equal-length buffers. */
function sha256(text) {
  return createHash("sha256").update(String(text), "utf8").digest();
}

/**
 * Timing-safe check of a presented code against every configured code. Every
 * configured code is always hashed and compared, so the response time does
 * not reveal how many codes exist or which position matched.
 */
function codeMatches(presented, codes) {
  const presentedDigest = sha256(presented);
  let matches = false;
  for (const code of codes) {
    const expectedDigest = sha256(code);
    if (expectedDigest.length === presentedDigest.length && timingSafeEqual(expectedDigest, presentedDigest)) {
      matches = true;
    }
  }
  return matches;
}

/** The request's source IP, normalizing IPv4-mapped IPv6 addresses. */
export function requestIp(req) {
  const raw = req?.socket?.remoteAddress ?? "";
  return String(raw).replace(/^::ffff:/, "");
}

/**
 * Creates the gate. `checkRegistration` is called before any account is
 * created; a failed code attempt counts against the source IP's budget, and
 * a source past its budget is refused regardless of what it sends.
 *
 * @param {{inviteCodes: string[], bind: string, allowOpenSignup?: boolean,
 *   maxFailedAttempts?: number, windowMs?: number}} config
 */
export function createInviteGate(config) {
  const codes = (config.inviteCodes ?? []).filter((code) => code.length > 0);
  const policy = signupPolicy(config);
  const maxFailed = config.maxFailedAttempts ?? MAX_FAILED_ATTEMPTS;
  const windowMs = config.windowMs ?? WINDOW_MS;

  /** ip -> {count, windowStart}; pruned as windows lapse. */
  const failures = new Map();

  function failureBudget(ip) {
    const now = Date.now();
    const entry = failures.get(ip);
    if (!entry || now - entry.windowStart >= windowMs) {
      failures.set(ip, { count: 0, windowStart: now });
      return { count: 0, windowStart: now, fresh: true };
    }
    return { ...entry, fresh: false };
  }

  return {
    /** The deployment's registration policy (never the codes themselves). */
    get policy() {
      return policy;
    },

    /**
     * Decides one registration attempt.
     *
     * @param {{ip: string, inviteCode?: unknown}} attempt
     * @returns {{ok: true} | {ok: false, status: number, error: string}}
     */
    checkRegistration(attempt) {
      // Rate limiting first: a past-budget source is refused even if it
      // suddenly presents the right code.
      if (failureBudget(attempt.ip).count >= maxFailed) {
        return {
          ok: false,
          status: 429,
          error: "Too many failed attempts. Try again later.",
        };
      }

      if (policy.mode === "closed") {
        return {
          ok: false,
          status: 403,
          error: "Signups are closed on this server. Ask your host for an invite code.",
        };
      }
      if (policy.mode === "open") return { ok: true };

      const presented = typeof attempt.inviteCode === "string" ? attempt.inviteCode : "";
      if (presented.length === 0 || !codeMatches(presented, codes)) {
        const entry = failures.get(attempt.ip);
        entry.count += 1;
        return {
          ok: false,
          status: 403,
          error: "That invite code is not valid.",
        };
      }
      return { ok: true };
    },
  };
}
