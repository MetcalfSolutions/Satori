# public

## Overview
Browser frontend for SatoriWeb Beta: a zero-framework, single-page conversational web UI served as static assets (`/`, `/index.html`, `/app.js`, `/style.css`) over the SatoriWeb HTTP API. Handles name+PIN authentication with an optional invite-code step after "Create my space" (the returning-user Sign in flow is untouched), live first-time onboarding (`"Welcome to Satori"`), auto-loading the user's most recent conversation, a fixed slide-over `<aside>` navigation drawer (hidden by default on all viewports), a Memory & Continuity drawer, inline rename/two-tap delete, and progressive SSE reply streaming with `AbortController`.

## Interface
- `[index.html:#sign-in]`: Auth screen container holding `#auth-form` (`#auth-name`, `#auth-pin`, the hidden `#auth-invite-field`/`#auth-invite`, `#auth-error`, `#auth-signin`, `#auth-register`).
- `[index.html:#app]`: Main chat container (hidden until authenticated) holding `#drawer-backdrop`, `<aside id="sidebar" class="drawer" inert>` (`#new-chat`, `#drawer-close`, `#conversation-list`, `#open-memory`, `#sign-out`), the Memory & Continuity `<aside id="memory-drawer" class="drawer memory" inert>` (`#memory-close`, `#memory-body`), and `<main id="chat">` (`#menu-toggle`, `#messages`, `#empty-state`, `#composer`, `#composer-input`, `#composer-send`).
- `[app.js:api]`: `api(pathname, options)` fetch wrapper that resets to `#sign-in` on HTTP `401`.
- `[app.js:showChat]` / `[app.js:showSignIn]`: Session gate transitions; `showChat(user)` opens `conversations[0].id` if present, calls `POST /api/onboarding` when `!user.onboarded && conversations.length === 0` to stream `"Welcome to Satori"`, or renders `#empty-state`.
- `[app.js:authenticateSignIn]` / `[app.js:authenticateRegister]`: The sign-in flow posts `name`/`pin` only; when `inviteRequired` is true the first "Create my space" tap reveals `#auth-invite-field`, and the next tap registers with `inviteCode` included.
- `[app.js:openDrawer]` / `[app.js:closeDrawer]` / `[app.js:openMemoryDrawer]` / `[app.js:closeMemoryDrawer]`: Fixed slide-over drawer controls toggling `#app.drawer-open` / `#app.memory-open`, `inert` on `#sidebar`/`#memory-drawer` and `#chat`, and `#drawer-backdrop.hidden`.
- `[app.js:renderMemory]` / `[app.js:memoryRow]` / `[app.js:memorySection]` / `[app.js:copyToClipboard]`: The Memory & Continuity drawer: review (`GET /api/vault/review`), Graduation Signal (`GET /api/vault/arc`), two-tap Forget (`DELETE /api/vault/entry/:id`), note export (`GET /api/vault/note` + clipboard), and note import (`POST /api/vault/note`).
- `[app.js:openConversation]` / `[app.js:startNewChat]` / `[app.js:refreshConversationList]` / `[app.js:beginRename]` / `[app.js:handleDeleteConversation]`: Conversation switching, inline rename (`PATCH /api/conversations/:id`), and two-tap delete (`DELETE /api/conversations/:id`).
- `[app.js:send]` / `[app.js:abortActiveStream]` / `[app.js:readSse]`: Submits prompts with `AbortController` + monotonic `streamToken` to `POST /api/conversations/:id/submit` (`Accept: text/event-stream`).
- `[app.js:renderHistory]` / `[app.js:renderMessage]` / `[app.js:renderEmpty]` / `[app.js:renderConversationList]` / `[app.js:autosize]`: DOM rendering and `#composer-input` sizing helpers.

## Invariants
- `[app.js:showSignIn]` / `[app.js:api]`: `#app` remains hidden until a valid session exists; any `401` response aborts active streams, clears `currentUser`/`conversationId`, calls `showSignIn()`, and throws `Error("Not signed in")`.
- `[app.js:authenticateRegister]`: The invite code is only collected and sent when the deployment reports `inviteRequired`; sign-in never sends one.
- `[app.js:openDrawer]` / `[app.js:closeDrawer]` / `[app.js:openMemoryDrawer]` / `[app.js:closeMemoryDrawer]`: `#sidebar` and `#memory-drawer` are `inert` when closed; `#chat` is `inert` while either drawer is open; `Escape` closes whichever is open.
- `[app.js:renderHistory]`: Only entries with `entry.kind === "user"` or `"assistant"` are rendered; `thinking` and internal fields are ignored.
- `[app.js:send]` / `[app.js:abortActiveStream]`: Switching conversations, starting a new chat, signing out, or deleting the active conversation aborts any in-flight SSE stream and ignores `AbortError` / stale `streamToken` cleanups.

## Side Effects
- `[app.js:boot]` / `[app.js:api]`: Issues `fetch()` requests to `/api/auth/config`, `/api/auth/*`, `/api/onboarding`, `/api/conversations*`, and `/api/vault*`.
- `[app.js:renderHistory]` / `[app.js:renderMemory]` / `[app.js:openDrawer]` / `[app.js:send]`: Mutates DOM state, `inert` attributes, and scroll positions; `copyToClipboard` writes to `navigator.clipboard` with a non-secure-context fallback.

## Verification
- Run: `npm test`
