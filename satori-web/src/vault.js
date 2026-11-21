import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { defineExtension, defineTool } from "@earendil-works/pi-durable";
import { bool, int, obj, opt, str } from "@earendil-works/pi-schema";

import { errorResult, textResult } from "./tool-results.js";

function jsonResult(payload) {
  return textResult(JSON.stringify(payload, null, 2));
}

/**
 * Per-user isolated memory vaults, following Satori's memory protocol
 * (`references/memory-system.md` in the repository root, engine reference
 * `scripts/satori_memory.py`).
 *
 * Each signed-in user maps to one vault directory under the configurable
 * vault root — never the host's real `~/.satori/memory` vault. The model
 * reaches a vault only through the tools built here, and the scope is
 * resolved from the *conversation's owner*, not from anything the model
 * supplies: no tool takes a path, so reads and writes outside the current
 * user's vault are structurally impossible.
 */

/** The structural abstraction limit of the protocol (PRIVACY.md T4). */
const MAX_SUMMARY_CHARS = 500;

/** The Continuity Note (v6.5) hard length limit, as the engine enforces. */
const MAX_NOTE_CHARS = 600;

/** A theme not seen for this many days classifies as dormant in the arc. */
const DORMANT_DAYS_THRESHOLD = 60;

/** Review previews cap structural summaries for human display. */
const REVIEW_SUMMARY_PREVIEW_CHARS = 160;

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_RE = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g;
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;

const LAYER_PATTERN = "^(signal|theme|pattern|dream)$";

/* ---------- Continuity Note sanitization (mirrors satori_memory.py) ---------- */

/** Zero-width / invisible characters stripped from stored and imported text. */
const INVISIBLE_CHARS_RE = /[\u200b\u200c\u200d\u2060\ufeff\u00ad\u180e]/g;

/** Punctuation sequences used to obfuscate injection markers. */
const OBFUSCATION_JOINER_RE = /(?<=\w)[.\-_*/\\|~^]+(?=\w)/g;

/** The data-only `arc:` continuity field's allowlist shape. */
const ARC_FIELD_SAFE_RE = /^[a-z0-9= ]{0,80}$/;

/** Injection heuristic patterns, matched on a normalized view so obfuscated, multiline, and role-tag payloads cannot slip between lines. */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|rules|prompts)/i,
  /\bsystem\s*:\s*/i,
  /\bassistant\s*:\s*/i,
  /\buser\s*:\s*/i,
  /\bdeveloper\s*:\s*/i,
  /\btool\s*:\s*/i,
  /you\s+are\s+now\s+/i,
  /disregard\s+(all\s+)?(previous|prior)/i,
  /<\|[^|>]{0,32}\|>/i,
  /sudo\s+mode/i,
  /execute\s+(the\s+)?(instructions?|commands?)\s+(above|below)/i,
  /override\s+(all\s+)?(your\s+)?(instructions|rules|system)/i,
  /\bnew\s+instructions?\s*:/i,
  /\bdo\s+anything\s+(now|you\s+want)\b/i,
];

/**
 * The normalized view used only for injection screening: lowercased,
 * invisible characters stripped, whitespace collapsed, obfuscation joiners
 * removed. The original note text is never stored or re-emitted from this
 * view.
 */
function normalizeTextForInjectionCheck(text) {
  let lowered = String(text).toLowerCase().replace(INVISIBLE_CHARS_RE, "");
  lowered = lowered.replace(/\s+/g, " ");
  return lowered.replace(OBFUSCATION_JOINER_RE, "");
}

/** Full ISO timestamp of now (for generated-at fields). */
function todayIso() {
  return new Date().toISOString();
}

/** ISO date (YYYY-MM-DD) of today. */
function today() {
  return todayIso().slice(0, 10);
}

