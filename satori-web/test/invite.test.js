import { test } from "node:test";
import assert from "node:assert/strict";

import {
  createInviteGate,
  isLoopbackBind,
  requestIp,
  signupPolicy,
} from "../src/invite.js";
import { parseInviteCodes, readConfig } from "../src/config.js";
import { bootTestServer, tempDbPath } from "./helpers.js";

/* ---------- Policy classification (pure) ---------- */

test("loopback binds classify as loopback, everything else does not", () => {
  for (const bind of ["127.0.0.1", "127.0.0.2", "localhost", "LOCALHOST", "::1", "::ffff:127.0.0.1"]) {
    assert.ok(isLoopbackBind(bind), `expected ${bind} to be loopback`);
  }
  for (const bind of ["0.0.0.0", "192.168.1.20", "192.0.2.10", "tailscale-host", "::"]) {
    assert.ok(!isLoopbackBind(bind), `expected ${bind} to be non-loopback`);
  }
});

test("signup policy is fail-closed on non-loopback without codes or opt-in", () => {
  // Loopback dev runs stay open.
  assert.deepEqual(signupPolicy({ bind: "127.0.0.1", inviteCodes: [] }), {
    mode: "open",
    inviteRequired: false,
  });
  // Any non-loopback bind without a code and without the explicit opt-in is
  // closed: registration refuses new accounts outright.
  const closed = signupPolicy({ bind: "192.0.2.10", inviteCodes: [] });
  assert.equal(closed.mode, "closed");
  assert.equal(closed.inviteRequired, true);
  // The explicit opt-in reopens it.
  assert.equal(
    signupPolicy({ bind: "192.0.2.10", inviteCodes: [], allowOpenSignup: true }).mode,
    "open",
  );
  // A configured code always wins: the deployment is invite-gated.
  const invited = signupPolicy({ bind: "0.0.0.0", inviteCodes: ["code"] });
  assert.equal(invited.mode, "invite");
  assert.equal(invited.inviteRequired, true);
});

test("readConfig parses invite codes (single and comma-separated) and the open-signup opt-in", () => {
  assert.deepEqual(readConfig({ SATOWEB_INVITE_CODE: "one-code" }).inviteCodes, ["one-code"]);
  assert.deepEqual(
    readConfig({ SATOWEB_INVITE_CODE: " alpha , beta ,,  " }).inviteCodes,
    ["alpha", "beta"],
  );
  assert.deepEqual(readConfig({ SATOWEB_INVITE_CODE: " , ," }).inviteCodes, []);
  assert.equal(readConfig({ SATOWEB_ALLOW_OPEN_SIGNUP: "1" }).allowOpenSignup, true);
  assert.equal(readConfig({ SATOWEB_ALLOW_OPEN_SIGNUP: "0" }).allowOpenSignup, false);
  assert.equal(readConfig({}).allowOpenSignup, false);
});

test("parseInviteCodes drops empty entries and trims whitespace", () => {
  assert.deepEqual(parseInviteCodes(undefined), []);
  assert.deepEqual(parseInviteCodes("  x , y "), ["x", "y"]);
});

/* ---------- The gate itself (pure) ---------- */

test("the gate verifies codes timing-safely and refuses the wrong ones", () => {
  const gate = createInviteGate({
    bind: "0.0.0.0",
    inviteCodes: ["first-code", "second-code"],
  });
  assert.equal(gate.policy.mode, "invite");
  assert.ok(gate.checkRegistration({ ip: "10.0.0.1", inviteCode: "first-code" }).ok);
  assert.ok(gate.checkRegistration({ ip: "10.0.0.1", inviteCode: "second-code" }).ok);
  // A missing or wrong code is a 403, never a 500.
  for (const bad of [undefined, "", "wrong", "FIRST-CODE"]) {
    const outcome = gate.checkRegistration({ ip: "10.0.0.1", inviteCode: bad });
    assert.equal(outcome.ok, false, `expected refusal for ${JSON.stringify(bad)}`);
    assert.equal(outcome.status, 403);
  }
});

test("a source past its failed-attempt budget is refused even with the right code", () => {
  const gate = createInviteGate({
    bind: "0.0.0.0",
    inviteCodes: ["the-code"],
    maxFailedAttempts: 3,
    windowMs: 60 * 60 * 1000,
  });
  for (let i = 0; i < 3; i += 1) {
    assert.equal(gate.checkRegistration({ ip: "10.9.9.9", inviteCode: "nope" }).status, 403);
  }
  // The budget is spent: even the correct code is now a 429 for this source.
  assert.deepEqual(gate.checkRegistration({ ip: "10.9.9.9", inviteCode: "the-code" }), {
    ok: false,
    status: 429,
    error: "Too many failed attempts. Try again later.",
  });
  // Another source is unaffected.
  assert.ok(gate.checkRegistration({ ip: "10.8.8.8", inviteCode: "the-code" }).ok);
});

