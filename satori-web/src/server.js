import http from "node:http";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { timingSafeEqual } from "node:crypto";

import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";

import { createHarness, modelSelection } from "./harness.js";
import { loadSkillInstructions } from "./skill.js";
import {
  createVaultTools,
  createUserVault,
  assertSafeVaultRoot,
  HOST_MEMORY_INSTRUCTIONS,
} from "./vault.js";
import { DEFAULTS } from "./config.js";
import { createInviteGate, requestIp } from "./invite.js";
import { createUserStore } from "./users.js";
import {
  createSessionSecret,
  issueSessionToken,
  sessionCookie,
  sessionTokenFrom,
  verifySessionToken,
} from "./sessions.js";

/**
 * Starts the SatoriWeb HTTP server.
 *
 * @param {object} [options]
 * @param {number} [options.port] Port to listen on (0 picks a free port).
 * @param {string} [options.host] Bind address. Defaults to loopback.
 * @param {string} [options.bind] Bind address alias, as resolved from SATOWEB_BIND by readConfig.
 * @param {string} [options.dbPath] SQLite storage path.
 * @param {string} [options.skillPath] Satori skill clone directory.
 * @param {string} [options.vaultRoot] Root directory of the per-user memory vaults.
 * @param {string} [options.provider] Model provider id ("opencode-go", "gemini", "anthropic", "openai", "openrouter", or "stub").
 * @param {string} [options.modelId] Model id. Defaults to glm-5.3.
 * @param {string} [options.thinkingLevel] Thinking level. Defaults to "medium".
 * @param {Array} [options.stubResponses] Scripted responses for the stub provider.
 * @param {number} [options.stubTokensPerSecond] Stub streaming rate, for deterministic SSE tests.
 * @param {string} [options.hostToken] Host-only debug token; when set, unlocks /api/conversations/:id/log.
 * @param {string[]} [options.inviteCodes] Invite codes required for registration (SATOWEB_INVITE_CODE).
 * @param {boolean} [options.allowOpenSignup] Explicit open-signup opt-in (SATOWEB_ALLOW_OPEN_SIGNUP=1).
 * @returns {Promise<{server: import("node:http").Server, port: number, close: () => Promise<void>}>}
 */