/** Days between an ISO date and today (0 on unparseable dates). */
function daysSince(dateText) {
  const parsed = Date.parse(`${String(dateText).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.floor((Date.now() - parsed) / (24 * 60 * 60 * 1000)));
}

/**
 * Classifies one theme's longitudinal movement for the Graduation Signal
 * arc. Deterministic rules (present moment always outranks history), exactly
 * as the engine's `classify_theme_movement`.
 */
export function classifyThemeMovement(layer, recurrenceCount, daysSinceLastSeen) {
  if (daysSinceLastSeen >= DORMANT_DAYS_THRESHOLD) return "dormant";
  if (layer === "dream") {
    if (recurrenceCount === 1) return "emerging";
    if (recurrenceCount >= 3) return "stabilized";
    return "shifting";
  }
  if (layer === "pattern") return "stabilized";
  return "shifting";
}

/** Loads every stored theme with its movement classification. */
function collectThemeMovements(db) {
  const rows = db
    .prepare(
      "SELECT id, theme, layer, recurrence_count, session_date FROM signals " +
        "ORDER BY recurrence_count DESC, updated_at DESC",
    )
    .all();
  return rows.map((row) => ({
    id: Number(row.id),
    theme: String(row.theme),
    layer: String(row.layer),
    recurrence_count: Number(row.recurrence_count),
    session_date: String(row.session_date),
    days_since_last_seen: daysSince(row.session_date),
    movement: classifyThemeMovement(
      String(row.layer),
      Number(row.recurrence_count),
      daysSince(row.session_date),
    ),
  }));
}

/** Aggregates movement classifications into per-status counts. */
function summarizeMovements(themes) {
  const counts = { emerging: 0, shifting: 0, stabilized: 0, dormant: 0 };
  for (const theme of themes) counts[theme.movement] += 1;
  return counts;
}

/**
 * The gentle, non-coercive Graduation Signal: it only surfaces longitudinal
 * movement; it never pushes, scores, or demands action. A graduation window
 * opens when themes that once recurred strongly (count >= 3) have gone
 * quiet.
 */
function buildGraduationSignal(themes) {
  const quietIntegrations = themes.filter(
    (theme) => theme.movement === "dormant" && theme.recurrence_count >= 3,
  );
  if (themes.length === 0) {
    return {
      status: "no_history",
      themes: [],
      message: "No longitudinal themes recorded yet; there is nothing to outgrow.",
    };
  }
  if (quietIntegrations.length > 0) {
    return {
      status: "graduation_window",
      themes: quietIntegrations.map((theme) => theme.theme),
      message:
        "Themes that once recurred strongly have now been quiet for a while. " +
        "If that quiet reflects movement rather than avoidance, this may be a season " +
        "where Satori's support is meant to be outgrown. No action is needed; keep " +
        "whichever companion serves you.",
    };
  }
  return {
    status: "in_progress",
    themes: [],
    message: "Longitudinal movement is still in progress; no graduation signal yet.",
  };
}

/** True when the vault's SQLite index exists (never creates the vault). */
function vaultExists(vaultDir) {
  return fs.existsSync(path.join(vaultDir, "index.db"));
}

/** The host's real Satori vault: SatoriWeb must never touch it, at any depth. */
function realVaultPath() {
  return path.resolve(os.homedir(), ".satori", "memory");
}

/**
 * Guards the configured vault root: booting fails loudly if the root is (or
 * sits inside) the host's real `~/.satori/memory` vault.
 */
export function assertSafeVaultRoot(vaultRoot) {
  const realVault = realVaultPath();
  const resolved = path.resolve(vaultRoot);
  const relative = path.relative(realVault, resolved);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    throw new Error(
      `Refusing vault root ${vaultRoot}: it is the host's real Satori vault ` +
        `(${realVault}), which SatoriWeb must never touch. ` +
        "Configure SATOWEB_VAULT_ROOT to a separate location.",
    );
  }
}

/**
 * The vault directory of one user, under the vault root. The user id prefixes
 * the name slug so two distinct accounts can never share a vault even if
 * their names slugify identically.
 */
export function userVaultDir(vaultRoot, user) {
  const slug = user.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return path.join(vaultRoot, `${user.id}-${slug || "user"}`);
}

/** Strict 0700/0600 permissions, mirroring the engine's `enforce_permissions`. */
function enforcePermissions(target, isDir = false) {
  try {
    fs.chmodSync(target, isDir ? 0o700 : 0o600);
  } catch {
    // Non-POSIX or already gone: the vault still functions.
  }
}

