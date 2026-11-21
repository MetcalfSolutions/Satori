import { test } from "node:test";
import assert from "node:assert/strict";

import {
  bootTestServer,
  createConversation,
  getEntries,
  getHostLog,
  registerUser,
  submitPrompt,
} from "./helpers.js";

async function listConversations(server, jar) {
  const res = await fetch(`http://127.0.0.1:${server.port}/api/conversations`, {
    headers: { Cookie: jar.header() },
  });
  assert.equal(res.status, 200);
  return res.json();
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

async function streamSubmit(server, jar, conversationId, prompt) {
  const res = await fetch(
    `http://127.0.0.1:${server.port}/api/conversations/${conversationId}/submit`,
    {
      method: "POST",
      headers: {
        Cookie: jar.header(),
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ prompt }),
    },
  );
  assert.equal(res.status, 200);
  return res;
}


test("the conversation list shows conversations newest-first, titled from the first message", async () => {
  const longPrompt =
    "I have been carrying something heavy for weeks and I would like to talk through it with you tonight";
  const server = await bootTestServer({
    stubResponses: [{ text: "I hear you." }, { text: "Take your time." }],
  });
  try {
    const jar = await registerUser(server, "Ada");
    assert.deepEqual(await listConversations(server, jar), []);

    const first = await createConversation(server, jar);
    await submitPrompt(server, jar, first.id, "How do I sit with grief?");
    const second = await createConversation(server, jar);
    await submitPrompt(server, jar, second.id, longPrompt);
    const third = await createConversation(server, jar);

    const list = await listConversations(server, jar);
    assert.deepEqual(list, [
      { id: third.id, title: "New conversation" },
      {
        id: second.id,
        title: "I have been carrying something heavy for weeks and I would l…",
      },
      { id: first.id, title: "How do I sit with grief?" },
    ]);
  } finally {
    await server.close();
  }
});

async function getStatic(server, pathname) {
  const res = await fetch(`http://127.0.0.1:${server.port}${pathname}`);
  return { res, body: await res.text() };
}


test("the page ships a sign-in view that gates the chat behind authentication", async () => {
  const server = await bootTestServer();
  try {
    const { res, body } = await getStatic(server, "/");
    assert.equal(res.status, 200);
    // The sign-in screen: name + PIN fields, a sign-in action, and a
    // create-account action — all before any chat is reachable.
    for (const marker of [
      'id="sign-in"',
      'id="auth-name"',
      'id="auth-pin"',
      'id="auth-register"',
    ]) {
      assert.ok(body.includes(marker), `expected ${marker} in the page`);
    }

    // The client script carries the auth flow itself: it checks the session
    // on boot, and it can register and sign in.
    const js = await getStatic(server, "/app.js");
    assert.equal(js.res.status, 200);
    for (const marker of [
      "/api/auth/session",
      "/api/auth/register",
      "/api/auth/signin",
    ]) {
      assert.ok(js.body.includes(marker), `expected ${marker} wired in app.js`);
    }
  } finally {
    await server.close();
  }
});

test("the chat page is served with its composer, sidebar, and empty state", async () => {
  const server = await bootTestServer();
  try {
    const page = await getStatic(server, "/");
    assert.equal(page.res.status, 200);
    assert.match(page.res.headers.get("content-type") ?? "", /^text\/html/);
    const body = page.body;
    for (const marker of [
      '<aside id="sidebar" class="drawer"',
      'id="drawer-backdrop"',
      'id="new-chat"',
      'id="messages"',
      'id="composer"',
      'id="menu-toggle"',
      'id="drawer-close"',
    ]) {
      assert.ok(body.includes(marker), `expected ${marker} in the page`);
    }

    const js = await getStatic(server, "/app.js");
    assert.equal(js.res.status, 200);
    assert.match(js.res.headers.get("content-type") ?? "", /javascript/);
    const css = await getStatic(server, "/style.css");
    assert.equal(css.res.status, 200);
    assert.match(css.res.headers.get("content-type") ?? "", /text\/css/);

    // Static assets must bypass both browser and Cloudflare edge caches so
    // Tailscale IP and Cloudflare Tunnel always serve identical markup/styles.
    for (const { res } of [page, js, css]) {
      assert.equal(
        res.headers.get("cache-control"),
        "no-store, no-cache, must-revalidate",
        "static assets must be served with Cache-Control: no-store, no-cache, must-revalidate",
      );
      assert.equal(res.headers.get("cdn-cache-control"), "no-store");
    }
  } finally {
    await server.close();
  }
});


test("the SSE stream carries assistant text only — never thinking", async () => {
  const thinking = "privately weighing how to meet this moment";
  const reply = "You can set the heaviness down for a little while here, and I will sit with you.";
  const server = await bootTestServer({
    stubResponses: [{ thinking, text: reply }],
    stubTokensPerSecond: 40,
  });
  try {
    const jar = await registerUser(server, "Ada");
    const { id } = await createConversation(server, jar);
    const res = await streamSubmit(server, jar, id, "I feel heavy today.");
    const body = await res.text();

    assert.ok(
      !body.includes(thinking),
      `thinking content leaked into the stream: ${body}`,
    );
    assert.ok(!body.includes("\"thinking\""), `no thinking field may appear: ${body}`);
    assert.ok(body.includes(reply.slice(0, 30)), `expected reply text in the stream: ${body}`);

    const events = parseSse(body);
    assert.deepEqual(
      [...new Set(events.map((frame) => frame.event))].sort(),
      ["delta", "done", "message"],
    );
    const message = events.find((frame) => frame.event === "message");
    assert.equal(message.data.text, reply);

    // The backend still stores the thinking for debugging — host-only durable log,
    // never the client-facing entries (ticket 02 contract).
    const entries = await getEntries(server, jar, id);
    assert.ok(
      entries.every((entry) => entry.thinking === undefined),
      "client-facing entries must never contain thinking",
    );
    const log = await getHostLog(server, jar, id);
    const logged = log.find((entry) => entry.kind === "assistant");
    assert.equal(logged?.thinking, thinking);
  } finally {
    await server.close();
  }
});


