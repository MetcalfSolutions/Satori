// Satori chat — plain browser JavaScript over the SatoriWeb HTTP API.
// One page, no framework, no build step. The API is the whole surface:
// sign-in, onboarding, conversations, entries, and the SSE reply stream.

const els = {
  authScreen: document.getElementById("sign-in"),
  authForm: document.getElementById("auth-form"),
  authName: document.getElementById("auth-name"),
  authPin: document.getElementById("auth-pin"),
  authInviteField: document.getElementById("auth-invite-field"),
  authInvite: document.getElementById("auth-invite"),
  authError: document.getElementById("auth-error"),
  authRegister: document.getElementById("auth-register"),
  app: document.getElementById("app"),
  sidebar: document.getElementById("sidebar"),
  drawerBackdrop: document.getElementById("drawer-backdrop"),
  memoryDrawer: document.getElementById("memory-drawer"),
  memoryBody: document.getElementById("memory-body"),
  memoryClose: document.getElementById("memory-close"),
  openMemory: document.getElementById("open-memory"),
  chat: document.getElementById("chat"),
  signOut: document.getElementById("sign-out"),
  newChat: document.getElementById("new-chat"),
  conversationList: document.getElementById("conversation-list"),
  messages: document.getElementById("messages"),
  emptyState: document.getElementById("empty-state"),
  composer: document.getElementById("composer"),
  input: document.getElementById("composer-input"),
  send: document.getElementById("composer-send"),
  menuToggle: document.getElementById("menu-toggle"),
  drawerClose: document.getElementById("drawer-close"),
};

/** Signed-in user `{ id, name, onboarded }`, or null when signed out. */
let currentUser = null;
/** The durable conversation currently open; null means a fresh chat. */
let conversationId = null;
let streaming = false;
let streamAbortController = null;
let currentStreamToken = 0;
/** True when this deployment's "Create my space" asks for an invite code first. */
let inviteRequired = false;
/** True once the invite field has been revealed on the sign-in screen. */
let inviteRevealed = false;

/* ---------- API helpers ---------- */

async function api(pathname, options) {
  const res = await fetch(pathname, options);
  if (res.status === 401) {
    showSignIn();
    throw new Error("Not signed in");
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error ?? `Request failed (${res.status})`);
  }
  return res;
}

async function createConversation() {
  const res = await api("/api/conversations", { method: "POST" });
  return (await res.json()).id;
}

async function startOnboarding() {
  const res = await api("/api/onboarding", { method: "POST" });
  return res.json();
}

async function loadConversationList() {
  const res = await api("/api/conversations");
  return res.json();
}

async function loadEntries(id) {
  const res = await api(`/api/conversations/${id}/entries`);
  return res.json();
}