/** Opens (and ensures the schema of) the vault's SQLite index. */
function connectDb(vaultDir) {
  const dbPath = path.join(vaultDir, "index.db");
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA secure_delete = ON;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      theme TEXT NOT NULL,
      layer TEXT NOT NULL CHECK(layer IN ('signal', 'theme', 'pattern', 'dream')),
      summary TEXT NOT NULL,
      recurrence_count INTEGER NOT NULL DEFAULT 1,
      session_date TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS signals_fts USING fts5(
      theme,
      layer,
      summary,
      session_date
    );
  `);
  enforcePermissions(dbPath, false);
  return db;
}

/** The protocol's default profile file, created with a fresh vault. */
function defaultProfile() {
  return (
    "# Satori User Profile & Voice Calibration\n\n" +
    "- **Preferred Stance**: balanced\n" +
    "- **Preferred Balance**: Attunement first, followed by collaborative pattern naming.\n" +
    "- **Framework Style**: Plain-language translation (avoid clinical jargon).\n" +
    `- **Updated**: ${today()}\n`
  );
}

/**
 * Initializes a vault directory exactly as `satori_memory.py init` does:
 * the memory directory with strict permissions, a `sessions/` log, a
 * self-protecting `.gitignore`, a profile file, the SQLite index, and the
 * auto-maintained formulation and dream-layer files.
 */
function ensureVault(vaultDir) {
  fs.mkdirSync(vaultDir, { recursive: true });
  enforcePermissions(vaultDir, true);
  const sessionsDir = path.join(vaultDir, "sessions");
  fs.mkdirSync(sessionsDir, { recursive: true });
  enforcePermissions(sessionsDir, true);

  const gitignore = path.join(vaultDir, ".gitignore");
  if (!fs.existsSync(gitignore)) {
    fs.writeFileSync(gitignore, "*\n!.gitignore\n");
    enforcePermissions(gitignore, false);
  }

  const profile = path.join(vaultDir, "profile.md");
  if (!fs.existsSync(profile)) {
    fs.writeFileSync(profile, defaultProfile());
    enforcePermissions(profile, false);
  }

  const db = connectDb(vaultDir);
  try {
    rebuildMarkdownFiles(vaultDir, db);
  } finally {
    db.close();
  }
}

/**
 * Enforces T4 data minimization: structural patterns only. Caps the summary
 * at the protocol's 500-character limit and scrubs obvious PII, exactly as
 * the engine's `sanitize_structural_summary` does.
 */
function sanitizeSummary(summary) {
  const cleaned = String(summary).trim();
  if (cleaned.length > MAX_SUMMARY_CHARS) {
    throw new Error(
      `Summary length (${cleaned.length} chars) exceeds the ${MAX_SUMMARY_CHARS}-character ` +
        "structural abstraction limit (PRIVACY.md T4). Summarize the structural pattern " +
        "instead of storing raw text.",
    );
  }
  return cleaned
    .replace(EMAIL_RE, "[REDACTED_EMAIL]")
    .replace(PHONE_RE, "[REDACTED_PHONE]")
    .replace(SSN_RE, "[REDACTED_ID]");
}

/** The established note line, as `log-signal` writes it to the session file. */
function sessionLine(id, theme, layer, count, summary) {
  return `- **[#${id}] ${theme}** (\`${layer}\`, count=${count}): ${summary}\n`;
}

/**
 * Regenerates formulation.md and dream-layer.md from current SQLite state,
 * mirroring the engine's `rebuild_markdown_files` byte for byte.
 */
function rebuildMarkdownFiles(vaultDir, db) {
  const rows = db
    .prepare(
      "SELECT id, theme, layer, summary, recurrence_count, session_date, updated_at " +
        "FROM signals ORDER BY recurrence_count DESC, updated_at DESC",
    )
    .all();

  const formulationLines = [
    "# Satori Longitudinal Working Formulation",
    "",
    "> Auto-maintained by the memory protocol. User-owned and editable.",
    "",
    "## Active Patterns & Signals",
    "",
  ];
  const dreamLines = [
    "# Satori Dream / Auto-Dream Layer",
    "",
    "> Tracks recurring unresolved themes (`1 -> 2 -> 3` appearance threshold).",
    "",
    "| ID | Theme | Count | Status | Summary | Last Seen |",
    "|---|---|---|---|---|---|",
  ];

  let hasFormulation = false;
  let hasDream = false;
  for (const row of rows) {
    if (row.layer === "dream") {
      hasDream = true;
      const status =
        row.recurrence_count === 1
          ? "Background watch (1)"
          : row.recurrence_count === 2
            ? "Gentle bridge eligible (2)"
            : "Pattern threshold reached (3+)";
      dreamLines.push(
        `| ${row.id} | ${row.theme} | ${row.recurrence_count} | ${status} | ${row.summary} | ${row.session_date} |`,
      );
    } else {
      hasFormulation = true;
      formulationLines.push(
        `- **[#${row.id}] ${row.theme}** (\`${row.layer}\`, count=${row.recurrence_count}, ` +
          `${row.session_date}): ${row.summary}`,
      );
    }
  }

  if (!hasFormulation) formulationLines.push("_No active signals recorded._");
  if (!hasDream) dreamLines.push("| — | _None_ | 0 | — | — | — |");

  const formulationPath = path.join(vaultDir, "formulation.md");
  const dreamPath = path.join(vaultDir, "dream-layer.md");
  fs.writeFileSync(formulationPath, formulationLines.join("\n") + "\n");
  fs.writeFileSync(dreamPath, dreamLines.join("\n") + "\n");
  enforcePermissions(formulationPath, false);
  enforcePermissions(dreamPath, false);
}

/** Appends the note line to the day's session reflection log. */
function appendSessionLine(vaultDir, date, line) {
  const sessionFile = path.join(vaultDir, "sessions", `${date}.md`);
  if (fs.existsSync(sessionFile)) {
    fs.appendFileSync(sessionFile, line);
  } else {
    fs.writeFileSync(sessionFile, `# Session Reflection Log — ${date}\n\n${line}`);
  }
  enforcePermissions(sessionFile, false);
}

/**
 * Records a structural signal, mirroring `satori_memory.py log-signal`:
 * consent-gated (ephemeral means zero disk writes), length-capped and
 * PII-scrubbed, with the protocol's recurrence counting and layer
 * promotion (`signal` → `theme` at 2 → `pattern` at 3+).
 *
 * @returns {{ payload: object } | { error: string }}
 */
function logSignal(vaultDir, args) {
  // Consent gate: an off-the-record moment is acknowledged and then dropped —
  // zero disk writes occur, exactly as the protocol's `--ephemeral` demands.
  if (args.ephemeral === true) {
    return { payload: { status: "ephemeral_skipped", persisted: false } };
  }

  let cleaned;
  try {
    cleaned = sanitizeSummary(args.summary);
  } catch (err) {
    return { error: err.message };
  }

  const theme = String(args.theme).trim();
  const layer = String(args.layer).trim().toLowerCase();
  const date = typeof args.session_date === "string" && args.session_date.length > 0
    ? args.session_date
    : today();
  const nowIso = new Date().toISOString();

  ensureVault(vaultDir);
  const db = connectDb(vaultDir);
  try {
    const existing = db
      .prepare("SELECT id, recurrence_count, layer FROM signals WHERE lower(theme) = lower(?)")
      .get(theme);

    let signalId;
    let count;
    let effectiveLayer;
    if (existing) {
      count = Number(existing.recurrence_count) + 1;
      effectiveLayer = layer;
      if (layer === "signal" && count === 2) {
        effectiveLayer = "theme";
      } else if ((layer === "signal" || layer === "theme") && count >= 3) {
        effectiveLayer = "pattern";
      }
      db.prepare(
        "UPDATE signals SET recurrence_count = ?, layer = ?, summary = ?, " +
          "session_date = ?, updated_at = ? WHERE id = ?",
      ).run(count, effectiveLayer, cleaned, date, nowIso, existing.id);
      signalId = Number(existing.id);
      db.prepare("DELETE FROM signals_fts WHERE rowid = ?").run(signalId);
      db.prepare(
        "INSERT INTO signals_fts(rowid, theme, layer, summary, session_date) VALUES (?, ?, ?, ?, ?)",
      ).run(signalId, theme, effectiveLayer, cleaned, date);
    } else {
      count = 1;
      effectiveLayer = layer;
      const result = db
        .prepare(
          "INSERT INTO signals(theme, layer, summary, recurrence_count, session_date, updated_at) " +
            "VALUES (?, ?, ?, 1, ?, ?)",
        )
        .run(theme, effectiveLayer, cleaned, date, nowIso);
      signalId = Number(result.lastInsertRowid);
      db.prepare(
        "INSERT INTO signals_fts(rowid, theme, layer, summary, session_date) VALUES (?, ?, ?, ?, ?)",
      ).run(signalId, theme, effectiveLayer, cleaned, date);
    }

    appendSessionLine(vaultDir, date, sessionLine(signalId, theme, effectiveLayer, count, cleaned));
    rebuildMarkdownFiles(vaultDir, db);

    return {
      payload: {
        status: "logged",
        id: signalId,
        theme,
        layer: effectiveLayer,
        recurrence_count: count,
        session_date: date,
      },
    };
  } finally {
    db.close();
  }
}

/**
 * The vault's status, as `satori_memory.py status` reports it. Never creates
 * or touches a missing vault: an unread vault reports itself uninitialized.
 */
function statusPayload(vaultDir) {
  const dbPath = path.join(vaultDir, "index.db");
  if (!fs.existsSync(dbPath)) {
    return {
      status: "uninitialized",
      vault_dir: vaultDir,
      signals: [],
      dream_watch: [],
    };
  }
  const db = connectDb(vaultDir);
  try {
    const signals = db
      .prepare(
        "SELECT id, theme, layer, summary, recurrence_count, session_date FROM signals " +
          "WHERE layer != 'dream' ORDER BY recurrence_count DESC, updated_at DESC LIMIT 10",
      )
      .all();
    const dreamRows = db
      .prepare(
        "SELECT id, theme, layer, summary, recurrence_count, session_date FROM signals " +
          "WHERE layer = 'dream' ORDER BY recurrence_count DESC, updated_at DESC LIMIT 10",
      )
      .all();
    const dreamWatch = dreamRows.map((row) => ({
      ...row,
      action_hint:
        row.recurrence_count === 1
          ? "hold_silently"
          : row.recurrence_count === 2
            ? "gentle_bridge_if_relevant"
            : "name_pattern_gently",
    }));
    return { status: "ok", vault_dir: vaultDir, signals, dream_watch: dreamWatch };
  } finally {
    db.close();
  }
}

/**
 * FTS5 search of the longitudinal history, as `satori_memory.py search`
 * does, with the engine's LIKE fallback for queries FTS5 cannot parse.
 */
function searchPayload(vaultDir, query, limit) {
  const dbPath = path.join(vaultDir, "index.db");
  if (!fs.existsSync(dbPath)) {
    return { status: "empty", results: [] };
  }
  const db = connectDb(vaultDir);
  try {
    let rows;
    try {
      rows = db
        .prepare(
          "SELECT s.id, s.theme, s.layer, s.summary, s.recurrence_count, s.session_date " +
            "FROM signals_fts f JOIN signals s ON s.id = f.rowid " +
            "WHERE signals_fts MATCH ? ORDER BY rank LIMIT ?",
        )
        .all(query, limit);
    } catch {
      const like = `%${query}%`;
      rows = db
        .prepare(
          "SELECT id, theme, layer, summary, recurrence_count, session_date FROM signals " +
            "WHERE theme LIKE ? OR summary LIKE ? ORDER BY recurrence_count DESC LIMIT ?",
        )
        .all(like, like, limit);
    }
    return { status: "ok", query, results: rows };
  } finally {
    db.close();
  }
}

/** Human-readable structural summary preview (never a raw transcript). */
function preview(summary) {
  const text = String(summary).trim();
  if (text.length > REVIEW_SUMMARY_PREVIEW_CHARS) {
    return text.slice(0, REVIEW_SUMMARY_PREVIEW_CHARS) + "...";
  }
  return text;
}

/**
 * A human-readable review of what the vault remembers, as
 * `satori_memory.py review --json` reports it: themes, counts, IDs, and
 * previews, so the person (or the model, on their behalf) can inspect the
 * vault and forget any record by id. Never creates a missing vault.
 */
function reviewPayload(vaultDir, limit = 10) {
  if (!vaultExists(vaultDir)) {
    return {
      status: "empty",
      generated: todayIso(),
      total_memories: 0,
      total_sessions: 0,
      active: [],
      dream_watch: [],
      data_only: "Raw conversation transcripts are never stored or printed.",
      forget_hint: "Forget any record by its id with vault_forget { id }.",
    };
  }
  const db = connectDb(vaultDir);
  try {
    const totals = db.prepare("SELECT COUNT(*) AS c, COUNT(DISTINCT session_date) AS s FROM signals").get();
    const active = db
      .prepare(
        "SELECT id, theme, layer, summary, recurrence_count, session_date, updated_at FROM signals " +
          "WHERE layer != 'dream' ORDER BY recurrence_count DESC, updated_at DESC LIMIT ?",
      )
      .all(limit)
      .map((row) => ({ ...row, summary_preview: preview(row.summary) }));
    const dreamRows = db
      .prepare(
        "SELECT id, theme, layer, summary, recurrence_count, session_date, updated_at FROM signals " +
          "WHERE layer = 'dream' ORDER BY recurrence_count DESC, updated_at DESC LIMIT ?",
      )
      .all(limit);
    const dreamWatch = dreamRows.map((row) => ({
      ...row,
      summary_preview: preview(row.summary),
      action_hint:
        row.recurrence_count === 1
          ? "hold_silently"
          : row.recurrence_count === 2
            ? "gentle_bridge_if_relevant"
            : "name_pattern_gently",
    }));
    return {
      status: "ok",
      generated: todayIso(),
      total_memories: Number(totals.c),
      total_sessions: Number(totals.s),
      active,
      dream_watch: dreamWatch,
      data_only: "Raw conversation transcripts are never stored or printed.",
      forget_hint: "Forget any record by its id with vault_forget { id }.",
    };
  } finally {
    db.close();
  }
}

/**
 * The Graduation Signal arc, as `satori_memory.py arc --json` reports it:
 * every theme's movement classification, per-status counts, and the gentle,
 * non-coercive graduation signal. Never creates a missing vault.
 */
function arcPayload(vaultDir) {
  let themes = [];
  let status = "empty";
  if (vaultExists(vaultDir)) {
    const db = connectDb(vaultDir);
    try {
      themes = collectThemeMovements(db);
    } finally {
      db.close();
    }
    status = "ok";
  }
  return {
    status,
    generated: todayIso(),
    dormant_days_threshold: DORMANT_DAYS_THRESHOLD,
    counts: summarizeMovements(themes),
    themes,
    graduation_signal: buildGraduationSignal(themes),
  };
}

/**
 * Cryptographically hygienic deletion, mirroring `satori_memory.py forget`:
 * matching records are deleted from the SQLite index and its FTS mirror
 * under `PRAGMA secure_delete = ON`, the session logs are rewritten without
 * the forgotten lines, the formulation and dream-layer files are rebuilt,
 * and the database is VACUUMed so no residual pages survive on disk.
 *
 * @returns {{ payload: object } | { error: string }}
 */
function forgetEntries(vaultDir, { id, theme, session }) {
  const hasSelector = id !== undefined || theme !== undefined || session !== undefined;
  if (!hasSelector) {
    return { error: "Specify at least one of id, theme, or session to forget." };
  }
  if (!vaultExists(vaultDir)) {
    return { payload: { status: "nothing_to_forget", deleted_count: 0 } };
  }

  const db = connectDb(vaultDir);
  try {
    db.exec("PRAGMA secure_delete = ON;");

    let rows;
    if (id !== undefined) {
      rows = db.prepare("SELECT id, theme FROM signals WHERE id = ?").all(id);
    } else if (theme !== undefined) {
      const like = `%${String(theme).trim()}%`;
      rows = db
        .prepare("SELECT id, theme FROM signals WHERE theme LIKE ? OR summary LIKE ?")
        .all(like, like);
    } else {
      rows = db.prepare("SELECT id, theme FROM signals WHERE session_date = ?").all(String(session).trim());
    }

    const ids = rows.map((row) => Number(row.id));
    for (const rowId of ids) {
      db.prepare("DELETE FROM signals WHERE id = ?").run(rowId);
      db.prepare("DELETE FROM signals_fts WHERE rowid = ?").run(rowId);
    }

    // Rewrite the session reflection logs without the forgotten lines.
    const sessionsDir = path.join(vaultDir, "sessions");
    if (fs.existsSync(sessionsDir)) {
      if (session !== undefined) {
        const target = path.join(sessionsDir, `${String(session).trim()}.md`);
        if (fs.existsSync(target)) {
          // Overwrite before unlinking so the content never survives deletion.
          fs.writeFileSync(target, Buffer.alloc(fs.statSync(target).size, 0));
          fs.unlinkSync(target);
        }
      }
      for (const entry of fs.readdirSync(sessionsDir)) {
        if (!entry.endsWith(".md")) continue;
        const sessionFile = path.join(sessionsDir, entry);
        const content = fs.readFileSync(sessionFile, "utf8");
        const kept = content.split("\n").filter((line) => {
          if (ids.some((rowId) => line.includes(`[#${rowId}]`))) return false;
          if (theme !== undefined && line.toLowerCase().includes(String(theme).toLowerCase())) return false;
          return true;
        });
        fs.writeFileSync(sessionFile, kept.join("\n"));
        enforcePermissions(sessionFile, false);
      }
    }

    try {
      db.exec("PRAGMA wal_checkpoint(TRUNCATE);");
    } catch {
      // Journal modes other than WAL have no checkpoint to run.
    }
    db.exec("VACUUM;");
    rebuildMarkdownFiles(vaultDir, db);

    return {
      payload: {
        status: "forgotten",
        deleted_count: ids.length,
        deleted_ids: ids,
        vacuumed: true,
      },
    };
  } finally {
    db.close();
  }
}

/**
 * Builds the portable `SATORI_NOTE v6.5` data-only continuity note, mirroring
 * `satori_memory.py export-note`: top theme, stance, lens, step, anchor
 * question, session count, and the arc movement line. Never contains a raw
 * transcript. Never creates a missing vault.
 *
 * @returns {{ payload: { note: string } } | { error: string }}
 */
function exportNote(vaultDir) {
  let theme = "";
  let anchorQ = "";
  let sessionCount = 1;
  let arcSignal = "";

  if (vaultExists(vaultDir)) {
    const db = connectDb(vaultDir);
    try {
      const top = db
        .prepare("SELECT theme, summary FROM signals ORDER BY recurrence_count DESC, updated_at DESC LIMIT 1")
        .get();
      if (top) {
        theme = String(top.theme).slice(0, 60);
        anchorQ = String(top.summary).slice(0, 140);
      }
      const countRow = db.prepare("SELECT COUNT(DISTINCT session_date) AS s FROM signals").get();
      sessionCount = Number(countRow?.s ?? 0) + 1;
      const themes = collectThemeMovements(db);
      if (themes.length > 0) {
        const counts = summarizeMovements(themes);
        arcSignal =
          `stabilized=${counts.stabilized} shifting=${counts.shifting} ` +
          `emerging=${counts.emerging} dormant=${counts.dormant}`;
      }
    } finally {
      db.close();
    }
  }

  theme = (theme || "Ongoing self-reflection").slice(0, 60);
  anchorQ = (anchorQ || "What small step holds reality today without rushing?").slice(0, 140);

  const noteLines = [
    "SATORI_NOTE v6.5",
    `theme: ${theme}`,
    "stance: balanced",
    "lens: stoic",
    "step: anchor",
    `anchor_question: ${anchorQ}`,
    `session_count: ${sessionCount}`,
  ];
  if (arcSignal) noteLines.push(`arc: ${arcSignal}`);
  noteLines.push(`created: ${today()}`);
  const note = noteLines.join("\n") + "\n";

  if (note.length > MAX_NOTE_CHARS) {
    return { error: `Generated note exceeds ${MAX_NOTE_CHARS} characters: ${note.length}.` };
  }
  return { payload: { note } };
}

/**
 * Imports a `SATORI_NOTE v6.5` data-only continuity note, mirroring
 * `satori_memory.py import-note` with full prompt-injection screening:
 * header validation, per-line and whole-note normalized injection checks,
 * forged-header and delimiter rejection, allowlisted fields only, and a
 * data-only arc shape. The sanitized summary is logged as a pattern-layer
 * signal in the person's vault.
 *
 * @returns {{ payload: object } | { error: string }}
 */
function importNote(vaultDir, rawText) {
  const raw = String(rawText ?? "").trim();
  if (raw.length === 0) return { error: "The note is empty." };
  if (raw.length > MAX_NOTE_CHARS) {
    return { error: `Imported note exceeds the ${MAX_NOTE_CHARS} character limit: ${raw.length} chars.` };
  }

  const lines = raw.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  const first = lines[0] ?? "";
  if (!(first === "SATORI_NOTE v6.5" || first.startsWith("SATORI_NOTE v6."))) {
    return { error: "Invalid format: first line must be 'SATORI_NOTE v6.5'." };
  }

  // Prompt-injection screening on the normalized view, per line and across
  // the whole note, so multiline payloads cannot evade by splitting a marker.
  const normalizedLines = lines.map(normalizeTextForInjectionCheck);
  const normalizedWhole = normalizeTextForInjectionCheck(lines.join(" "));
  for (let idx = 0; idx < normalizedLines.length; idx += 1) {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(normalizedLines[idx])) {
        return { error: `Security rejection: prompt injection marker detected in imported note.` };
      }
    }
  }
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(normalizedWhole)) {
      return {
        error: "Security rejection: prompt injection marker detected across multiple lines of imported note.",
      };
    }
  }

  // Structural delimiter-injection hardening: forged headers and fencing.
  for (let idx = 1; idx < lines.length; idx += 1) {
    const line = lines[idx];
    if (line.toLowerCase().includes("satori_note")) {
      return { error: "Security rejection: forged SATORI_NOTE header inside note body." };
    }
    if (line.startsWith("---") || line.includes("```")) {
      return { error: "Security rejection: delimiter injection in imported note." };
    }
  }

  const allowlist = new Set([
    "theme",
    "stance",
    "lens",
    "step",
    "anchor_question",
    "session_count",
    "created",
    "arc",
  ]);
  const parsed = {};
  for (const line of lines.slice(1)) {
    const colon = line.indexOf(":");
    if (colon <= 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim().replace(INVISIBLE_CHARS_RE, "");
    if (allowlist.has(key)) parsed[key] = value;
  }

  const theme = (parsed.theme ?? "Imported Session").slice(0, 60);
  let stance = (parsed.stance ?? "balanced").toLowerCase();
  if (!["mirror", "balanced", "candid"].includes(stance)) stance = "balanced";
  const lens = (parsed.lens ?? "stoic").slice(0, 40);
  let step = (parsed.step ?? "anchor").toLowerCase();
  if (!["attune", "clarify", "formulate", "integrate", "translate", "anchor"].includes(step)) {
    step = "anchor";
  }
  const anchorQ = (parsed.anchor_question ?? "").slice(0, 140);
  let sessionCount = Number.parseInt(parsed.session_count ?? "1", 10);
  if (!Number.isInteger(sessionCount) || sessionCount < 1) sessionCount = 1;
  const created = parsed.created ?? today();
  let arcSignal = parsed.arc ?? "";
  if (arcSignal && !ARC_FIELD_SAFE_RE.test(arcSignal.toLowerCase())) {
    // Data-only arc field must be a compact status=count line; drop anything else.
    arcSignal = "";
  }

  let summaryText = `Imported continuity note (${lens}, step=${step}). Anchor: ${anchorQ}`;
  if (arcSignal) summaryText += ` Arc: ${arcSignal}.`;
  let summaryClean;
  try {
    summaryClean = sanitizeSummary(summaryText);
  } catch (err) {
    return { error: err.message };
  }

  const outcome = logSignal(vaultDir, {
    theme,
    layer: "pattern",
    summary: summaryClean,
    session_date: created,
    ephemeral: false,
  });
  if (outcome.error !== undefined) return { error: outcome.error };

  return {
    payload: {
      status: "imported",
      theme,
      stance,
      lens,
      step,
      session_count: sessionCount,
      arc: arcSignal,
    },
  };
}

