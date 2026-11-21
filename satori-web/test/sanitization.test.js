import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The sanitization leak guard: nothing personal about any deployment host
 * may ever ship inside satori-web/. Zero Tailscale/CGNAT IP literals, zero
 * personal usernames, zero absolute home-directory paths, zero em dashes in
 * the Beta docs. The Beta ships sanitized placeholders instead
 * (`<YOUR_TAILSCALE_IP>`, `<YOUR_USER>`, `~`, `/path/to/Satori`).
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Directories never scanned: dependencies and local runtime state. */
const SKIPPED_DIRS = new Set(["node_modules", ".git", ".scratch", "dist"]);

/** Leak patterns. Each must have zero matches across the shipped tree. */
const LEAK_PATTERNS = [
  {
    name: "Tailscale/CGNAT IP literal (100.x.x.x)",
    pattern: /\b100\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  },
  {
    name: "Tailscale MagicDNS hostname (*.ts.net)",
    pattern: /\b[a-z0-9-]+\.[a-z0-9-]+\.ts\.net\b/i,
  },
  { name: "absolute home-directory path (/home/...)", pattern: /\/home\// },
  { name: "absolute root-user path (/Users/...)", pattern: /\/Users\// },
];

for (const token of (process.env.SATOWEB_FORBIDDEN_STRINGS || "").split(",").map((s) => s.trim()).filter(Boolean)) {
  LEAK_PATTERNS.push({
    name: `configured forbidden token (${token.length} chars)`,
    pattern: new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
  });
}

/** Text files whose content the guard reads and screens. */
const TEXT_EXTENSIONS = new Set([
  ".js", ".mjs", ".cjs", ".json", ".md", ".html", ".css", ".svg", ".txt",
  ".example", ".service", ".yml", ".yaml", ".toml", ".gitignore", ".env",
]);

function isTextFile(filePath) {
  if (filePath === path.join(repoRoot, ".gitignore")) return true;
  const ext = path.extname(filePath);
  if (TEXT_EXTENSIONS.has(ext)) return true;
  // Extensionless files (e.g. systemd unit examples) are read as text.
  return ext === "";
}

/** Every shipped file under satori-web/, excluding local-only state and the guard itself. */
async function collectFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIPPED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await collectFiles(fullPath)));
    } else if (entry.isFile() && fullPath !== fileURLToPath(import.meta.url)) {
      // The guard never scans itself: its own pattern documentation is not a leak.
      out.push(fullPath);
    }
  }
  return out;
}

test("the shipped tree leaks no personal IPs, usernames, or home paths", async () => {
  const files = await collectFiles(repoRoot);
  assert.ok(files.length > 10, `expected a real source tree, got ${files.length} files`);

  const violations = [];
  for (const filePath of files) {
    if (!isTextFile(filePath)) continue;
    const relative = path.relative(repoRoot, filePath);
    let content;
    try {
      content = await fs.readFile(filePath, "utf8");
    } catch {
      continue; // unreadable (binary or permission): not screenable text
    }
    for (const { name, pattern } of LEAK_PATTERNS) {
      const match = pattern.exec(content);
      if (match) {
        violations.push(`${relative}: ${name} ("${match[0]}")`);
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `personal data leaked into the shipped tree:\n  ${violations.join("\n  ")}`,
  );
});

test("the Beta README and systemd template ship sanitized placeholders, no em dashes", async () => {
  const targets = [
    path.join(repoRoot, "README.md"),
    path.join(repoRoot, "systemd", "satoriweb.service.example"),
  ];
  const emDash = String.fromCharCode(0x2014);

  for (const target of targets) {
    const content = await fs.readFile(target, "utf8");
    assert.ok(!content.includes(emDash), `${path.basename(target)} must not use em dashes`);
    assert.ok(!content.includes("&mdash;"), `${path.basename(target)} must not use mdash entities`);
    for (const { name, pattern } of LEAK_PATTERNS) {
      const match = pattern.exec(content);
      assert.equal(
        match,
        null,
        `${path.basename(target)} leaks ${name}: "${match?.[0] ?? ""}"`,
      );
    }
  }

  // The deployment docs point at placeholders, never at a real address.
  const unit = await fs.readFile(path.join(repoRoot, "systemd", "satoriweb.service.example"), "utf8");
  assert.ok(
    unit.includes("Environment=SATOWEB_BIND="),
    "the unit template must document the tailnet-only bind",
  );
  assert.match(unit, /SATOWEB_BIND=\S*TAILSCALE_IP\S*/);
});
