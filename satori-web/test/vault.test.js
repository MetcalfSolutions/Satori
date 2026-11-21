import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";

import { fauxAssistantMessage } from "@earendil-works/pi-ai";

import { startServer } from "../src/server.js";
import {
  bootTestServer,
  cookieJar,
  createConversation,
  createSkillFixture,
  getEntries,
  submitPrompt,
  tempDir,
} from "./helpers.js";

/** Registers a fresh account with a known PIN and returns its cookie jar. */
async function registerWithPin(server, name, pin) {
  const jar = cookieJar();
  const res = await fetch(`http://127.0.0.1:${server.port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, pin }),
  });
  jar.capture(res);
  assert.equal(res.status, 200, `registering ${name} failed`);
  return jar;
}

/** Signs an existing account in with its name and PIN. */
async function signIn(server, name, pin) {
  const jar = cookieJar();
  const res = await fetch(`http://127.0.0.1:${server.port}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, pin }),
  });
  jar.capture(res);
  assert.equal(res.status, 200, `signing in ${name} failed`);
  return jar;
}

test("a memory the model writes in one conversation is recalled in the same user's new conversation", async () => {
  const memory = "Recurring tension between career autonomy and family obligation.";
  const server = await bootTestServer({
    stubResponses: [
      {
        toolCalls: [
          {
            name: "vault_log_signal",
            arguments: {
              theme: "career autonomy vs family obligation",
              layer: "signal",
              summary: memory,
            },
          },
        ],
      },
      { text: "I hear you." },
      { toolCalls: [{ name: "vault_status", arguments: {} }] },
      (context) =>
        fauxAssistantMessage(
          JSON.stringify(context.messages).includes(memory)
            ? "recalled: yes"
            : "recalled: no",
        ),
    ],
  });
  try {
    const ada = await registerWithPin(server, "Ada", "4321");

    const first = await createConversation(server, ada);
    await submitPrompt(
      server,
      ada,
      first.id,
      "I keep choosing work over the family table, and it gnaws at me.",
    );

    // A brand-new conversation of the same user: Satori consults the vault
    // and the memory written earlier is right there.
    const second = await createConversation(server, ada);
    await submitPrompt(server, ada, second.id, "Do you remember what keeps pulling at me?");

    const entries = await getEntries(server, ada, second.id);
    const replies = entries.filter((entry) => entry.kind === "assistant");
    const final = replies[replies.length - 1];
    assert.ok(final, `expected an assistant reply, got: ${JSON.stringify(entries)}`);
    assert.equal(
      final.content,
      "recalled: yes",
      "the memory written in the first conversation must be readable in the new one",
    );
  } finally {
    await server.close();
  }
});

test("a memory written before a restart is recalled after it, in a brand-new conversation", async () => {
  const dbPath = path.join(await tempDir(), "test.sqlite");
  const vaultRoot = path.join(await tempDir(), "vaults");
  const memory = "Perfectionism as armor against the fear of being ordinary.";
  const echoAfterRestart = (context) => {
    const transcript = JSON.stringify(context.messages);
    if (transcript.includes(memory)) return fauxAssistantMessage("recalled: yes");
    if (transcript.includes("no results") || transcript.includes("empty"))
      return fauxAssistantMessage("recalled: empty");
    return fauxAssistantMessage("recalled: no");
  };

  const first = await bootTestServer({
    dbPath,
    vaultRoot,
    stubResponses: [
      {
        toolCalls: [
          {
            name: "vault_log_signal",
            arguments: { theme: "perfectionism as armor", layer: "signal", summary: memory },
          },
        ],
      },
      { text: "I hear you." },
    ],
  });
  try {
    const ada = await registerWithPin(first, "Ada", "4321");
    const conversation = await createConversation(first, ada);
    await submitPrompt(first, ada, conversation.id, "I polish everything until it is flawless and I am exhausted.");
  } finally {
    await first.close();
  }

  const second = await bootTestServer({
    dbPath,
    vaultRoot,
    stubResponses: [
      { toolCalls: [{ name: "vault_search", arguments: { query: "armor", limit: 5 } }] },
      echoAfterRestart,
    ],
  });
  try {
    // The account survived the restart; Ada signs in again with her PIN.
    const ada = await signIn(second, "Ada", "4321");
    const conversation = await createConversation(second, ada);
    await submitPrompt(second, ada, conversation.id, "Do you remember what I wear when I am afraid?");

    const entries = await getEntries(second, ada, conversation.id);
    const replies = entries.filter((entry) => entry.kind === "assistant");
    const final = replies[replies.length - 1];
    assert.ok(final, `expected an assistant reply, got: ${JSON.stringify(entries)}`);
    assert.equal(
      final.content,
      "recalled: yes",
      "the memory written before the restart must be searchable in the new conversation after it",
    );
  } finally {
    await second.close();
  }
});