/**
 * The memory instructions appended to every conversation's seed: they tell
 * the model how this host replaces the memory engine's CLI, and restate the
 * consent gating the protocol demands. The protocol itself stays in the
 * skill package (`references/memory-system.md`), which the model loads
 * itself through the scoped read tool.
 */
export const HOST_MEMORY_INSTRUCTIONS = `

---

## Memory in this host (SatoriWeb)

This host has no shell, so \`scripts/satori_memory.py\` is unavailable. The signed-in person's memory lives in their own isolated vault, reachable only through these tools, which act for the person you are currently serving and cannot read or write anywhere else:

- \`vault_status\` — the person's active signals and dream-layer watch (\`satori_memory.py status\`).
- \`vault_search\` — search their longitudinal history (\`search --query "<keyword>" --limit 5\`).
- \`vault_log_signal\` — record a structural signal \`{theme, layer, summary}\` (\`log-signal\`).
- \`vault_review\` — a human-readable review of everything remembered, with ids the person can ask you to forget (\`review\`).
- \`vault_arc\` — the gentle, non-coercive Graduation Signal: how remembered themes are moving, surfacing (never pushing) when once-strong themes have gone quiet (\`arc\`).
- \`vault_forget\` — delete a record by id (or matching theme/session) when the person asks, with secure deletion (\`forget --id <id>\`).

Follow \`references/memory-system.md\` exactly: consult the vault when continuity matters, never announcing "accessing memory"; write only with the person's consent — when they say "off the record" or "don't remember this", pass \`ephemeral: true\` so nothing is written, or do not call the tool at all; store structural patterns of at most 500 characters, never raw transcripts, third-party names, or unconsented disclosures; count dream-layer themes 1 → 2 → 3 before surfacing them.
`;