test("the closed gate refuses every registration without counting codes", () => {
  const gate = createInviteGate({ bind: "192.0.2.10", inviteCodes: [] });
  assert.equal(gate.policy.mode, "closed");
  const outcome = gate.checkRegistration({ ip: "10.0.0.1", inviteCode: "anything" });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.status, 403);
});

test("requestIp normalizes IPv4-mapped IPv6 remote addresses", () => {
  assert.equal(requestIp({ socket: { remoteAddress: "::ffff:192.0.2.10" } }), "192.0.2.10");
  assert.equal(requestIp({ socket: { remoteAddress: "127.0.0.1" } }), "127.0.0.1");
  assert.equal(requestIp({}), "");
});

/* ---------- The gate over HTTP (loopback boots with codes configured) ---------- */

/** Registers with an optional invite code and returns the raw response. */
async function attemptRegister(server, body) {
  return fetch(`http://127.0.0.1:${server.port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("registration with a configured code requires it; sign-in stays untouched", async () => {
  const dbPath = await tempDbPath();
  const server = await bootTestServer({
    dbPath,
    stubResponses: [{ text: "I hear you." }],
    inviteCodes: ["welcome-friend"],
  });
  try {
    // The public surface tells the frontend an invite is needed, never the code.
    const config = await (await fetch(`http://127.0.0.1:${server.port}/api/auth/config`)).json();
    assert.deepEqual(config, { inviteRequired: true, mode: "invite" });
    const health = await (await fetch(`http://127.0.0.1:${server.port}/api/health`)).json();
    assert.equal(health.inviteRequired, true);

    // Missing and wrong codes are refused (403) and create no account.
    for (const bad of [{ name: "Ada", pin: "4321" }, { name: "Ada", pin: "4321", inviteCode: "nope" }]) {
      const res = await attemptRegister(server, bad);
      assert.equal(res.status, 403, `expected 403 for ${JSON.stringify(bad)}`);
      const sessionless = res.headers.getSetCookie().length === 0;
      assert.ok(sessionless, "a refused registration must not establish a session");
    }

    // The correct code registers and signs in.
    const good = await attemptRegister(server, {
      name: "Ada",
      pin: "4321",
      inviteCode: "welcome-friend",
    });
    assert.equal(good.status, 200);
    const cookie = good.headers.getSetCookie()[0].split(";")[0];

    // Registration works only once per name, code or not.
    const dupe = await attemptRegister(server, {
      name: "Ada",
      pin: "9999",
      inviteCode: "welcome-friend",
    });
    assert.equal(dupe.status, 409);

    // The returning-user sign-in flow needs no invite code at all.
    const signin = await fetch(`http://127.0.0.1:${server.port}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ada", pin: "4321" }),
    });
    assert.equal(signin.status, 200);

    // And the signed-in surface works as before.
    const conversations = await fetch(`http://127.0.0.1:${server.port}/api/conversations`, {
      headers: { Cookie: cookie },
    });
    assert.equal(conversations.status, 200);
  } finally {
    await server.close();
  }
});

test("a second configured code works as well (comma-separated deployments)", async () => {
  const server = await bootTestServer({
    inviteCodes: ["one", "two"],
    stubResponses: [{ text: "I hear you." }],
  });
  try {
    const res = await attemptRegister(server, { name: "Grace", pin: "11", inviteCode: "two" });
    assert.equal(res.status, 200);
  } finally {
    await server.close();
  }
});

test("failed registrations are rate-limited per source IP", async () => {
  const server = await bootTestServer({
    inviteCodes: ["the-real-code"],
    stubResponses: [{ text: "I hear you." }],
  });
  try {
    // Ten failed attempts from the same source (the test process's loopback
    // address): the eleventh is a 429 regardless of what it sends.
    let last;
    for (let i = 0; i < 12; i += 1) {
      last = await attemptRegister(server, {
        name: `Ada${i}`,
        pin: "4321",
        inviteCode: "wrong",
      });
      if (i < 10) assert.equal(last.status, 403, `attempt ${i} should still be 403`);
    }
    assert.equal(last.status, 429);
    assert.match((await last.json()).error, /too many/i);
  } finally {
    await server.close();
  }
});

test("without codes on loopback, registration stays open and reports so", async () => {
  const server = await bootTestServer({ stubResponses: [{ text: "I hear you." }] });
  try {
    const config = await (await fetch(`http://127.0.0.1:${server.port}/api/auth/config`)).json();
    assert.deepEqual(config, { inviteRequired: false, mode: "open" });
    const res = await attemptRegister(server, { name: "Ada", pin: "4321" });
    assert.equal(res.status, 200);
  } finally {
    await server.close();
  }
});