test("one user's memory is unreachable from another user's session, and each user's writes land in their own vault", async () => {
  const adaMemory = "Recurring tension between career autonomy and family obligation.";
  const graceMemory = "Over-functioning to preserve peace in close bonds.";
  const scopeEcho = (mine, theirs) => (context) => {
    const transcript = JSON.stringify(context.messages);
    if (transcript.includes(theirs)) return fauxAssistantMessage("leaked: yes");
    if (transcript.includes(mine)) return fauxAssistantMessage("isolated: yes");
    return fauxAssistantMessage("isolated: no");
  };

  const server = await bootTestServer({
    stubResponses: [
      // Ada's conversation: she writes her memory.
      {
        toolCalls: [
          {
            name: "vault_log_signal",
            arguments: { theme: "career autonomy vs family obligation", layer: "signal", summary: adaMemory },
          },
        ],
      },
      { text: "I hear you." },
      // Grace's conversation: she writes her own, different memory.
      {
        toolCalls: [
          {
            name: "vault_log_signal",
            arguments: { theme: "over-functioning for peace", layer: "signal", summary: graceMemory },
          },
        ],
      },
      { text: "I hear you too." },
      // Grace checks her vault: Ada's memory must not be there, hers must.
      { toolCalls: [{ name: "vault_status", arguments: {} }] },
      scopeEcho(graceMemory, adaMemory),
      // Ada checks hers: Grace's memory must not be there either.
      { toolCalls: [{ name: "vault_status", arguments: {} }] },
      scopeEcho(adaMemory, graceMemory),
      // Finally Grace searches directly for the words of Ada's memory.
      { toolCalls: [{ name: "vault_search", arguments: { query: "family obligation", limit: 5 } }] },
      (context) =>
        fauxAssistantMessage(
          JSON.stringify(context.messages).includes(adaMemory) ? "leaked: yes" : "leaked: no",
        ),
    ],
  });
  try {
    const ada = await registerWithPin(server, "Ada", "4321");
    const grace = await registerWithPin(server, "Grace", "9999");

    const adaConversation = await createConversation(server, ada);
    await submitPrompt(server, ada, adaConversation.id, "I keep choosing work over the family table.");

    const graceConversation = await createConversation(server, grace);
    await submitPrompt(server, grace, graceConversation.id, "I hold everything together for everyone else.");

    // Grace consults her vault in a fresh conversation.
    const graceCheck = await createConversation(server, grace);
    await submitPrompt(server, grace, graceCheck.id, "What do you know about me?");
    let entries = await getEntries(server, grace, graceCheck.id);
    let replies = entries.filter((entry) => entry.kind === "assistant");
    assert.equal(
      replies[replies.length - 1].content,
      "isolated: yes",
      "Grace's vault must show her own memory and never Ada's",
    );

    // Ada consults hers.
    const adaCheck = await createConversation(server, ada);
    await submitPrompt(server, ada, adaCheck.id, "What do you know about me?");
    entries = await getEntries(server, ada, adaCheck.id);
    replies = entries.filter((entry) => entry.kind === "assistant");
    assert.equal(
      replies[replies.length - 1].content,
      "isolated: yes",
      "Ada's vault must show her own memory and never Grace's",
    );

    // Even a targeted search for the words of Ada's memory finds nothing in
    // Grace's vault, and no client-facing payload ever carries it.
    const graceProbe = await createConversation(server, grace);
    await submitPrompt(server, grace, graceProbe.id, "Search for what you cannot have.");
    entries = await getEntries(server, grace, graceProbe.id);
    assert.ok(
      !JSON.stringify(entries).includes(adaMemory),
      "Ada's memory must never appear in any client-facing payload of Grace's session",
    );
    const probeReplies = entries.filter((entry) => entry.kind === "assistant");
    assert.equal(
      probeReplies[probeReplies.length - 1].content,
      "leaked: no",
      "a direct search for Ada's memory words must not find them in Grace's vault",
    );
  } finally {
    await server.close();
  }
});

