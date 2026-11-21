import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { startServer } from "../src/server.js";

/* ---------- throwaway state ---------- */

/** A throwaway temp directory. */
export async function tempDir(prefix = "satoriweb-") {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

/** A throwaway SQLite database path in a temp directory. */
export async function tempDbPath() {
  return path.join(await tempDir("satoriweb-test-"), "test.sqlite");
}

/* ---------- the scripted-stub boot and skill fixture ---------- */

/**
 * A stand-in Satori skill package: an entry file whose distinctive marker must
 * reach the model as instructions, a grief reference with its own marker, the
 * crisis-safety docs the model must be able to reach through the read tool,
 * and a secret file *outside* the skill root the scoped read tool must refuse.
 */
export async function createSkillFixture() {
  const dir = await tempDir("satoriweb-skill-");
  const root = path.join(dir, "skill");
  await fs.mkdir(path.join(root, "references"), { recursive: true });
  const seedMarker = "TURN-ONE-ENTRY: the test wisdom companion entry point";
  await fs.writeFile(
    path.join(root, "SKILL.md"),
    `# Test Satori\n\n${seedMarker}\n\nLoad references on demand when a conversation calls for them.\n`,
  );
  const griefMarker = "unhurried, non-corrective witnessing";
  await fs.writeFile(
    path.join(root, "references/grief-protocol.md"),
    `# Grief Protocol\n\nSatori's primary gift in grief is ${griefMarker}.\n`,
  );
  const safetyMarker = "CRISIS-SAFETY: three-tier response model";
  await fs.writeFile(
    path.join(root, "SAFETY.md"),
    `# Safety Policy\n\n${safetyMarker}; acute risk defers to human care.\n`,
  );
  const crisisSourcesMarker = "verified regional helplines";
  await fs.writeFile(
    path.join(root, "references/crisis-sources.json"),
    `{"description": "${crisisSourcesMarker}"}\n`,
  );
  const secretMarker = "SECRET-HOST-FILE-CONTENT";
  await fs.writeFile(path.join(dir, "outside-secret.txt"), secretMarker);
  return { root, seedMarker, griefMarker, safetyMarker, crisisSourcesMarker, secretMarker };
}

/**
 * Boots a SatoriWeb server against a throwaway database, a throwaway skill
 * fixture, and a throwaway vault root, with the scripted stub model — the
 * test seam, through the same provider-registration path as the real model.
 */
export async function bootTestServer(overrides = {}) {
  return startServer({
    port: 0,
    dbPath: overrides.dbPath ?? (await tempDbPath()),
    skillPath: overrides.skillPath ?? (await createSkillFixture()).root,
    vaultRoot: overrides.vaultRoot ?? path.join(await tempDir("satoriweb-vault-"), "vaults"),
    provider: "stub",
    stubResponses: overrides.stubResponses ?? [],
    hostToken: overrides.hostToken ?? "test-host-token",
    ...overrides,
  });
}

/* ---------- auth at the HTTP seam ---------- */

/** A minimal cookie jar so tests can carry a session across requests. */
export function cookieJar() {
  const cookies = new Map();
  return {
    capture(res) {
      for (const setCookie of res.headers.getSetCookie()) {
        const pair = setCookie.split(";")[0];
        const eq = pair.indexOf("=");
        cookies.set(pair.slice(0, eq), pair.slice(eq + 1));
      }
    },
    header() {
      return [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
    },
  };
}

/** Registers a fresh account and returns its cookie jar (unique name per call). */
export async function registerUser(server, name) {
  const jar = cookieJar();
  const res = await fetch(`http://127.0.0.1:${server.port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, pin: `${Math.floor(Math.random() * 9000) + 1000}` }),
  });
  jar.capture(res);
  assert.equal(res.status, 200, `registering ${name} failed`);
  return jar;
}

/* ---------- the conversation API surface ---------- */

export async function createConversation(server, jar) {
  const res = await fetch(`http://127.0.0.1:${server.port}/api/conversations`, {
    method: "POST",
    headers: { Cookie: jar.header() },
  });
  assert.equal(res.status, 200);
  return res.json();
}

export async function submitPrompt(server, jar, conversationId, prompt) {
  const res = await fetch(
    `http://127.0.0.1:${server.port}/api/conversations/${conversationId}/submit`,
    {
      method: "POST",
      headers: { Cookie: jar.header(), "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    },
  );
  assert.equal(res.status, 200);
  return res.json();
}

export async function getEntries(server, jar, conversationId) {
  const res = await fetch(
    `http://127.0.0.1:${server.port}/api/conversations/${conversationId}/entries`,
    { headers: { Cookie: jar.header() } },
  );
  assert.equal(res.status, 200);
  return res.json();
}

/** Host-only debug view of the durable log (includes thinking and tool activity). */
export async function getHostLog(server, jar, conversationId) {
  const res = await fetch(
    `http://127.0.0.1:${server.port}/api/conversations/${conversationId}/log`,
    {
      headers: {
        Cookie: jar.header(),
        Authorization: "Bearer test-host-token",
      },
    },
  );
  assert.equal(res.status, 200);
  return res.json();
}
