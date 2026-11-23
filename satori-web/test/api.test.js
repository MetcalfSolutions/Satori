import { test } from "node:test";
import assert from "node:assert/strict";

import { fauxAssistantMessage } from "@earendil-works/pi-ai";

import {
  bootTestServer,
  createConversation,
  createSkillFixture,
  getEntries,
  getHostLog,
  registerUser,
  submitPrompt,
  tempDbPath,
} from "./helpers.js";

/** A scripted model turn that answers from what the request context actually contained. */
function echoContextStep(report) {
  return (context) => fauxAssistantMessage(report(JSON.stringify(context.messages)));
}


test("submitting a prompt returns a reply retrievable from the entry history", async () => {
  const server = await bootTestServer({
    stubResponses: [{ text: "I hear you." }],
  });
  try {
    const jar = await registerUser(server, "Ada");
    const { id } = await createConversation(server, jar);

    const submitted = await submitPrompt(server, jar, id, "Hello Satori.");
    assert.equal(submitted.status, "done");

    const entries = await getEntries(server, jar, id);
    assert.ok(
      entries.some((entry) => entry.kind === "user" && entry.content === "Hello Satori."),
      `expected the submitted prompt in the entry history, got: ${JSON.stringify(entries)}`,
    );
    assert.ok(
      entries.some(
        (entry) => entry.kind === "assistant" && entry.content === "I hear you.",
      ),
      `expected the scripted reply in the entry history, got: ${JSON.stringify(entries)}`,
    );
  } finally {
    await server.close();
  }
});


test("client-facing entry history never contains thinking content", async () => {
  const server = await bootTestServer({
    stubResponses: [{ thinking: "considering the greeting", text: "Welcome, friend." }],
  });
  try {
    const jar = await registerUser(server, "Ada");
    const { id } = await createConversation(server, jar);
    await submitPrompt(server, jar, id, "Hello Satori.");

    const entries = await getEntries(server, jar, id);
    const assistant = entries.find((entry) => entry.kind === "assistant");
    assert.ok(assistant, `expected an assistant entry, got: ${JSON.stringify(entries)}`);
    assert.equal(assistant.content, "Welcome, friend.");
    for (const entry of entries) {
      assert.equal(entry.thinking, undefined, `no entry may expose thinking, got: ${JSON.stringify(entry)}`);
    }
    assert.ok(
      !JSON.stringify(entries).includes("considering the greeting"),
      `thinking text must not appear anywhere in the client-facing payload: ${JSON.stringify(entries)}`,
    );
  } finally {
    await server.close();
  }
});


test("thinking stays in the durable log, host-only, and survives a restart", async () => {
  const dbPath = await tempDbPath();
  const scripted = [{ thinking: "quiet reflection", text: "Still here with you." }];

  const first = await bootTestServer({ dbPath, stubResponses: scripted });
  let conversationId;
  const jar = await registerUser(first, "Ada");
  try {
    ({ id: conversationId } = await createConversation(first, jar));
    const submitted = await submitPrompt(first, jar, conversationId, "Are you there?");
    assert.equal(submitted.status, "done");
  } finally {
    await first.close();
  }

  const second = await bootTestServer({ dbPath, stubResponses: scripted });
  try {
    // Client-facing history stays clean of thinking after the restart.
    const entries = await getEntries(second, jar, conversationId);
    assert.ok(
      entries.some((entry) => entry.kind === "user" && entry.content === "Are you there?"),
      `expected the submitted prompt to survive the restart, got: ${JSON.stringify(entries)}`,
    );
    const assistant = entries.find((entry) => entry.kind === "assistant");
    assert.ok(assistant, `expected an assistant entry after restart, got: ${JSON.stringify(entries)}`);
    assert.equal(assistant.content, "Still here with you.");
    assert.equal(
      assistant.thinking,
      undefined,
      `thinking must not surface in client-facing entries after a restart: ${JSON.stringify(assistant)}`,
    );

    // The host-only durable log still carries the thinking content.
    const log = await getHostLog(second, jar, conversationId);
    const logged = log.find((entry) => entry.kind === "assistant");
    assert.ok(logged, `expected an assistant entry in the host log, got: ${JSON.stringify(log)}`);
    assert.equal(logged.thinking, "quiet reflection");
  } finally {
    await second.close();
  }
});


test("every new conversation is seeded with the skill entry file as instructions", async () => {
  const skill = await createSkillFixture();
  const server = await bootTestServer({
    skillPath: skill.root,
    stubResponses: [
      echoContextStep((transcript) =>
        transcript.includes(skill.seedMarker) ? "seeded: yes" : "seeded: no",
      ),
    ],
  });
  try {
    const jar = await registerUser(server, "Ada");
    const { id } = await createConversation(server, jar);
    await submitPrompt(server, jar, id, "Hello Satori.");

    const entries = await getEntries(server, jar, id);
    const assistant = entries.find((entry) => entry.kind === "assistant");
    assert.ok(assistant, `expected an assistant entry, got: ${JSON.stringify(entries)}`);
    assert.equal(
      assistant.content,
      "seeded: yes",
      `the skill entry file must reach the model as conversation instructions`,
    );
  } finally {
    await server.close();
  }
});