test("an off-the-record (ephemeral) write records nothing in the vault", async () => {
  const offTheRecord = "The person asked for this to stay between us, off the record.";
  const server = await bootTestServer({
    stubResponses: [
      // The person asked to stay off the record; Satori still acknowledges
      // the moment but the vault must record nothing at all.
      {
        toolCalls: [
          {
            name: "vault_log_signal",
            arguments: {
              theme: "a private matter",
              layer: "signal",
              summary: offTheRecord,
              ephemeral: true,
            },
          },
        ],
      },
      (context) =>
        fauxAssistantMessage(
          JSON.stringify(context.messages).includes("ephemeral_skipped")
            ? "acknowledged: skipped"
            : "acknowledged: no",
        ),
      { toolCalls: [{ name: "vault_status", arguments: {} }] },
      (context) => {
        const transcript = JSON.stringify(context.messages);
        // The fresh conversation's vault check: nothing may have been written.
        if (transcript.includes(offTheRecord)) return fauxAssistantMessage("stored: yes");
        return fauxAssistantMessage("stored: no");
      },
    ],
  });
  try {
    const ada = await registerWithPin(server, "Ada", "4321");

    const first = await createConversation(server, ada);
    await submitPrompt(server, ada, first.id, "Can I share something off the record?");

    // The same conversation: Satori must have seen the vault acknowledge the
    // moment as an ephemeral skip.
    const firstEntries = await getEntries(server, ada, first.id);
    const firstReplies = firstEntries.filter((entry) => entry.kind === "assistant");
    assert.equal(
      firstReplies[firstReplies.length - 1].content,
      "acknowledged: skipped",
      "the vault must acknowledge an off-the-record write as skipped, not store it",
    );

    // A fresh conversation checks the vault: nothing may have been written.
    const second = await createConversation(server, ada);
    await submitPrompt(server, ada, second.id, "Do you remember our last talk?");
    const entries = await getEntries(server, ada, second.id);
    const replies = entries.filter((entry) => entry.kind === "assistant");
    assert.equal(
      replies[replies.length - 1].content,
      "stored: no",
      "an ephemeral write must leave the vault exactly as it was",
    );
    // And the disclosure itself never reached any client-facing payload.
    assert.ok(
      !JSON.stringify(entries).includes(offTheRecord) &&
        !JSON.stringify(firstEntries).includes(offTheRecord),
      "the off-the-record disclosure must never reach any client-facing payload",
    );
  } finally {
    await server.close();
  }
});

test("an overlong raw summary is refused, and obvious PII is redacted from what is stored", async () => {
  const rawSpill =
    "Alice told me at alice@example.org that she hates her boss and this rambling raw " +
    "transcript of everything she said goes on and on far past any structural pattern " +
    "because the model was supposed to summarize, not store.";
  const overlong = "w".repeat(501);
  // The refusal lands in this conversation; the redaction is visible in the
  // stored memory, which a vault read brings back into the transcript.
  const reportEcho = (context) => {
    const transcript = JSON.stringify(context.messages);
    return fauxAssistantMessage(
      JSON.stringify({
        refused: transcript.includes("exceeds the 500-character"),
        redacted: transcript.includes("[REDACTED_EMAIL]"),
      }),
    );
  };

  const server = await bootTestServer({
    stubResponses: [
      // One turn, two attempts: an overlong raw dump, then a legitimate
      // pattern whose summary carries an email address.
      {
        toolCalls: [
          {
            name: "vault_log_signal",
            arguments: { theme: "raw venting", layer: "signal", summary: overlong },
          },
          {
            name: "vault_log_signal",
            arguments: { theme: "named contact", layer: "signal", summary: rawSpill },
          },
        ],
      },
      { toolCalls: [{ name: "vault_status", arguments: {} }] },
      reportEcho,
    ],
  });
  try {
    const ada = await registerWithPin(server, "Ada", "4321");
    const first = await createConversation(server, ada);
    await submitPrompt(server, ada, first.id, "Let me tell you everything, word for word.");

    const entries = await getEntries(server, ada, first.id);
    const replies = entries.filter((entry) => entry.kind === "assistant");
    const report = JSON.parse(replies[replies.length - 1].content);
    assert.equal(
      report.refused,
      true,
      "the vault must refuse a summary past the 500-character structural limit",
    );
    assert.equal(
      report.redacted,
      true,
      "the vault must scrub obvious PII (emails, phones, IDs) from what it stores",
    );
    // The raw email itself never reaches any client-facing payload, and the
    // overlong dump was never stored at all.
    assert.ok(
      !JSON.stringify(entries).includes("alice@example.org"),
      "the raw email address must never appear in any client-facing payload",
    );
  } finally {
    await server.close();
  }
});

