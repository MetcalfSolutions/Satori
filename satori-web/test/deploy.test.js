import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readConfig } from "../src/config.js";
import { bootTestServer, cookieJar } from "./helpers.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const UNIT_PATH = path.join(repoRoot, "systemd", "satoriweb.service.example");

/** Parses a unit file into flat key=value lines per section. */
function parseUnit(text) {
  const sections = {};
  let section = null;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/;.*$/, "").trim();
    if (line.length === 0) continue;
    if (line.startsWith("[") && line.endsWith("]")) {
      section = line.slice(1, -1);
      sections[section] = [];
    } else if (section) {
      sections[section].push(line);
    }
  }
  return sections;
}

/** Parses a text/event-stream body into { event, data } frames. */
function parseSse(body) {
  return body
    .split("\n\n")
    .map((frame) => frame.trim())
    .filter((frame) => frame.length > 0)
    .map((frame) => {
      const event = /^event: (.*)$/m.exec(frame)?.[1] ?? "message";
      const data = /^data: (.*)$/m.exec(frame)?.[1] ?? "{}";
      return { event, data: JSON.parse(data) };
    });
}

/** This node's tailscale interface address, or null when there is no tailnet. */
function tailscaleAddress() {
  const iface = os.networkInterfaces().tailscale0;
  return iface?.find((addr) => addr.family === "IPv4")?.address ?? null;
}

const tailnetIp = tailscaleAddress();

test("the committed unit template pins the sanitized deployment contract", async () => {
  const unit = parseUnit(await fs.readFile(UNIT_PATH, "utf8"));

  // The service runs the server from a generic checkout with a generic user
  // placeholder: no personal usernames, hosts, or home paths anywhere.
  const execStart = unit.Service.find((line) => line.startsWith("ExecStart="));
  assert.ok(execStart, "unit template has an ExecStart");
  assert.match(execStart, /node .*\bsrc\/server\.js/);
  const workingDirectory = unit.Service.find((line) => line.startsWith("WorkingDirectory="));
  assert.match(workingDirectory ?? "", /\/path\/to\/Satori\/satori-web$/);
  const user = unit.Service.find((line) => line.startsWith("User="));
  assert.equal(user, "User=<YOUR_USER>");

  // It survives crashes and retries through early boot (bind waits for tailscaled).
  assert.ok(unit.Service.includes("Restart=on-failure"));
  assert.ok(unit.Unit.includes("StartLimitIntervalSec=0"));

  // Enabled at machine boot: user-unit default target (plus README lingering).
  assert.ok(unit.Install.includes("WantedBy=default.target"));

  // Tailnet-only reachability is documented as a placeholder the host fills
  // with their own tailscale address; never a public or LAN bind.
  const bind = unit.Service
    .find((line) => line.startsWith("Environment=SATOWEB_BIND="))
    ?.split("=", 3)[2];
  assert.ok(bind, "unit template sets SATOWEB_BIND");
  assert.match(bind, /TAILSCALE_IP/);

  // The Satori skill is the repository checkout itself: no vendored clone.
  const skillPath = unit.Service
    .find((line) => line.startsWith("Environment=SATOWEB_SKILL_PATH="))
    ?.split("=", 3)[2];
  assert.equal(skillPath, "/path/to/Satori");

  // Keys are read at runtime from the environment or the pi auth store:
  // never in the unit file.
  for (const secret of ["API_KEY=", "TOKEN=", "SECRET="]) {
    assert.ok(
      !unit.Service.some((line) => line.includes(secret)),
      `unit template must not embed ${secret} values`,
    );
  }
});

test(
  "a tailnet visitor signs in and completes a streaming chat session over the tailscale interface",
  { skip: tailnetIp ? false : "no tailscale0 interface on this machine" },
  async () => {
    // The strongest local equivalent of the friend flow: every request goes
    // to the tailscale interface address, exactly as a tailnet peer's would.
    const reply = "Welcome. What is sitting with you tonight?";
    const server = await bootTestServer({
      bind: tailnetIp,
      stubResponses: [{ text: reply }],
      inviteCodes: ["tailnet-test-code"],
    });
    try {
      const root = `http://${tailnetIp}:${server.port}`;

      // The sign-in screen is served to a tailnet visitor, with the invite
      // step ready for deployments that gate registration.
      const page = await fetch(`${root}/`);
      assert.equal(page.status, 200);
      const html = await page.text();
      for (const marker of [
        'id="sign-in"',
        'id="auth-name"',
        'id="auth-pin"',
        'id="auth-invite-field"',
        'id="auth-register"',
      ]) {
        assert.ok(html.includes(marker), `expected ${marker} in the page`);
      }

      // Health and registration policy, then sign-in carried by the cookie.
      // The tailnet bind is non-loopback, so the fail-closed default applies:
      // registration answers only to the configured invite code.
      const health = await (await fetch(`${root}/api/health`)).json();
      assert.equal(health.status, "alive");
      assert.equal(health.inviteRequired, true);
      const jar = cookieJar();
      const refused = await fetch(`${root}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `tailnet-friend-${Date.now()}`, pin: "4321" }),
      });
      assert.equal(refused.status, 403, "a non-loopback bind without a code must refuse signups");
      const register = await fetch(`${root}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `tailnet-friend-${Date.now()}`,
          pin: "4321",
          inviteCode: "tailnet-test-code",
        }),
      });
      assert.equal(register.status, 200);
      jar.capture(register);

      // New conversation, then a full streaming chat session.
      const conversation = await (
        await fetch(`${root}/api/conversations`, {
          method: "POST",
          headers: { Cookie: jar.header() },
        })
      ).json();
      const stream = await fetch(
        `${root}/api/conversations/${conversation.id}/submit`,
        {
          method: "POST",
          headers: {
            Cookie: jar.header(),
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({ prompt: "Hello Satori." }),
        },
      );
      assert.equal(stream.status, 200);
      const body = await stream.text();
      assert.ok(body.includes(reply), `expected the streamed reply in: ${body}`);
      const events = parseSse(body);
      const message = events.find((frame) => frame.event === "message");
      assert.equal(message?.data?.text, reply);

      // Tailnet-only by construction: nothing listens on loopback.
      await assert.rejects(
        fetch(`http://127.0.0.1:${server.port}/api/health`),
        (err) => err.cause?.code === "ECONNREFUSED",
      );
    } finally {
      await server.close();
    }
  },
);

