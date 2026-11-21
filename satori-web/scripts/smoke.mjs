// Manual smoke check: one live model round-trip end to end.
//
// Boots the real server (opencode-go provider, default model)
// against a temporary SQLite database, drives it purely over HTTP, and
// asserts a real model reply lands in the entry history.
//
// Run with: npm run smoke
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { startServer } from "../src/server.js";
import { DEFAULTS } from "../src/config.js";

const dir = await fs.mkdtemp(path.join(os.tmpdir(), "satoriweb-smoke-"));
const hostToken = "smoke-host-token";
const server = await startServer({
  port: 0,
  dbPath: path.join(dir, "smoke.sqlite"),
  provider: "opencode-go",
  modelId: DEFAULTS.modelId,
  thinkingLevel: DEFAULTS.thinkingLevel,
  skillPath: process.env.SATOWEB_SKILL_PATH ?? DEFAULTS.skillPath,
  hostToken,
});

const base = `http://127.0.0.1:${server.port}`;

// The smoke session signs in like a friend would: register, then carry the cookie.
const registered = await fetch(`${base}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: `smoke-${Date.now()}`, pin: "9876" }),
});
if (registered.status !== 200) throw new Error("smoke registration failed");
const cookie = registered.headers.getSetCookie()[0].split(";")[0];
const authed = { Cookie: cookie };

try {
  const health = await (await fetch(`${base}/api/health`)).json();
  console.log("health:", JSON.stringify(health));
  if (health.status !== "alive") throw new Error("server not alive");

  const { id } = await (
    await fetch(`${base}/api/conversations`, {
      method: "POST",
      headers: authed,
    })
  ).json();

  const submit = await fetch(`${base}/api/conversations/${id}/submit`, {
    method: "POST",
    headers: { ...authed, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt:
        "Reply with exactly one short sentence: what are you, in a word or two?",
    }),
  });
  const submitted = await submit.json();
  console.log("submit:", JSON.stringify(submitted));
  if (submitted.status !== "done") throw new Error("submission did not finish");

  const entries = await (
    await fetch(`${base}/api/conversations/${id}/entries`, { headers: authed })
  ).json();
  const assistant = entries.find((entry) => entry.kind === "assistant");
  console.log("assistant reply:", JSON.stringify(assistant?.content));
  if (!assistant?.content || assistant.content.trim().length === 0) {
    throw new Error("no assistant reply in entry history");
  }
  if (assistant.thinking !== undefined) {
    throw new Error("thinking leaked into the client-facing entries payload");
  }
  const log = await (
    await fetch(`${base}/api/conversations/${id}/log`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    })
  ).json();
  const logged = log.find((entry) => entry.kind === "assistant");
  if (logged?.thinking) {
    console.log(
      "thinking stored host-side:",
      JSON.stringify(logged.thinking.slice(0, 120)),
    );
  }
  console.log("SMOKE OK: live model round-trip succeeded");
} finally {
  await server.close();
  await fs.rm(dir, { recursive: true, force: true });
}
