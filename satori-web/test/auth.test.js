import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

import { bootTestServer, registerUser, tempDbPath } from "./helpers.js";

/** The persisted user store the server keeps next to its conversation database. */
async function readUserStore(server, dbPath) {
  return JSON.parse(
    await fs.readFile(path.join(path.dirname(dbPath), "users.json"), "utf8"),
  );
}

test("registering a new name and PIN creates the account and signs it in", async () => {
  const server = await bootTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${server.port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ada", pin: "4321" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.name, "Ada");
    assert.equal(typeof body.id, "number");
    assert.ok(body.id > 0);

    const setCookies = res.headers.getSetCookie();
    assert.ok(
      setCookies.some((cookie) => cookie.startsWith("satoriweb_session=")),
      `expected a session cookie, got: ${JSON.stringify(setCookies)}`,
    );
  } finally {
    await server.close();
  }
});

test("the same name cannot be registered twice, even with different casing", async () => {
  const server = await bootTestServer();
  try {
    const first = await fetch(`http://127.0.0.1:${server.port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ada", pin: "4321" }),
    });
    assert.equal(first.status, 200);

    const second = await fetch(`http://127.0.0.1:${server.port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "ada", pin: "9999" }),
    });
    assert.equal(second.status, 409);
    const body = await second.json();
    assert.match(body.error, /taken/i);
  } finally {
    await server.close();
  }
});

test("registration requires a name and a PIN", async () => {
  const server = await bootTestServer();
  try {
    for (const body of [
      { name: "", pin: "4321" },
      { name: "Ada", pin: "" },
      { name: "  ", pin: "4321" },
      { name: "Ada" },
      { pin: "4321" },
    ]) {
      const res = await fetch(`http://127.0.0.1:${server.port}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(body)}`);
    }
  } finally {
    await server.close();
  }
});

test("PINs are never stored in plaintext — only a salt and a salted hash", async () => {
  const dbPath = await tempDbPath();
  const server = await bootTestServer({ dbPath });
  try {
    const res = await fetch(`http://127.0.0.1:${server.port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ada", pin: "43218765" }),
    });
    assert.equal(res.status, 200);

    const store = await readUserStore(server, dbPath);
    const stored = JSON.stringify(store);
    assert.ok(
      !stored.includes("43218765"),
      `the PIN must not appear anywhere in the user store: ${stored}`,
    );
    const user = store.users?.find((candidate) => candidate.name === "Ada");
    assert.ok(user, `expected Ada in the user store: ${stored}`);
    assert.ok(typeof user.pinSalt === "string" && user.pinSalt.length > 0, "expected a stored salt");
    assert.ok(
      typeof user.pinHash === "string" && user.pinHash.length > 0,
      "expected a stored salted hash",
    );
  } finally {
    await server.close();
  }
});

/* ---------- Sign-in, session identity, sign-out ---------- */

/** A minimal cookie jar so tests can carry a session across requests. */
function cookieJar() {
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

async function register(server, jar, name, pin) {
  const res = await fetch(`http://127.0.0.1:${server.port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, pin }),
  });
  jar.capture(res);
  assert.equal(res.status, 200, `registering ${name} failed`);
  return res.json();
}

test("an existing account can sign in with its name and PIN", async () => {
  const server = await bootTestServer();
  try {
    const jar = cookieJar();
    await register(server, jar, "Ada", "4321");

    // A second, jar-less sign-in with the right credentials succeeds.
    const res = await fetch(`http://127.0.0.1:${server.port}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ada", pin: "4321" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.name, "Ada");
    assert.ok(
      res.headers.getSetCookie().some((cookie) => cookie.startsWith("satoriweb_session=")),
      "signing in must establish a session cookie",
    );

    // Wrong PIN and unknown name are both refused identically.
    for (const bad of [
      { name: "Ada", pin: "0000" },
      { name: "Nobody", pin: "4321" },
    ]) {
      const failed = await fetch(`http://127.0.0.1:${server.port}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bad),
      });
      assert.equal(failed.status, 401, `expected 401 for ${JSON.stringify(bad)}`);
      const detail = await failed.json();
      assert.match(detail.error, /invalid/i);
    }
  } finally {
    await server.close();
  }
});