test("submitting with Accept: text/event-stream streams the reply progressively as SSE", async () => {
  const reply =
    "Here is a calm, unhurried reply that is long enough for the stub model to stream across several partial commits while the run is still generating.";
  const server = await bootTestServer({
    stubResponses: [{ text: reply }],
    stubTokensPerSecond: 30,
  });
  try {
    const jar = await registerUser(server, "Ada");
    const { id } = await createConversation(server, jar);
    const res = await streamSubmit(server, jar, id, "How do I sit with grief?");

    assert.match(res.headers.get("content-type") ?? "", /^text\/event-stream/);
    const events = parseSse(await res.text());

    const deltas = events.filter((frame) => frame.event === "delta");
    assert.ok(
      deltas.length >= 2,
      `expected the reply to stream progressively, got ${deltas.length} delta frame(s): ${JSON.stringify(events)}`,
    );
    const streamed = deltas.map((frame) => frame.data.text).join("");
    assert.ok(
      streamed.length > 0 && reply.startsWith(streamed),
      "the delta frames should stream a growing prefix of the scripted reply",
    );

    const message = events.find((frame) => frame.event === "message");
    assert.ok(message, `expected a final message frame, got: ${JSON.stringify(events)}`);
    assert.equal(message.data.text, reply);

    const done = events[events.length - 1];
    assert.equal(done.event, "done");
    assert.equal(done.data.status, "done");

    // The streamed conversation is the same durable conversation the API serves.
    const entries = await getEntries(server, jar, id);
    assert.ok(
      entries.some((entry) => entry.kind === "user" && entry.content === "How do I sit with grief?"),
      `expected the submitted prompt in the entry history, got: ${JSON.stringify(entries)}`,
    );
    assert.ok(
      entries.some((entry) => entry.kind === "assistant" && entry.content === reply),
      `expected the streamed reply in the entry history, got: ${JSON.stringify(entries)}`,
    );
  } finally {
    await server.close();
  }
});

test("onboarding creates Welcome to Satori, marks onboarded: true, and persists", async () => {
  const server = await bootTestServer();
  try {
    const jar = await registerUser(server, "Ada");
    const onboard = await fetch(`http://127.0.0.1:${server.port}/api/onboarding`, {
      method: "POST",
      headers: { Cookie: jar.header() },
    });
    assert.equal(onboard.status, 200);
    const payload = await onboard.json();
    assert.equal(payload.title, "Welcome to Satori");
    assert.match(payload.prompt, /my name is Ada/);

    const session = await fetch(`http://127.0.0.1:${server.port}/api/auth/session`, {
      headers: { Cookie: jar.header() },
    });
    assert.equal(session.status, 200);
    assert.equal((await session.json()).onboarded, true);

    const list = await fetch(`http://127.0.0.1:${server.port}/api/conversations`, {
      headers: { Cookie: jar.header() },
    });
    assert.deepEqual(await list.json(), [{ id: payload.id, title: "Welcome to Satori" }]);
  } finally {
    await server.close();
  }
});

test("conversations can be renamed and deleted with per-user isolation", async () => {
  const server = await bootTestServer();
  try {
    const ada = await registerUser(server, "Ada");
    const grace = await registerUser(server, "Grace");
    const conv = await createConversation(server, ada);

    // Cross-user rename and delete are refused with 404.
    const foreignRename = await fetch(
      `http://127.0.0.1:${server.port}/api/conversations/${conv.id}`,
      {
        method: "PATCH",
        headers: { Cookie: grace.header(), "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Hijacked" }),
      },
    );
    assert.equal(foreignRename.status, 404);

    const foreignDelete = await fetch(
      `http://127.0.0.1:${server.port}/api/conversations/${conv.id}`,
      {
        method: "DELETE",
        headers: { Cookie: grace.header() },
      },
    );
    assert.equal(foreignDelete.status, 404);

    // Blank rename is rejected with 400.
    const blankRename = await fetch(
      `http://127.0.0.1:${server.port}/api/conversations/${conv.id}`,
      {
        method: "PATCH",
        headers: { Cookie: ada.header(), "Content-Type": "application/json" },
        body: JSON.stringify({ title: "   " }),
      },
    );
    assert.equal(blankRename.status, 400);

    // Owner rename succeeds.
    const renamed = await fetch(
      `http://127.0.0.1:${server.port}/api/conversations/${conv.id}`,
      {
        method: "PATCH",
        headers: { Cookie: ada.header(), "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Evening reflection" }),
      },
    );
    assert.equal(renamed.status, 200);
    assert.deepEqual(await renamed.json(), { id: conv.id, title: "Evening reflection" });
    assert.deepEqual(await listConversations(server, ada), [
      { id: conv.id, title: "Evening reflection" },
    ]);

    // Owner delete removes conversation from list.
    const deleted = await fetch(
      `http://127.0.0.1:${server.port}/api/conversations/${conv.id}`,
      {
        method: "DELETE",
        headers: { Cookie: ada.header() },
      },
    );
    assert.equal(deleted.status, 200);
    assert.deepEqual(await listConversations(server, ada), []);
  } finally {
    await server.close();
  }
});