test("README documents install, providers, invite codes, tailnet and tunnel hosting", async () => {
  const readme = await fs.readFile(path.join(repoRoot, "README.md"), "utf8");

  // Install + service enablement.
  for (const marker of [
    "npm install",
    "cp systemd/satoriweb.service.example",
    "systemctl --user daemon-reload",
    "systemctl --user enable --now satoriweb",
    "loginctl enable-linger",
  ]) {
    assert.ok(readme.includes(marker), `README must cover: ${marker}`);
  }

  // Every operational knob, named and default-documented.
  for (const variable of [
    "PORT",
    "SATOWEB_BIND",
    "SATOWEB_DB_PATH",
    "SATOWEB_SKILL_PATH",
    "SATOWEB_VAULT_ROOT",
    "SATOWEB_PROVIDER",
    "SATOWEB_MODEL_ID",
    "SATOWEB_THINKING_LEVEL",
    "SATOWEB_HOST_TOKEN",
    "SATOWEB_INVITE_CODE",
    "SATOWEB_ALLOW_OPEN_SIGNUP",
    "OPENCODE_GO_API_KEY",
    "GEMINI_API_KEY",
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "OPENAI_BASE_URL",
    "OPENROUTER_API_KEY",
  ]) {
    assert.ok(readme.includes(variable), `README must document ${variable}`);
  }
  assert.ok(readme.includes("8787"), "README documents the default port");
  assert.ok(readme.includes("minimax-m3"), "README documents the default model");

  // Every supported provider is documented.
  for (const provider of ["opencode-go", "gemini", "anthropic", "openai", "openrouter", "stub"]) {
    assert.ok(
      readme.includes(`"${provider}"`) || readme.includes(provider),
      `README documents the ${provider} provider`,
    );
  }

  // Friend onboarding on the tailnet, and the Cloudflare Tunnel alternative.
  assert.ok(
    /tailscale (join|invite)/i.test(readme),
    "README tells the host how to invite a friend to the tailnet",
  );
  assert.ok(
    readme.includes("tailscale ip -4"),
    "README shows how to find the tailnet URL",
  );
  assert.ok(
    /cloudflared/.test(readme),
    "README documents Cloudflare Tunnel hosting",
  );

  // The skill is the repository itself: the README says so without a vendored
  // clone step.
  assert.ok(
    /repository root|repo root|repository checkout/i.test(readme),
    "README documents that the skill is read from the repository root",
  );
});

test("readConfig maps SATOWEB_BIND to the bind address", () => {
  const config = readConfig({ SATOWEB_BIND: "127.0.0.2" });
  assert.equal(config.bind, "127.0.0.2");
});

test("bind defaults to loopback when SATOWEB_BIND is unset", () => {
  const config = readConfig({});
  assert.equal(config.bind, "127.0.0.1");
});

test("the skill root defaults to the repository root, with no vendored clone", () => {
  const config = readConfig({});
  // src/config.js lives at <repo>/satori-web/src: the default skill path is
  // the Satori checkout one level above satori-web/.
  assert.equal(
    config.skillPath,
    path.resolve(repoRoot, ".."),
  );
  assert.ok(
    !config.skillPath.includes("vendor"),
    "the default skill path must not point at a vendored clone",
  );
});

test("the server listens on its bind address and nowhere else on this host", async () => {
  // 127.0.0.2 is loopback /8: always bindable, never reachable off-host, so
  // this pins binding behavior without depending on any interface state.
  const server = await bootTestServer({ bind: "127.0.0.2" });
  try {
    const res = await fetch(`http://127.0.0.2:${server.port}/api/health`);
    assert.equal(res.status, 200);
    const health = await res.json();
    assert.equal(health.status, "alive");

    // Loopback proper does not have the listener: binding is exclusive.
    await assert.rejects(
      fetch(`http://127.0.0.1:${server.port}/api/health`),
      (err) => err.cause?.code === "ECONNREFUSED",
    );
  } finally {
    await server.close();
  }
});