test("repeated themes recur and promote through the protocol's 1→2→3 counting", async () => {
  const server = await bootTestServer({
    stubResponses: [
      // One turn, six writes: the same theme three times (signal → theme →
      // pattern) and a dream-layer theme three times (watched, never surfaced
      // before the third appearance).
      {
        toolCalls: [
          { name: "vault_log_signal", arguments: { theme: "self-abandonment for peace", layer: "signal", summary: "Quiets own needs to keep the room calm." } },
          { name: "vault_log_signal", arguments: { theme: "self-abandonment for peace", layer: "signal", summary: "Quiets own needs to keep the room calm." } },
          { name: "vault_log_signal", arguments: { theme: "self-abandonment for peace", layer: "signal", summary: "Quiets own needs to keep the room calm." } },
          { name: "vault_log_signal", arguments: { theme: "an unfinished ache", layer: "dream", summary: "A theme that keeps returning uninvited." } },
          { name: "vault_log_signal", arguments: { theme: "an unfinished ache", layer: "dream", summary: "A theme that keeps returning uninvited." } },
          { name: "vault_log_signal", arguments: { theme: "an unfinished ache", layer: "dream", summary: "A theme that keeps returning uninvited." } },
        ],
      },
      { text: "Noted, quietly." },
      { toolCalls: [{ name: "vault_status", arguments: {} }] },
      (context) => {
        const transcript = JSON.stringify(context.messages);
        return fauxAssistantMessage(
          JSON.stringify({
            // The tool result's JSON lives escaped inside the stringified
            // transcript, so the markers carry their escaped quotes.
            promoted:
              transcript.includes(String.raw`\"layer\": \"pattern\"`) &&
              transcript.includes(String.raw`\"recurrence_count\": 3`),
            dreamWatch: transcript.includes("name_pattern_gently"),
            stillDream: transcript.includes(String.raw`\"layer\": \"dream\"`),
          }),
        );
      },
    ],
  });
  try {
    const ada = await registerWithPin(server, "Ada", "4321");
    const first = await createConversation(server, ada);
    await submitPrompt(server, ada, first.id, "This keeps coming up, again and again.");

    const second = await createConversation(server, ada);
    await submitPrompt(server, ada, second.id, "What patterns are you holding for me?");

    const entries = await getEntries(server, ada, second.id);
    const replies = entries.filter((entry) => entry.kind === "assistant");
    const report = JSON.parse(replies[replies.length - 1].content);
    assert.equal(
      report.promoted,
      true,
      "a theme seen three times must promote to a pattern with recurrence count 3",
    );
    assert.equal(
      report.dreamWatch,
      true,
      "a dream-layer theme at count 3 must reach the name-gently threshold",
    );
    assert.equal(
      report.stillDream,
      true,
      "a dream-layer theme stays in the dream watch, never among the active signals",
    );
  } finally {
    await server.close();
  }
});

test("a vault root inside the host's real ~/.satori/memory refuses to boot", async () => {
  const realVault = path.join(os.homedir(), ".satori", "memory");
  const dbPath = path.join(await tempDir(), "test.sqlite");
  // An explicit skill fixture keeps this test independent of the repository's
  // clone: the vault-root guard must be the boot failure, not a missing skill.
  const skillPath = (await createSkillFixture()).root;

  // The real vault itself…
  await assert.rejects(
    () => startServer({ port: 0, dbPath, vaultRoot: realVault, provider: "stub", skillPath }),
    /real Satori vault/,
  );
  // …or anything nested inside it.
  await assert.rejects(
    () =>
      startServer({
        port: 0,
        dbPath,
        vaultRoot: path.join(realVault, "nested"),
        provider: "stub",
        skillPath,
      }),
    /real Satori vault/,
  );

  // A separate root boots normally, including the default's sibling area.
  const server = await bootTestServer({
    vaultRoot: path.join(await tempDir(), "elsewhere"),
  });
  try {
    const res = await fetch(`http://127.0.0.1:${server.port}/api/health`);
    assert.equal(res.status, 200);
  } finally {
    await server.close();
  }
});