async function renameConversation(id, title) {
  const res = await api(`/api/conversations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

async function deleteConversation(id) {
  await api(`/api/conversations/${id}`, { method: "DELETE" });
}

/* ---------- Stream cancellation ---------- */

function abortActiveStream() {
  if (streamAbortController) {
    currentStreamToken += 1;
    streamAbortController.abort();
    streamAbortController = null;
  }
  streaming = false;
  els.send.disabled = false;
}

/* ---------- Rendering ---------- */

function renderEmpty() {
  els.messages.replaceChildren(els.emptyState);
}

function renderMessage(kind, text) {
  const bubble = document.createElement("div");
  bubble.className = `message ${kind}`;
  bubble.textContent = text;
  els.emptyState.remove();
  els.messages.append(bubble);
  els.messages.scrollTop = els.messages.scrollHeight;
  return bubble;
}

/**
 * Renders one conversation's history. Only the user's and the assistant's
 * text is ever shown; anything else the API returns (such as a `thinking`
 * field) is ignored — model reasoning never reaches the screen.
 */
function renderHistory(entries) {
  els.messages.replaceChildren();
  if (entries.length === 0) {
    els.messages.append(els.emptyState);
    return;
  }
  for (const entry of entries) {
    if (entry.kind !== "user" && entry.kind !== "assistant") continue;
    renderMessage(entry.kind, entry.content ?? "");
  }
}

function renderConversationList(conversations) {
  els.conversationList.replaceChildren();
  if (conversations.length === 0) {
    const note = document.createElement("span");
    note.className = "conversation-list-empty";
    note.textContent = "No conversations yet";
    els.conversationList.append(note);
    return;
  }
  for (const conversation of conversations) {
    const row = document.createElement("div");
    row.className = "conversation-row";
    if (conversation.id === conversationId) row.classList.add("active");

    const item = document.createElement("button");
    item.type = "button";
    item.className = "conversation-item";
    item.textContent = conversation.title;
    item.addEventListener("click", () => openConversation(conversation.id));

    const actions = document.createElement("div");
    actions.className = "conversation-actions";

    const renameBtn = document.createElement("button");
    renameBtn.type = "button";
    renameBtn.className = "conversation-action";
    renameBtn.textContent = "✎";
    renameBtn.setAttribute("aria-label", `Rename ${conversation.title}`);
    renameBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      beginRename(row, item, conversation);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "conversation-action";
    deleteBtn.textContent = "✕";
    deleteBtn.setAttribute("aria-label", `Delete ${conversation.title}`);

    const resetConfirm = () => {
      row.classList.remove("confirming");
      deleteBtn.classList.remove("confirming");
      deleteBtn.textContent = "✕";
      deleteBtn.setAttribute("aria-label", `Delete ${conversation.title}`);
    };

    deleteBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      if (!deleteBtn.classList.contains("confirming")) {
        row.classList.add("confirming");
        deleteBtn.classList.add("confirming");
        deleteBtn.textContent = "Confirm";
        deleteBtn.setAttribute("aria-label", `Confirm delete ${conversation.title}`);
        return;
      }
      await handleDeleteConversation(conversation.id);
    });

    row.addEventListener("focusout", (event) => {
      if (!row.contains(event.relatedTarget)) resetConfirm();
    });

    actions.append(renameBtn, deleteBtn);
    row.append(item, actions);
    els.conversationList.append(row);
  }
}

function beginRename(row, item, conversation) {
  if (row.querySelector(".conversation-rename-input")) return;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "conversation-rename-input";
  input.maxLength = 120;
  input.value = conversation.title;
  input.setAttribute("aria-label", "Conversation title");

  let done = false;
  const finish = async (commit) => {
    if (done) return;
    done = true;
    const nextTitle = input.value.trim();
    input.replaceWith(item);
    if (!commit || nextTitle.length === 0 || nextTitle === conversation.title) {
      item.focus();
      return;
    }
    try {
      const updated = await renameConversation(conversation.id, nextTitle);
      conversation.title = updated.title;
      item.textContent = updated.title;
    } catch (err) {
      console.error("rename failed:", err);
    }
    item.focus();
  };

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      finish(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      finish(false);
    }
  });
  input.addEventListener("blur", () => finish(true));

  item.replaceWith(input);
  input.focus();
  input.select();
}

async function handleDeleteConversation(id) {
  const wasActive = id === conversationId;
  if (wasActive) abortActiveStream();
  try {
    await deleteConversation(id);
    const remaining = await loadConversationList();
    if (wasActive) {
      if (remaining.length > 0) {
        conversationId = remaining[0].id;
        renderConversationList(remaining);
        renderHistory(await loadEntries(conversationId));
      } else {
        conversationId = null;
        renderConversationList(remaining);
        renderEmpty();
      }
    } else {
      renderConversationList(remaining);
    }
  } catch (err) {
    console.error("delete failed:", err);
  }
}

/* ---------- Sign-in gate ---------- */

function showSignIn() {
  abortActiveStream();
  currentUser = null;
  conversationId = null;
  closeDrawer(false);
  closeMemoryDrawer(false);
  els.app.hidden = true;
  els.authScreen.hidden = false;
  els.authError.hidden = true;
  els.authPin.value = "";
  els.authName.focus();
}

async function showChat(user) {
  currentUser = user;
  els.authScreen.hidden = true;
  els.app.hidden = false;
  closeDrawer(false);

  const conversations = await loadConversationList();
  if (conversations.length > 0) {
    conversationId = conversations[0].id;
    renderConversationList(conversations);
    renderHistory(await loadEntries(conversationId));
    els.input.focus();
    return;
  }

  if (user && !user.onboarded) {
    try {
      const onboarding = await startOnboarding();
      currentUser = { ...user, onboarded: true };
      conversationId = onboarding.id;
      renderConversationList([{ id: onboarding.id, title: onboarding.title }]);
      await send(onboarding.prompt);
      return;
    } catch (err) {
      if (err.message === "Not signed in") return;
      console.error("onboarding failed:", err);
    }
  }

  conversationId = null;
  renderConversationList(conversations);
  renderEmpty();
  els.input.focus();
}

async function authError(message) {
  els.authError.textContent = message;
  els.authError.hidden = false;
}

/** Signs in an existing account; the returning-user flow never asks for an invite code. */
async function authenticateSignIn() {
  const name = els.authName.value.trim();
  const pin = els.authPin.value;
  if (name.length === 0 || pin.length === 0) {
    await authError("Please enter your name and PIN.");
    return;
  }
  try {
    const res = await api("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pin }),
    });
    const user = await res.json();
    await showChat(user);
  } catch (err) {
    if (err.message === "Not signed in") return;
    await authError("That name and PIN did not match. Try again.");
  }
}

/** Creates a new space. When the deployment asks for invite codes, the first tap only reveals the invite field. */
async function authenticateRegister() {
  if (inviteRequired && !inviteRevealed) {
    inviteRevealed = true;
    els.authInviteField.hidden = false;
    els.authRegister.textContent = "Create my space";
    els.authInvite.focus();
    return;
  }
  const name = els.authName.value.trim();
  const pin = els.authPin.value;
  if (name.length === 0 || pin.length === 0) {
    await authError("Please enter your name and PIN.");
    return;
  }
  const body = { name, pin };
  if (inviteRequired) {
    const inviteCode = els.authInvite.value.trim();
    if (inviteCode.length === 0) {
      await authError("Please enter the invite code your host gave you.");
      return;
    }
    body.inviteCode = inviteCode;
  }
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      showSignIn();
      return;
    }
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      if (res.status === 409) {
        await authError("That name is already taken. Try signing in instead.");
      } else {
        await authError(detail.error ?? "Registration did not go through. Try again.");
      }
      return;
    }
    const user = await res.json();
    await showChat(user);
  } catch (err) {
    console.error(err);
    await authError("Satori could not be reached. Please try again.");
  }
}

els.authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  authenticateSignIn();
});

els.authRegister.addEventListener("click", () => {
  authenticateRegister();
});

els.signOut.addEventListener("click", async () => {
  abortActiveStream();
  try {
    await fetch("/api/auth/signout", { method: "POST" });
  } catch {
    // The session is cleared client-side either way.
  }
  showSignIn();
});

/* ---------- Slide-over navigation drawer ---------- */

function openDrawer() {
  els.app.classList.add("drawer-open");
  els.drawerBackdrop.hidden = false;
  els.sidebar.inert = false;
  els.sidebar.removeAttribute("aria-hidden");
  els.chat.inert = true;
  els.menuToggle.setAttribute("aria-expanded", "true");
  els.menuToggle.setAttribute("aria-label", "Close conversations");
  els.drawerClose.focus();
}

function closeDrawer(restoreFocus = false) {
  const wasOpen = els.app.classList.contains("drawer-open");
  els.app.classList.remove("drawer-open");
  els.drawerBackdrop.hidden = true;
  els.sidebar.inert = true;
  els.sidebar.setAttribute("aria-hidden", "true");
  els.chat.inert = false;
  els.menuToggle.setAttribute("aria-expanded", "false");
  els.menuToggle.setAttribute("aria-label", "Open conversations");
  if (wasOpen) {
    for (const el of els.conversationList.querySelectorAll(".confirming")) {
      el.classList.remove("confirming");
      if (el.tagName === "BUTTON") el.textContent = "✕";
    }
  }
  if (restoreFocus && wasOpen) els.menuToggle.focus();
}

els.menuToggle.addEventListener("click", () => {
  if (els.app.classList.contains("drawer-open")) closeDrawer(true);
  else openDrawer();
});

els.drawerClose.addEventListener("click", () => closeDrawer(true));
els.drawerBackdrop.addEventListener("click", () => {
  if (els.app.classList.contains("memory-open")) closeMemoryDrawer(true);
  else closeDrawer(true);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (els.app.classList.contains("drawer-open")) {
    closeDrawer(true);
  } else if (els.app.classList.contains("memory-open")) {
    closeMemoryDrawer(true);
  }
});

/* ---------- Memory & Continuity drawer ---------- */

function openMemoryDrawer() {
  closeDrawer(false);
  els.app.classList.add("memory-open");
  els.drawerBackdrop.hidden = false;
  els.memoryDrawer.inert = false;
  els.memoryDrawer.removeAttribute("aria-hidden");
  els.chat.inert = true;
  els.memoryClose.focus();
  renderMemory();
}

function closeMemoryDrawer(restoreFocus = false) {
  const wasOpen = els.app.classList.contains("memory-open");
  els.app.classList.remove("memory-open");
  els.drawerBackdrop.hidden = true;
  els.memoryDrawer.inert = true;
  els.memoryDrawer.setAttribute("aria-hidden", "true");
  els.chat.inert = false;
  if (restoreFocus && wasOpen) els.openMemory.focus();
}

els.openMemory.addEventListener("click", openMemoryDrawer);
els.memoryClose.addEventListener("click", () => closeMemoryDrawer(true));

/** A small labelled section of the memory drawer. */
function memorySection(title) {
  const section = document.createElement("section");
  section.className = "memory-section";
  const heading = document.createElement("h2");
  heading.textContent = title;
  section.append(heading);
  els.memoryBody.append(section);
  return section;
}

/** One remembered theme: label, count, date, and a two-tap Forget button. */
function memoryRow(container, row, { hint }) {
  const item = document.createElement("div");
  item.className = "memory-item";

  const label = document.createElement("div");
  label.className = "memory-item-label";
  const name = document.createElement("span");
  name.className = "memory-item-name";
  name.textContent = row.theme;
  const meta = document.createElement("span");
  meta.className = "memory-item-meta";
  meta.textContent = `#${row.id} · ${row.layer} · seen ${row.recurrence_count}x · last ${row.session_date}`;
  label.append(name, meta);

  if (typeof row.summary_preview === "string" && row.summary_preview.length > 0) {
    const preview = document.createElement("p");
    preview.className = "memory-item-preview";
    preview.textContent = row.summary_preview;
    label.append(preview);
  }

  const forget = document.createElement("button");
  forget.type = "button";
  forget.className = "memory-forget";
  forget.textContent = "Forget";
  forget.setAttribute("aria-label", `Forget ${row.theme}`);
  forget.addEventListener("click", async () => {
    if (!forget.classList.contains("confirming")) {
      forget.classList.add("confirming");
      forget.textContent = "Confirm";
      return;
    }
    forget.disabled = true;
    try {
      const res = await api(`/api/vault/entry/${row.id}`, { method: "DELETE" });
      await res.json();
      await renderMemory();
    } catch (err) {
      console.error("forget failed:", err);
      forget.disabled = false;
      forget.classList.remove("confirming");
      forget.textContent = "Forget";
    }
  });

  item.append(label, forget);
  if (hint) item.append(hint);
  container.append(item);
}

async function renderMemory() {
  els.memoryBody.replaceChildren();
  const loading = document.createElement("p");
  loading.className = "memory-note";
  loading.textContent = "Loading what Satori remembers…";
  els.memoryBody.append(loading);

  let review;
  let arc;
  try {
    [review, arc] = await Promise.all([
      api("/api/vault/review").then((res) => res.json()),
      api("/api/vault/arc").then((res) => res.json()),
    ]);
  } catch (err) {
    if (err.message === "Not signed in") return;
    els.memoryBody.replaceChildren();
    const note = document.createElement("p");
    note.className = "memory-note";
    note.textContent = "Satori's memory could not be reached. Please try again.";
    els.memoryBody.append(note);
    return;
  }

  els.memoryBody.replaceChildren();

  const overview = memorySection("What Satori remembers");
  const intro = document.createElement("p");
  intro.className = "memory-note";
  intro.textContent =
    review.total_memories === 0
      ? "Nothing yet. Structural patterns Satori notices in conversation appear here, never raw transcripts."
      : `${review.total_memories} structural memories across ${review.total_sessions} session${review.total_sessions === 1 ? "" : "s"}. Data-only: raw conversation transcripts are never stored.`;
  overview.append(intro);

  const active = memorySection("Active themes & patterns");
  if (review.active.length === 0) {
    const none = document.createElement("p");
    none.className = "memory-note";
    none.textContent = "No active themes yet.";
    active.append(none);
  } else {
    for (const row of review.active) memoryRow(active, row, {});
  }

  const dream = memorySection("Dream-layer watch");
  if (review.dream_watch.length === 0) {
    const none = document.createElement("p");
    none.className = "memory-note";
    none.textContent = "Nothing on the background watch.";
    dream.append(none);
  } else {
    for (const row of review.dream_watch) {
      const hint = document.createElement("span");
      hint.className = "memory-item-hint";
      hint.textContent =
        row.action_hint === "hold_silently"
          ? "Held quietly."
          : row.action_hint === "gentle_bridge_if_relevant"
            ? "Gentle bridge, only if a natural opening appears."
            : "Pattern threshold reached; named gently.";
      memoryRow(dream, row, { hint });
    }
  }

  const graduation = memorySection("Graduation Signal");
  const counts = document.createElement("p");
  counts.className = "memory-note";
  counts.textContent = `Movement: ${arc.counts.stabilized} stabilized, ${arc.counts.shifting} shifting, ${arc.counts.emerging} emerging, ${arc.counts.dormant} dormant.`;
  const signal = document.createElement("p");
  signal.className = "memory-note";
  if (arc.graduation_signal.status === "graduation_window" && arc.graduation_signal.themes.length > 0) {
    signal.textContent = `A graduation window: ${arc.graduation_signal.themes.join(", ")} have gone quiet. ${arc.graduation_signal.message}`;
  } else {
    signal.textContent = arc.graduation_signal.message;
  }
  graduation.append(counts, signal);

  const continuity = memorySection("Continuity Note");
  const exportRow = document.createElement("div");
  exportRow.className = "memory-note-row";
  const exportBtn = document.createElement("button");
  exportBtn.type = "button";
  exportBtn.className = "memory-action";
  exportBtn.textContent = "Copy SATORI_NOTE";
  const exportStatus = document.createElement("span");
  exportStatus.className = "memory-item-meta";
  exportBtn.addEventListener("click", async () => {
    try {
      const res = await api("/api/vault/note");
      const { note } = await res.json();
      await copyToClipboard(note);
      exportStatus.textContent = "Copied. Keep it anywhere Satori cannot reach.";
    } catch (err) {
      console.error("export failed:", err);
      exportStatus.textContent = "The note could not be exported.";
    }
  });
  exportRow.append(exportBtn, exportStatus);
  continuity.append(exportRow);

  const importLabel = document.createElement("p");
  importLabel.className = "memory-note";
  importLabel.textContent =
    "Import a continuity note (data-only, injection-screened) to carry a thread between spaces:";
  continuity.append(importLabel);
  const importArea = document.createElement("textarea");
  importArea.className = "memory-import";
  importArea.rows = 5;
  importArea.setAttribute("aria-label", "Continuity note to import");
  importArea.placeholder = "SATORI_NOTE v6.5\ntheme: ...\nstep: anchor\n...";
  const importRow = document.createElement("div");
  importRow.className = "memory-note-row";
  const importBtn = document.createElement("button");
  importBtn.type = "button";
  importBtn.className = "memory-action";
  importBtn.textContent = "Import note";
  const importStatus = document.createElement("span");
  importStatus.className = "memory-item-meta";
  importBtn.addEventListener("click", async () => {
    const note = importArea.value.trim();
    if (note.length === 0) {
      importStatus.textContent = "Paste a continuity note first.";
      return;
    }
    importBtn.disabled = true;
    try {
      const res = await api("/api/vault/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const result = await res.json();
      importArea.value = "";
      importStatus.textContent = `Imported: ${result.theme}.`;
      await renderMemory();
    } catch (err) {
      importStatus.textContent = err.message;
    } finally {
      importBtn.disabled = false;
    }
  });
  importRow.append(importBtn, importStatus);
  continuity.append(importArea, importRow);
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for non-secure contexts (plain HTTP on a tailnet).
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

/* ---------- Conversation flow ---------- */

async function openConversation(id) {
  abortActiveStream();
  conversationId = id;
  closeDrawer(false);
  await refreshConversationList();
  renderHistory(await loadEntries(id));
  els.input.focus();
}

async function startNewChat() {
  abortActiveStream();
  conversationId = null;
  closeDrawer(false);
  await refreshConversationList();
  renderEmpty();
  els.input.focus();
}

async function refreshConversationList() {
  renderConversationList(await loadConversationList());
}

/* ---------- Streaming ---------- */

/** Reads a text/event-stream response body, invoking onEvent per frame. */
async function readSse(res, onEvent) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const event = /^event: (.*)$/m.exec(frame)?.[1] ?? "message";
      const data = JSON.parse(/^data: (.*)$/m.exec(frame)?.[1] ?? "{}");
      onEvent(event, data);
    }
  }
}