/**
 * Builds the vault tool extension. `userFor(conversationId)` resolves the
 * signed-in user who owns a conversation; the tools are then scoped to that
 * user's vault alone, whatever the model asks for.
 */
export function createVaultTools({ vaultRoot, userFor }) {
  /** The vault the current conversation's owner owns, or null with a refusal. */
  function scope(api) {
    const user = userFor(api.conversationId);
    return user === null ? null : userVaultDir(vaultRoot, user);
  }

  const vaultStatus = defineTool({
    name: "vault_status",
    description:
      "Check the signed-in person's Satori memory vault: active signals and the dream-layer watch, " +
      "the equivalent of `python scripts/satori_memory.py status`. Read-only, and scoped to this " +
      "person's vault only. Consult it when continuity matters, never announcing it.",
    parameters: obj({}),
    replay: "safe",
    async execute(_args, api) {
      const vaultDir = scope(api);
      if (vaultDir === null) {
        return errorResult("This conversation has no signed-in person, so there is no memory vault to read.");
      }
      return jsonResult(statusPayload(vaultDir));
    },
  });

  const vaultLogSignal = defineTool({
    name: "vault_log_signal",
    description:
      "Record a structural signal to the signed-in person's memory vault, the equivalent of " +
      "`python scripts/satori_memory.py log-signal --theme \"<theme>\" --layer <layer> --summary \"<pattern>\"`. " +
      "The vault is this person's alone; there is no way to write anywhere else. Consent-gated: when the " +
      "person asks to stay off the record, pass ephemeral: true and nothing is written to disk. " +
      "Summaries are structural patterns of at most 500 characters — never raw transcripts, " +
      "third-party names, or unconsented disclosures.",
    parameters: obj({
      theme: str({
        description:
          "Short theme label, e.g. 'perfectionism as armor'. Repeats of the same theme recur and promote.",
      }),
      layer: str({
        pattern: LAYER_PATTERN,
        description:
          "Memory layer: 'signal' (first observation), 'theme' (confirmed pattern), " +
          "'pattern' (cross-session core), or 'dream' (background watch, surfaced only at count 3+).",
      }),
      summary: str({
        description:
          "The structural pattern, <=500 chars, e.g. 'Over-functioning to preserve peace in close bonds'.",
      }),
      ephemeral: opt(
        bool({
          description:
            "True when the person asked to stay off the record ('don't remember this'): " +
            "the moment is acknowledged and nothing is written to disk.",
        }),
      ),
      session_date: opt(
        str({ description: "ISO date (YYYY-MM-DD) the signal belongs to; today by default." }),
      ),
    }),
    replay: "unsafe", // a rerun would double-count a recurrence
    // The memory engine is a single-writer protocol: recurrence counting is
    // only correct when writes to the same vault run one after another.
    executionMode: "sequential",
    async execute(args, api) {
      const vaultDir = scope(api);
      if (vaultDir === null) {
        return errorResult("This conversation has no signed-in person, so there is no memory vault to write.");
      }
      try {
        const outcome = logSignal(vaultDir, args);
        if (outcome.error !== undefined) return errorResult(outcome.error);
        return jsonResult(outcome.payload);
      } catch (err) {
        return errorResult(`The vault refused this write: ${err.message}`);
      }
    },
  });

  const vaultSearch = defineTool({
    name: "vault_search",
    description:
      "Search the signed-in person's longitudinal memory history, the equivalent of " +
      "`python scripts/satori_memory.py search --query \"<keyword>\" --limit 5`. Scoped to this " +
      "person's vault only.",
    parameters: obj({
      query: str({ description: "Keyword or phrase to look for, e.g. 'armor'." }),
      limit: opt(int({ minimum: 1, maximum: 50, description: "Maximum results; default 5." })),
    }),
    replay: "safe",
    async execute(args, api) {
      const vaultDir = scope(api);
      if (vaultDir === null) {
        return errorResult("This conversation has no signed-in person, so there is no memory vault to search.");
      }
      return jsonResult(searchPayload(vaultDir, args.query.trim(), args.limit ?? 5));
    },
  });

  const vaultReview = defineTool({
    name: "vault_review",
    description:
      "A human-readable review of what you remember about the signed-in person: active themes " +
      "and patterns with their ids and counts, the dream-layer watch, and structural summary previews. " +
      "The equivalent of `python scripts/satori_memory.py review`. Read-only, scoped to this " +
      "person's vault, and never containing raw transcripts. Offer it when the person asks what you " +
      "remember; the ids it reports are exactly what vault_forget accepts.",
    parameters: obj({}),
    replay: "safe",
    async execute(_args, api) {
      const vaultDir = scope(api);
      if (vaultDir === null) {
        return errorResult("This conversation has no signed-in person, so there is no memory vault to review.");
      }
      return jsonResult(reviewPayload(vaultDir));
    },
  });

  const vaultArc = defineTool({
    name: "vault_arc",
    description:
      "The Graduation Signal: how the signed-in person's remembered themes are moving " +
      "(emerging, shifting, stabilized, dormant), and the gentle surfacing of a graduation window " +
      "when themes that once recurred strongly have gone quiet. The equivalent of " +
      "`python scripts/satori_memory.py arc`. Non-coercive by design: it only surfaces movement, " +
      "it never pushes or demands action, and it is offered only when the person asks about their " +
      "longer arc or where their inner work stands.",
    parameters: obj({}),
    replay: "safe",
    async execute(_args, api) {
      const vaultDir = scope(api);
      if (vaultDir === null) {
        return errorResult("This conversation has no signed-in person, so there is no memory vault to read.");
      }
      return jsonResult(arcPayload(vaultDir));
    },
  });

  const vaultForget = defineTool({
    name: "vault_forget",
    description:
      "Delete memory records from the signed-in person's vault when they ask you to forget something: " +
      "by record id, or by matching theme text, or by session date. The equivalent of " +
      "`python scripts/satori_memory.py forget --id <id>`. Secure deletion: records are removed " +
      "under secure_delete and the vault is vacuumed, so nothing survives on disk. Only ever call " +
      "this when the person explicitly asks; report what was forgotten.",
    parameters: obj({
      id: opt(int({ minimum: 1, description: "Record id to forget, as reported by vault_review." })),
      theme: opt(
        str({ description: "Forget records whose theme or summary contains this text." }),
      ),
      session: opt(str({ description: "ISO date (YYYY-MM-DD) whose records should be forgotten." })),
    }),
    replay: "unsafe", // a rerun would double-delete
    executionMode: "sequential",
    async execute(args, api) {
      const vaultDir = scope(api);
      if (vaultDir === null) {
        return errorResult("This conversation has no signed-in person, so there is no memory vault to change.");
      }
      if (args.id === undefined && args.theme === undefined && args.session === undefined) {
        return errorResult("vault_forget needs one of id, theme, or session.");
      }
      try {
        const outcome = forgetEntries(vaultDir, args);
        if (outcome.error !== undefined) return errorResult(outcome.error);
        return jsonResult(outcome.payload);
      } catch (err) {
        return errorResult(`The vault refused this deletion: ${err.message}`);
      }
    },
  });

  return defineExtension({
    name: "satori-vault",
    tools: [vaultStatus, vaultLogSignal, vaultSearch, vaultReview, vaultArc, vaultForget],
  });
}

/**
 * The HTTP-facing memory surface for one user's vault: the same payloads the
 * tools serve, resolved by the server from the signed-in session (never
 * from anything a request supplies). Exported so server.js can expose the
 * Memory & Continuity drawer endpoints with identical semantics.
 */
export function createUserVault(vaultRoot, user) {
  const vaultDir = userVaultDir(vaultRoot, user);
  return {
    dir: vaultDir,
    review: (limit) => reviewPayload(vaultDir, limit),
    arc: () => arcPayload(vaultDir),
    forget: (selector) => forgetEntries(vaultDir, selector),
    exportNote: () => exportNote(vaultDir),
    importNote: (rawText) => importNote(vaultDir, rawText),
  };
}