test("the session endpoint identifies the signed-in user", async () => {
  const server = await bootTestServer();
  try {
    const anonymous = await fetch(`http://127.0.0.1:${server.port}/api/auth/session`);
    assert.equal(anonymous.status, 401);

    const jar = cookieJar();
    const { id } = await register(server, jar, "Ada", "4321");

    const res = await fetch(`http://127.0.0.1:${server.port}/api/auth/session`, {
      headers: { Cookie: jar.header() },
    });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { id, name: "Ada", onboarded: false });

    // A tampered or garbage cookie is no session at all.
    for (const badCookie of [
      "satoriweb_session=1.9999999999999.deadbeef",
      "satoriweb_session=",
      "satoriweb_session=not-a-token",
    ]) {
      const forged = await fetch(`http://127.0.0.1:${server.port}/api/auth/session`, {
        headers: { Cookie: badCookie },
      });
      assert.equal(forged.status, 401, `expected 401 for cookie ${badCookie}`);
    }
  } finally {
    await server.close();
  }
});

test("a session survives a server restart", async () => {
  const dbPath = await tempDbPath();
  const first = await bootTestServer({ dbPath });
  let jar;
  try {
    jar = cookieJar();
    await register(first, jar, "Ada", "4321");
  } finally {
    await first.close();
  }

  const second = await bootTestServer({ dbPath });
  try {
    const res = await fetch(`http://127.0.0.1:${second.port}/api/auth/session`, {
      headers: { Cookie: jar.header() },
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).name, "Ada");
  } finally {
    await second.close();
  }
});

test("signing out clears the session", async () => {
  const server = await bootTestServer();
  try {
    const jar = cookieJar();
    await register(server, jar, "Ada", "4321");

    const res = await fetch(`http://127.0.0.1:${server.port}/api/auth/signout`, {
      method: "POST",
      headers: { Cookie: jar.header() },
    });
    assert.equal(res.status, 200);
    jar.capture(res);

    const after = await fetch(`http://127.0.0.1:${server.port}/api/auth/session`, {
      headers: { Cookie: jar.header() },
    });
    assert.equal(after.status, 401);
  } finally {
    await server.close();
  }
});

/* ---------- Every chat endpoint sits behind the sign-in gate ---------- */

test("an unauthenticated request to any chat endpoint is refused", async () => {
  const server = await bootTestServer({
    stubResponses: [{ text: "I hear you." }],
  });
  try {
    // Establish one signed-in session and one conversation, so the refusal is
    // about authentication, not emptiness.
    const jar = cookieJar();
    await register(server, jar, "Ada", "4321");
    const created = await fetch(`http://127.0.0.1:${server.port}/api/conversations`, {
      method: "POST",
      headers: { Cookie: jar.header() },
    });
    assert.equal(created.status, 200);
    const { id } = await created.json();

    const refused = [
      ["GET", "/api/conversations"],
      ["POST", "/api/conversations"],
      ["POST", "/api/onboarding"],
      ["PATCH", `/api/conversations/${id}`],
      ["DELETE", `/api/conversations/${id}`],
      ["GET", `/api/conversations/${id}/entries`],
      ["POST", `/api/conversations/${id}/submit`],
    ];
    for (const [method, pathname] of refused) {
      const res = await fetch(`http://127.0.0.1:${server.port}${pathname}`, {
        method,
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body:
          method === "POST"
            ? JSON.stringify({ prompt: "Hello." })
            : method === "PATCH"
              ? JSON.stringify({ title: "Renamed" })
              : undefined,
      });
      assert.equal(
        res.status,
        401,
        `expected 401 for unauthenticated ${method} ${pathname}, got ${res.status}`,
      );
    }

    // The durable log is host-only: without a session (and without the host
    // token, configured separately) it is simply not there.
    const logResponse = await fetch(
      `http://127.0.0.1:${server.port}/api/conversations/${id}/log`,
    );
    assert.equal(logResponse.status, 404);

    // A signed-in session reaches the same endpoints.
    const listed = await fetch(`http://127.0.0.1:${server.port}/api/conversations`, {
      headers: { Cookie: jar.header() },
    });
    assert.equal(listed.status, 200);
    assert.equal((await listed.json()).length, 1);
  } finally {
    await server.close();
  }
});