async function send(prompt) {
  abortActiveStream();
  const token = ++currentStreamToken;
  const controller = new AbortController();
  streamAbortController = controller;
  streaming = true;
  els.send.disabled = true;

  if (conversationId === null) {
    conversationId = await createConversation();
  }

  renderMessage("user", prompt);
  const bubble = renderMessage("assistant", "");
  bubble.classList.add("streaming");

  const addNote = (text) => {
    const note = document.createElement("span");
    note.className = "note";
    note.textContent = text;
    bubble.append(note);
  };

  try {
    const res = await fetch(`/api/conversations/${conversationId}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);

    await readSse(res, (event, data) => {
      if (token !== currentStreamToken) return;
      if (event === "delta") {
        bubble.textContent += data.text ?? "";
        els.messages.scrollTop = els.messages.scrollHeight;
      } else if (event === "message") {
        bubble.textContent = data.text ?? "";
      } else if (event === "done") {
        if (data.status !== "done") addNote("The reply was interrupted.");
      } else if (event === "error") {
        addNote("Something went wrong on the server. Please try again.");
      }
    });
  } catch (err) {
    if (err?.name === "AbortError") return;
    if (token === currentStreamToken) {
      addNote("Satori could not be reached. Please try again.");
      console.error(err);
    }
  } finally {
    bubble.classList.remove("streaming");
    if (token === currentStreamToken) {
      streamAbortController = null;
      streaming = false;
      els.send.disabled = false;
      els.input.value = "";
      autosize();
      els.input.focus();
      if (currentUser !== null) {
        await refreshConversationList().catch(() => {});
      }
    }
  }
}

/* ---------- Composer ---------- */

function autosize() {
  els.input.style.height = "auto";
  els.input.style.height = `${Math.min(els.input.scrollHeight, 180)}px`;
}

els.composer.addEventListener("submit", (event) => {
  event.preventDefault();
  const prompt = els.input.value.trim();
  if (prompt.length === 0 || streaming) return;
  send(prompt);
});

els.input.addEventListener("input", autosize);

els.input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    els.composer.requestSubmit();
  }
});

els.newChat.addEventListener("click", startNewChat);

/* ---------- Boot ---------- */

(async () => {
  // The sign-in screen needs to know whether "Create my space" will ask for
  // an invite code; the codes themselves are never sent to the client.
  try {
    const config = await (await fetch("/api/auth/config")).json();
    inviteRequired = config.inviteRequired === true;
  } catch {
    inviteRequired = false;
  }

  const res = await fetch("/api/auth/session").catch(() => null);
  if (res && res.ok) {
    const user = await res.json();
    await showChat(user);
  } else {
    showSignIn();
  }
})();