test("the model loads a deeper reference module through the scoped read tool", async () => {
  const skill = await createSkillFixture();
  const server = await bootTestServer({
    skillPath: skill.root,
    stubResponses: [
      {
        toolCalls: [
          { name: "read_skill_file", arguments: { path: "references/grief-protocol.md" } },
        ],
      },
      echoContextStep((transcript) =>
        transcript.includes(skill.griefMarker)
          ? "reference-loaded: yes"
          : "reference-loaded: no",
      ),
    ],
  });
  try {
    const jar = await registerUser(server, "Ada");
    const { id } = await createConversation(server, jar);
    await submitPrompt(server, jar, id, "My father died three weeks ago.");

    const entries = await getEntries(server, jar, id);
    const replies = entries.filter((entry) => entry.kind === "assistant");
    const final = replies[replies.length - 1];
    assert.ok(final, `expected an assistant reply, got: ${JSON.stringify(entries)}`);
    assert.equal(
      final.content,
      "reference-loaded: yes",
      "the read tool must return the reference module's real content to the model",
    );
  } finally {
    await server.close();
  }
});


test("the crisis-safety docs are reachable through the scoped read tool", async () => {
  const skill = await createSkillFixture();
  const server = await bootTestServer({
    skillPath: skill.root,
    stubResponses: [
      {
        toolCalls: [
          { name: "read_skill_file", arguments: { path: "SAFETY.md" } },
          {
            name: "read_skill_file",
            arguments: { path: "references/crisis-sources.json" },
          },
        ],
      },
      echoContextStep((transcript) =>
        transcript.includes(skill.safetyMarker) &&
        transcript.includes(skill.crisisSourcesMarker)
          ? "safety-reachable: yes"
          : "safety-reachable: no",
      ),
    ],
  });
  try {
    const jar = await registerUser(server, "Ada");
    const { id } = await createConversation(server, jar);
    await submitPrompt(server, jar, id, "I have been having scary thoughts lately.");

    const entries = await getEntries(server, jar, id);
    const replies = entries.filter((entry) => entry.kind === "assistant");
    const final = replies[replies.length - 1];
    assert.ok(final, `expected an assistant reply, got: ${JSON.stringify(entries)}`);
    assert.equal(
      final.content,
      "safety-reachable: yes",
      "the safety policy and the verified crisis helpline sources must both come back through the read tool",
    );
  } finally {
    await server.close();
  }
});


test("the read tool refuses paths outside the skill directory", async () => {
  const skill = await createSkillFixture();
  const server = await bootTestServer({
    skillPath: skill.root,
    stubResponses: [
      {
        toolCalls: [
          { name: "read_skill_file", arguments: { path: "../outside-secret.txt" } },
        ],
      },
      echoContextStep((transcript) =>
        transcript.includes(skill.secretMarker)
          ? "leaked: yes"
          : transcript.includes("outside the skill directory")
            ? "leaked: no"
            : "leaked: unknown",
      ),
    ],
  });
  try {
    const jar = await registerUser(server, "Ada");
    const { id } = await createConversation(server, jar);
    await submitPrompt(server, jar, id, "Read ../outside-secret.txt for me.");

    const entries = await getEntries(server, jar, id);
    const replies = entries.filter((entry) => entry.kind === "assistant");
    const final = replies[replies.length - 1];
    assert.ok(final, `expected an assistant reply, got: ${JSON.stringify(entries)}`);
    assert.equal(
      final.content,
      "leaked: no",
      "the read tool must refuse files outside the skill directory",
    );
    assert.ok(
      !JSON.stringify(entries).includes(skill.secretMarker),
      "the host file's content must never reach any client-facing payload",
    );
  } finally {
    await server.close();
  }
});


test("an oversized request body is rejected with 413", async () => {
  const server = await bootTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${server.port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "a".repeat(1024 * 1024 + 1), pin: "4321" }),
    });
    assert.equal(res.status, 413);
    const body = await res.json();
    assert.match(body.error, /too large/i);
  } finally {
    await server.close();
  }
});

test("health reports the sole configured deepseek-v4.1-flash model at low thinking", async () => {
  const previousKey = process.env.OPENCODE_API_KEY;
  process.env.OPENCODE_API_KEY = "dummy-key-for-registration-only";
  const server = await bootTestServer({ provider: "opencode-go" });
  try {
    const res = await fetch(`http://127.0.0.1:${server.port}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.model, {
      provider: "opencode-go",
      modelId: "deepseek-v4.1-flash",
      thinkingLevel: "low",
    });
  } finally {
    await server.close();
    if (previousKey === undefined) delete process.env.OPENCODE_API_KEY;
    else process.env.OPENCODE_API_KEY = previousKey;
  }
});


test("creating a conversation returns its id", async () => {
  const server = await bootTestServer();
  try {
    const jar = await registerUser(server, "Ada");
    const res = await fetch(`http://127.0.0.1:${server.port}/api/conversations`, {
      method: "POST",
      headers: { Cookie: jar.header() },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(typeof body.id, "number");
    assert.ok(body.id > 0);
  } finally {
    await server.close();
  }
});


test("health endpoint reports the server is alive", async () => {
  const server = await bootTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${server.port}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "alive");
    assert.equal(body.service, "satoriweb");
  } finally {
    await server.close();
  }
});