/* ---------- Per-user conversation isolation ---------- */

test("two users see fully separate conversation lists and cannot reach each other's conversations", async () => {
  const server = await bootTestServer({
    stubResponses: [{ text: "I hear you." }, { text: "I am here with you." }],
  });
  try {
    const ada = await registerUser(server, "Ada");
    const grace = await registerUser(server, "Grace");

    // Ada starts a conversation and says something.
    const created = await fetch(`http://127.0.0.1:${server.port}/api/conversations`, {
      method: "POST",
      headers: { Cookie: ada.header() },
    });
    assert.equal(created.status, 200);
    const adaConversation = await created.json();
    const submitted = await fetch(
      `http://127.0.0.1:${server.port}/api/conversations/${adaConversation.id}/submit`,
      {
        method: "POST",
        headers: { Cookie: ada.header(), "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "How do I sit with grief?" }),
      },
    );
    assert.equal(submitted.status, 200);

    // Grace's list is empty: Ada's conversation is invisible to her.
    const graceList = await fetch(`http://127.0.0.1:${server.port}/api/conversations`, {
      headers: { Cookie: grace.header() },
    });
    assert.deepEqual(await graceList.json(), []);

    // Grace cannot read Ada's history…
    const graceReads = await fetch(
      `http://127.0.0.1:${server.port}/api/conversations/${adaConversation.id}/entries`,
      { headers: { Cookie: grace.header() } },
    );
    assert.equal(graceReads.status, 404, "cross-user history reads must be refused");

    // …cannot submit into it…
    const graceSubmits = await fetch(
      `http://127.0.0.1:${server.port}/api/conversations/${adaConversation.id}/submit`,
      {
        method: "POST",
        headers: { Cookie: grace.header(), "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Let me in." }),
      },
    );
    assert.equal(graceSubmits.status, 404, "cross-user submissions must be refused");

    // …and cannot even see that it exists.
    const nonexistent = await fetch(
      `http://127.0.0.1:${server.port}/api/conversations/999999/entries`,
      { headers: { Cookie: grace.header() } },
    );
    assert.equal(nonexistent.status, 404);
    assert.deepEqual(
      await nonexistent.json(),
      await graceReads.json(),
      "a cross-user read must look exactly like a nonexistent conversation",
    );

    // Grace starts her own conversation; the two lists stay fully separate,
    // with titles derived per-user from each conversation's first message.
    const graceCreated = await fetch(`http://127.0.0.1:${server.port}/api/conversations`, {
      method: "POST",
      headers: { Cookie: grace.header() },
    });
    assert.equal(graceCreated.status, 200);
    const graceConversation = await graceCreated.json();
    await fetch(`http://127.0.0.1:${server.port}/api/conversations/${graceConversation.id}/submit`, {
      method: "POST",
      headers: { Cookie: grace.header(), "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "I feel heavy today." }),
    });

    const adaList = await (await fetch(`http://127.0.0.1:${server.port}/api/conversations`, {
      headers: { Cookie: ada.header() },
    })).json();
    assert.deepEqual(adaList, [
      { id: adaConversation.id, title: "How do I sit with grief?" },
    ]);

    const graceListNow = await (await fetch(`http://127.0.0.1:${server.port}/api/conversations`, {
      headers: { Cookie: grace.header() },
    })).json();
    assert.deepEqual(graceListNow, [
      { id: graceConversation.id, title: "I feel heavy today." },
    ]);
  } finally {
    await server.close();
  }
});

test("a user's own conversations stay reachable after a restart, still invisible to others", async () => {
  const dbPath = await tempDbPath();
  const first = await bootTestServer({
    dbPath,
    stubResponses: [{ text: "I hear you." }],
  });
  let ada;
  let grace;
  let conversationId;
  try {
    ada = await registerUser(first, "Ada");
    grace = await registerUser(first, "Grace");
    const created = await fetch(`http://127.0.0.1:${first.port}/api/conversations`, {
      method: "POST",
      headers: { Cookie: ada.header() },
    });
    conversationId = (await created.json()).id;
    await fetch(`http://127.0.0.1:${first.port}/api/conversations/${conversationId}/submit`, {
      method: "POST",
      headers: { Cookie: ada.header(), "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "How do I sit with grief?" }),
    });
  } finally {
    await first.close();
  }

  const second = await bootTestServer({ dbPath, stubResponses: [{ text: "I hear you." }] });
  try {
    const adaEntries = await fetch(
      `http://127.0.0.1:${second.port}/api/conversations/${conversationId}/entries`,
      { headers: { Cookie: ada.header() } },
    );
    assert.equal(adaEntries.status, 200);
    assert.ok(
      (await adaEntries.json()).some((entry) => entry.content === "How do I sit with grief?"),
    );

    const graceReads = await fetch(
      `http://127.0.0.1:${second.port}/api/conversations/${conversationId}/entries`,
      { headers: { Cookie: grace.header() } },
    );
    assert.equal(graceReads.status, 404, "isolation must survive the restart");
  } finally {
    await second.close();
  }
});

/* ---------- The durable-log debug view is host-only ---------- */

test("the durable log is reachable only with the host token, never by signed-in users", async () => {
  const server = await bootTestServer({
    hostToken: "host-only-debug-token",
    stubResponses: [{ thinking: "private reflection", text: "I am here with you." }],
  });
  try {
    const ada = await registerUser(server, "Ada");
    const created = await fetch(`http://127.0.0.1:${server.port}/api/conversations`, {
      method: "POST",
      headers: { Cookie: ada.header() },
    });
    const { id } = await created.json();
    await fetch(`http://127.0.0.1:${server.port}/api/conversations/${id}/submit`, {
      method: "POST",
      headers: { Cookie: ada.header(), "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Are you there?" }),
    });

    const logUrl = `http://127.0.0.1:${server.port}/api/conversations/${id}/log`;

    // Even the conversation's owner cannot reach the log: without the host
    // token it looks exactly like a route that does not exist.
    for (const [label, headers] of [
      ["signed-in owner, no token", { Cookie: ada.header() }],
      ["anonymous, no token", {}],
      ["wrong bearer token", { Cookie: ada.header(), Authorization: "Bearer nope" }],
    ]) {
      const res = await fetch(logUrl, { headers });
      assert.equal(res.status, 404, `expected 404 for ${label}`);
      assert.deepEqual(await res.json(), { error: "Not Found" });
    }

    // The host token unlocks the full durable log, thinking included.
    const hostView = await fetch(logUrl, {
      headers: { Authorization: "Bearer host-only-debug-token" },
    });
    assert.equal(hostView.status, 200);
    const log = await hostView.json();
    const logged = log.find((entry) => entry.kind === "assistant");
    assert.ok(logged, `expected an assistant entry in the host log: ${JSON.stringify(log)}`);
    assert.equal(logged.thinking, "private reflection");
  } finally {
    await server.close();
  }
});

test("without a configured host token the log route does not exist at all", async () => {
  const server = await bootTestServer({
    stubResponses: [{ text: "I hear you." }],
  });
  try {
    const ada = await registerUser(server, "Ada");
    const created = await fetch(`http://127.0.0.1:${server.port}/api/conversations`, {
      method: "POST",
      headers: { Cookie: ada.header() },
    });
    const { id } = await created.json();

    for (const headers of [
      { Cookie: ada.header() },
      { Authorization: "Bearer anything" },
      { Cookie: ada.header(), Authorization: "Bearer anything" },
    ]) {
      const res = await fetch(
        `http://127.0.0.1:${server.port}/api/conversations/${id}/log`,
        { headers },
      );
      assert.equal(res.status, 404);
    }
  } finally {
    await server.close();
  }
});

test("sign-in with a malformed body is refused, not a server error", async () => {
  const server = await bootTestServer();
  try {
    const ada = await registerUser(server, "Ada");
    void ada;
    for (const body of [
      { name: "Ada" },
      { pin: "4321" },
      { name: "Ada", pin: 4321 },
      {},
    ]) {
      const res = await fetch(`http://127.0.0.1:${server.port}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      assert.equal(res.status, 401, `expected 401 for ${JSON.stringify(body)}`);
    }
  } finally {
    await server.close();
  }
});