export async function startServer(options = {}) {
  const port = options.port ?? DEFAULTS.port;
  const host = options.host ?? options.bind ?? DEFAULTS.bind;
  const provider = options.provider ?? "opencode-go";
  const model = modelSelection(options);
  const thinkingLevel = options.thinkingLevel ?? DEFAULTS.thinkingLevel;
  const hostToken =
    typeof options.hostToken === "string" && options.hostToken.length > 0
      ? options.hostToken
      : null;

  // The registration gate: invite codes (if configured), fail-closed on any
  // non-loopback bind without an explicit open-signup opt-in. Sign-in for
  // existing accounts is never gated; only "Create my space" is.
  const inviteGate = createInviteGate({
    inviteCodes: options.inviteCodes ?? [],
    bind: host,
    allowOpenSignup: options.allowOpenSignup === true,
  });

  // Seed instructions come from the skill entry file; a missing skill package
  // is a deployment error and fails the boot loudly.
  const skillPath = options.skillPath ?? DEFAULTS.skillPath;
  const skillInstructions = loadSkillInstructions(skillPath);

  // Each signed-in user's memories live in an isolated vault under this
  // root — never the host's real ~/.satori/memory, which a misconfigured
  // root must not be allowed to reach.
  const vaultRoot = options.vaultRoot ?? DEFAULTS.vaultRoot;
  assertSafeVaultRoot(vaultRoot);

  // Identity lives beside the conversations: named accounts with salted+hashed
  // PINs, and per-user conversation ownership. The session secret persists in
  // the same data directory so signed-in users stay signed in across restarts.
  const dataDir = path.dirname(options.dbPath ?? DEFAULTS.dbPath);
  const userStore = createUserStore(dataDir);
  const sessionSecret = createSessionSecret(dataDir);

  // The model's vault tools are scoped to the owner of the conversation they
  // run in: whatever the model asks for, it can only touch that person's vault.
  const vaultTools = createVaultTools({
    vaultRoot,
    userFor: (conversationId) => {
      const ownerId = userStore.ownerOf(conversationId);
      return ownerId === null ? null : userStore.userById(ownerId);
    },
  });

  const { harness, storage } = await createHarness({
    dbPath: options.dbPath,
    provider,
    modelId: model.modelId,
    skillPath,
    extensions: [vaultTools],
    stubResponses: options.stubResponses,
    stubTokensPerSecond: options.stubTokensPerSecond,
  });

  /** Establishes a session for `user` on the response. */
  function establishSession(res, user) {
    res.setHeader("Set-Cookie", sessionCookie(issueSessionToken(sessionSecret, user.id)));
  }

  /** The signed-in user for a request, or null when there is no valid session. */
  function currentUser(req) {
    const userId = verifySessionToken(sessionSecret, sessionTokenFrom(req));
    return userId === null ? null : userStore.userById(userId);
  }

  /**
   * The client-facing title of a conversation: custom title if set, else the
   * text of its first user message, truncated; "New conversation" before the
   * first message.
   */
  async function conversationTitle(conversationId, existingConv) {
    const customTitle = userStore.titleOf(conversationId);
    if (customTitle !== null) return customTitle;
    const conv =
      existingConv ?? (await harness.conversation(conversationId, BACKGROUND_CONTEXT));
    if (!conv) return "New conversation";
    const page = await conv.entries({ order: "ascending" }, 50, undefined, BACKGROUND_CONTEXT);
    const firstUser = [...(page.items ?? [])].find((record) => record.kind === "pi.user");
    const text = firstUser ? entryText(firstUser) : "";
    if (text.length === 0) return "New conversation";
    return text.length > 60 ? text.slice(0, 60).trimEnd() + "…" : text;
  }

  async function getConversation(id, userId) {
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId < 1) return undefined;
    const conv = await harness.conversation(numId, BACKGROUND_CONTEXT);
    if (!conv) return undefined;
    // A conversation belongs to exactly one user; anyone else sees nothing.
    // `userId === null` is the host's own debug view, exempt from scoping.
    if (userId !== null && !userStore.owns(numId, userId)) return undefined;
    return conv;
  }

  /**
   * Streams one reply over server-sent events: `delta` frames carry new
   * assistant text as the harness commits partial answers, `message` always
   * carries the authoritative final text once the run settles, and `done`
   * ends the stream. Only text blocks are ever sent — thinking stays
   * server-side.
   */
  async function streamReply(res, conv, conversationId, prompt) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });
    res.flushHeaders?.();

    let closed = false;
    res.on("close", () => {
      closed = true;
      if (!settled) {
        Promise.resolve(conv.abort(BACKGROUND_CONTEXT)).catch(() => {});
      }
    });

    /** Frames are written strictly in the order they are captured. */
    let writes = Promise.resolve();
    const writeFrame = (event, data) => {
      const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      writes = writes.then(() => {
        if (!closed) res.write(frame);
      });
    };

    let settled = false;
    let sentText = "";
    const watch = await conv.watch(BACKGROUND_CONTEXT);
    watch.start(async (call) => {
      if (settled || call.kind !== "value") return;
      const partial = call.value.docs?.["pi.live"]?.generation?.message;
      const text = assistantText(partial);
      if (text.length > sentText.length && text.startsWith(sentText)) {
        writeFrame("delta", { text: text.slice(sentText.length) });
        sentText = text;
      }
    });

    try {
      const submission = await conv.submit({ type: "input", content: prompt }, BACKGROUND_CONTEXT);
      const record = await submission.wait(BACKGROUND_CONTEXT);
      settled = true;
      await writes; // let any captured deltas land before the final frames

      if (record.answer !== undefined) {
        const found = await storage.entry(conversationId, record.answer, BACKGROUND_CONTEXT);
        writeFrame("message", { text: found?.entry ? entryText(found.entry) : "" });
      }
      writeFrame("done", { status: record.status });
      await writes;
    } catch (err) {
      // The real error is host-only; the stream says only that it ended.
      console.error("stream error:", err);
      writeFrame("error", { message: "The reply stream ended unexpectedly." });
      await writes;
    } finally {
      closed = true;
      await watch.stop();
      res.end();
    }
  }

  const MAX_JSON_BODY_BYTES = 1024 * 1024; // 1 MB request-body cap

  /** 500 with a generic client-facing message; the real error is logged server-side only. */
  function sendInternalError(res, err) {
    console.error("internal error:", err);
    sendJson(res, 500, { error: "Internal server error" });
  }

  /** Constant-time Bearer-token check (mirrors the sessions.js secret handling). */
  function bearerMatches(secret, header) {
    if (secret === null || typeof header !== "string") return false;
    const prefix = "Bearer ";
    if (!header.startsWith(prefix)) return false;
    const presented = Buffer.from(header.slice(prefix.length), "utf8");
    const expected = Buffer.from(secret, "utf8");
    return presented.length === expected.length && timingSafeEqual(presented, expected);
  }

  async function readJsonBody(req) {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > MAX_JSON_BODY_BYTES) {
        const err = new Error("Request body exceeds the 1 MB limit");
        err.code = "EBODYTOOLARGE";
        throw err;
      }
    }
    return body.length === 0 ? {} : JSON.parse(body);
  }

  /** Maps a body-reading failure to the client response: 413 when oversized, 400 when malformed. */
  function sendBodyError(res, err) {
    if (err?.code === "EBODYTOOLARGE") {
      sendJson(res, 413, { error: "Request body too large" });
    } else {
      sendJson(res, 400, { error: "Body must be valid JSON" });
    }
  }

  function sendJson(res, status, payload) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
  }

  /** The client-facing text of an entry: its text blocks joined, never thinking blocks. */
  function entryText(record) {
    const message = Array.isArray(record.model) ? record.model[0] : record.model;
    if (typeof message?.content === "string") return message.content;
    const blocks = Array.isArray(message?.content) ? message.content : [];
    return blocks
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
    // Thinking stays in the durable log (host-only); never in a client-facing response.
  }

  const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

  const STATIC_CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  };

  /** Serves the static chat page (and its assets) from the public directory. */
  async function serveStatic(res, pathname) {
    const relative = pathname === "/" ? "index.html" : pathname.slice(1);
    const filePath = path.join(PUBLIC_DIR, relative);
    if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
      return;
    }
    try {
      const body = await readFile(filePath);
      res.writeHead(200, {
        "Content-Type": STATIC_CONTENT_TYPES[path.extname(filePath)] ?? "application/octet-stream",
        // Prevent both browser and Cloudflare edge caching so Tailscale IP and
        // Cloudflare Tunnel always serve identical HTML/CSS/JS.
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "CDN-Cache-Control": "no-store",
        "Cloudflare-CDN-Cache-Control": "no-store",
      });
      res.end(body);
    } catch {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
    }
  }

  /** The client-facing text of a (possibly partial) assistant message: text blocks only, never thinking. */
  function assistantText(message) {
    const blocks = Array.isArray(message?.content) ? message.content : [];
    return blocks
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
  }

  /** Maps a durable entry record to the client-facing JSON shape (oldest first). */
  function toClientEntry(record) {
    const message = Array.isArray(record.model) ? record.model[0] : record.model;
    const text = entryText(record);
    return {
      id: record.id,
      kind:
        record.kind === "pi.user"
          ? "user"
          : record.kind === "pi.assistant"
            ? "assistant"
            : record.kind,
      content: typeof message?.content === "string" ? message.content : text,
    };
  }

  /** Host-only view of the durable log: same entries plus thinking and tool activity. */
  function toHostLogEntry(record) {
    const message = Array.isArray(record.model) ? record.model[0] : record.model;
    const blocks = Array.isArray(message?.content) ? message.content : [];
    const text = blocks
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
    const thinking = blocks
      .filter((block) => block.type === "thinking")
      .map((block) => block.thinking)
      .join("\n");
    const toolCalls = blocks
      .filter((block) => block.type === "toolCall")
      .map((block) => ({ name: block.name, arguments: block.arguments }));
    const entry = {
      id: record.id,
      kind:
        record.kind === "pi.user"
          ? "user"
          : record.kind === "pi.assistant"
            ? "assistant"
            : record.kind,
      content: typeof message?.content === "string" ? message.content : text,
    };
    if (thinking.length > 0) entry.thinking = thinking;
    if (toolCalls.length > 0) entry.toolCalls = toolCalls;
    if (record.kind === "pi.tool-result") {
      entry.toolResult = {
        tool: message?.toolName,
        output: text,
        isError: message?.isError === true,
      };
    }
    return entry;
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && !url.pathname.startsWith("/api/")) {
      await serveStatic(res, url.pathname);
      return;
    }

    // Every chat endpoint sits behind the sign-in gate; only health and the
    // auth surface itself are reachable without a session. The host-only log
    // route is not part of the user surface at all — it answers only to the
    // host token (404 otherwise, indistinguishable from a missing route).
    const isHostLogRoute = /^\/api\/conversations\/\d+\/log$/.test(url.pathname);
    const isPublicApi = url.pathname === "/api/health" || url.pathname.startsWith("/api/auth/");
    const user =
      url.pathname.startsWith("/api/") && !isPublicApi && !isHostLogRoute ? currentUser(req) : null;
    if (url.pathname.startsWith("/api/") && !isPublicApi && !isHostLogRoute && !user) {
      sendJson(res, 401, { error: "Not signed in" });
      return;
    }

    if (isHostLogRoute) {
      const authorized = bearerMatches(hostToken, req.headers.authorization);
      if (!authorized) {
        sendJson(res, 404, { error: "Not Found" });
        return;
      }
    }

    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, {
        status: "alive",
        service: "satoriweb",
        // The registration policy only: never the invite codes themselves.
        inviteRequired: inviteGate.policy.inviteRequired,
        model: { provider, modelId: model.modelId, thinkingLevel },
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/auth/config") {
      // The public registration policy for the sign-in screen: whether "Create
      // my space" asks for an invite code first. Never the codes themselves.
      sendJson(res, 200, {
        inviteRequired: inviteGate.policy.inviteRequired,
        mode: inviteGate.policy.mode,
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/register") {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (err) {
        sendBodyError(res, err);
        return;
      }
      // The invite gate decides before any account state is touched: closed
      // deployments refuse, invited ones verify the code timing-safely, and
      // a past-budget source IP is refused outright.
      const gate = inviteGate.checkRegistration({
        ip: requestIp(req),
        inviteCode: body.inviteCode,
      });
      if (!gate.ok) {
        sendJson(res, gate.status, { error: gate.error });
        return;
      }
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const pin = typeof body.pin === "string" ? body.pin : "";
      if (name.length === 0 || pin.length === 0) {
        sendJson(res, 400, { error: "name and pin are required" });
        return;
      }
      try {
        const user = userStore.register(name, pin);
        establishSession(res, user);
        sendJson(res, 200, user);
      } catch (err) {
        if (err.taken) sendJson(res, 409, { error: "Name already taken" });
        else sendInternalError(res, err);
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/signin") {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (err) {
        sendBodyError(res, err);
        return;
      }
      const user = userStore.verify(body.name, body.pin);
      if (!user) {
        sendJson(res, 401, { error: "Invalid name or PIN" });
        return;
      }
      establishSession(res, user);
      sendJson(res, 200, user);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/auth/session") {
      const user = currentUser(req);
      if (!user) {
        sendJson(res, 401, { error: "Not signed in" });
        return;
      }
      sendJson(res, 200, user);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/signout") {
      res.setHeader("Set-Cookie", sessionCookie(""));
      sendJson(res, 200, { ok: true });
      return;
    }

    /* ---------- Memory & Continuity (the signed-in person's own vault) ---------- */

    // Every /api/vault route is scoped to the signed-in user's vault alone:
    // the vault directory is resolved from the session, never from the
    // request, so one user's memory is unreachable from another's session.
    if (url.pathname.startsWith("/api/vault/") || url.pathname === "/api/vault") {
      const vault = createUserVault(vaultRoot, user);

      if (req.method === "GET" && url.pathname === "/api/vault/review") {
        sendJson(res, 200, vault.review());
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/vault/arc") {
        sendJson(res, 200, vault.arc());
        return;
      }

      const entryMatch = url.pathname.match(/^\/api\/vault\/entry\/(\d+)$/);
      if (req.method === "DELETE" && entryMatch) {
        const outcome = vault.forget({ id: Number(entryMatch[1]) });
        if (outcome.error !== undefined) {
          sendJson(res, 400, { error: outcome.error });
          return;
        }
        sendJson(res, 200, outcome.payload);
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/vault/note") {
        const outcome = vault.exportNote();
        if (outcome.error !== undefined) {
          sendInternalError(res, new Error(outcome.error));
          return;
        }
        sendJson(res, 200, outcome.payload);
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/vault/note") {
        let body;
        try {
          body = await readJsonBody(req);
        } catch (err) {
          sendBodyError(res, err);
          return;
        }
        if (typeof body.note !== "string") {
          sendJson(res, 400, { error: "note must be a string" });
          return;
        }
        const outcome = vault.importNote(body.note);
        if (outcome.error !== undefined) {
          sendJson(res, 400, { error: outcome.error });
          return;
        }
        sendJson(res, 200, outcome.payload);
        return;
      }
    }

    if (req.method === "POST" && url.pathname === "/api/onboarding") {
      try {
        const conv = await harness.createConversation(
          { ownership: { kind: "ownerless" } },
          BACKGROUND_CONTEXT,
        );
        userStore.ownConversation(conv.id, user.id);
        await conv.configure(
          {
            model,
            thinkingLevel,
            instructions: skillInstructions + HOST_MEMORY_INSTRUCTIONS,
            maxTurns: options.maxTurns ?? 10,
          },
          BACKGROUND_CONTEXT,
        );
        const title = "Welcome to Satori";
        userStore.renameConversation(conv.id, user.id, title);
        userStore.markOnboarded(user.id);
        const safeName =
          user.name.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 64) || "friend";
        const prompt =
          `Hello Satori, my name is ${safeName} and it is my first time here. ` +
          `I am new to this, so can you introduce yourself to me, explain what this space is best used for, ` +
          `and what I can do here, and then start my onboarding?`;
        sendJson(res, 200, { id: conv.id, title, prompt });
      } catch (err) {
        sendInternalError(res, err);
      }
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/conversations") {
      try {
        const conversations = [];
        for (const id of userStore.ownedConversationIds(user.id)) {
          const conv = await harness.conversation(id, BACKGROUND_CONTEXT);
          if (!conv) continue;
          conversations.push({ id, title: await conversationTitle(id, conv) });
        }
        sendJson(res, 200, conversations);
      } catch (err) {
        sendInternalError(res, err);
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/conversations") {
      try {
        const conv = await harness.createConversation(
          { ownership: { kind: "ownerless" } },
          BACKGROUND_CONTEXT,
        );
        userStore.ownConversation(conv.id, user.id);
        await conv.configure(
          {
            model,
            thinkingLevel,
            // Every new conversation is Satori: the skill entry file is the
            // instruction seed, so the skill's own logic governs the session.
            // The host appends only how to reach this person's memory vault.
            instructions: skillInstructions + HOST_MEMORY_INSTRUCTIONS,
            maxTurns: options.maxTurns ?? 10,
          },
          BACKGROUND_CONTEXT,
        );
        sendJson(res, 200, { id: conv.id });
      } catch (err) {
        sendInternalError(res, err);
      }
      return;
    }

    const convMatch = url.pathname.match(/^\/api\/conversations\/(\d+)$/);
    if (req.method === "PATCH" && convMatch) {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (err) {
        sendBodyError(res, err);
        return;
      }
      try {
        const conv = await getConversation(convMatch[1], user.id);
        if (!conv) {
          sendJson(res, 404, { error: "Conversation not found" });
          return;
        }
        if (typeof body.title !== "string") {
          sendJson(res, 400, { error: "title must be a string" });
          return;
        }
        const title = body.title.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
        if (title.length === 0 || title.length > 120) {
          sendJson(res, 400, { error: "title must be 1 to 120 characters" });
          return;
        }
        const numId = Number(convMatch[1]);
        userStore.renameConversation(numId, user.id, title);
        sendJson(res, 200, { id: numId, title });
      } catch (err) {
        sendInternalError(res, err);
      }
      return;
    }

    if (req.method === "DELETE" && convMatch) {
      try {
        const conv = await getConversation(convMatch[1], user.id);
        if (!conv) {
          sendJson(res, 404, { error: "Conversation not found" });
          return;
        }
        const numId = Number(convMatch[1]);
        try {
          await conv.abort(BACKGROUND_CONTEXT);
        } catch {
          // Safe if no run is active on this conversation.
        }
        userStore.deleteConversation(numId, user.id);
        sendJson(res, 200, { ok: true });
      } catch (err) {
        sendInternalError(res, err);
      }
      return;
    }

    const entriesMatch = url.pathname.match(/^\/api\/conversations\/(\d+)\/entries$/);
    if (req.method === "GET" && entriesMatch) {
      try {
        const conv = await getConversation(entriesMatch[1], user.id);
        if (!conv) {
          sendJson(res, 404, { error: "Conversation not found" });
          return;
        }
        const page = await conv.entries({}, 100, undefined, BACKGROUND_CONTEXT);
        const entries = [...(page.items ?? [])].reverse().map(toClientEntry);
        sendJson(res, 200, entries);
      } catch (err) {
        sendInternalError(res, err);
      }
      return;
    }

    // Host-only debug view of the durable log: includes thinking and tool calls.
    // Never linked from the client UI; the client surface is /entries.
    const logMatch = url.pathname.match(/^\/api\/conversations\/(\d+)\/log$/);
    if (req.method === "GET" && logMatch) {
      try {
        // Host debug view: scoped by the host token above, not by user session.
        const conv = await getConversation(logMatch[1], null);
        if (!conv) {
          sendJson(res, 404, { error: "Conversation not found" });
          return;
        }
        const page = await conv.entries({}, 100, undefined, BACKGROUND_CONTEXT);
        const log = [...(page.items ?? [])].reverse().map(toHostLogEntry);
        sendJson(res, 200, log);
      } catch (err) {
        sendInternalError(res, err);
      }
      return;
    }

    const submitMatch = url.pathname.match(/^\/api\/conversations\/(\d+)\/submit$/);
    if (req.method === "POST" && submitMatch) {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (err) {
        sendBodyError(res, err);
        return;
      }
      try {
        const conv = await getConversation(submitMatch[1], user.id);
        if (!conv) {
          sendJson(res, 404, { error: "Conversation not found" });
          return;
        }
        if (typeof body.prompt !== "string" || body.prompt.length === 0) {
          sendJson(res, 400, { error: "prompt must be a non-empty string" });
          return;
        }
        if ((req.headers.accept ?? "").includes("text/event-stream")) {
          await streamReply(res, conv, Number(submitMatch[1]), body.prompt);
          return;
        }
        const submission = await conv.submit(
          { type: "input", content: body.prompt },
          BACKGROUND_CONTEXT,
        );
        const settled = await submission.wait(BACKGROUND_CONTEXT);
        sendJson(res, 200, { status: settled.status, submissionId: submission.id });
      } catch (err) {
        sendInternalError(res, err);
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });

  return {
    server,
    port: server.address().port,
    close: async () => {
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.close(resolve);
      });
      await storage.close();
    },
  };
}

export { startServer as default };

// Boot from environment configuration when executed directly.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { readConfig } = await import("./config.js");
  const config = readConfig();
  console.log(`SatoriWeb listening on http://${config.bind ?? "127.0.0.1"}:${config.port}`);
  await startServer(config);
}
