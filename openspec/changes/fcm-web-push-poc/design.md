## Context

The repository is an empty OpenSpec scaffold (`openspec/config.yaml` only, no changes, no source). There is no existing architecture to conform to, so this design establishes the initial structure for a Firebase Cloud Messaging (FCM) proof-of-concept. The POC must be small enough to read in one sitting yet complete enough to exercise the full web push round trip: token registration, server-side send, foreground receive, and background receive.

Constraints:
- No database, auth, or multi-tenant concerns (see proposal Non-Goals).
- Secrets (Firebase service account JSON, VAPID keys) must never be committed.
- FCM web delivery requires a secure context (HTTPS or `localhost`) and a registered service worker.

## Goals / Non-Goals

**Goals:**
- Demonstrate the complete FCM web push loop end-to-end.
- Keep the code small and commented so FCM mechanics are visible.
- Make setup reproducible via `.env.example` and a documented Firebase console checklist.
- Provide a manual test checklist covering foreground, background, and failure cases.

**Non-Goals:**
- No Android/iOS clients.
- No production hardening (rate limiting, token refresh handling, retry/backoff, delivery receipts).
- No database persistence; in-memory token store only.
- No authentication on the sender endpoints beyond a shared dev secret.

## Decisions

### D1: Sender runtime — Node.js + Express + `firebase-admin`

**Choice:** Node.js 18+ with Express and the Firebase Admin SDK.

**Rationale:** The Admin SDK's Node implementation is the most documented and has the cleanest messaging API (`admin.messaging().send()`). Express keeps the HTTP layer trivial.

**Alternatives considered:**
- Python (`firebase-admin` Python SDK) — familiar to the author's other projects, but the Python FCM docs are thinner and the async client is less ergonomic for a quick POC.
- Go — no first-party Admin SDK; would require hand-rolling the FCM V1 HTTP API with OAuth2 token management, defeating "small".
- PHP/Hyperf — no first-party SDK; same drawback as Go.

### D2: Client build tool — Vite + vanilla JS

**Choice:** Vite dev server with vanilla JavaScript (no framework).

**Rationale:** Vite gives instant HMR and a production build; vanilla JS keeps the FCM code (token acquisition, `onMessage`, service worker registration) unobscured by framework boilerplate. The Firebase JS SDK v10 modular API is tree-shakeable and well suited to this.

**Alternatives considered:**
- React/Vue — adds component/state machinery that distracts from FCM mechanics.
- Create React App — deprecated; Vite is the current standard.

### D3: Token storage — in-memory array in the sender process

**Choice:** A module-level `Set`/array of tokens held in the sender process memory.

**Rationale:** Zero infrastructure; sufficient for a single-user POC. Token registration is idempotent (re-registering the same token is a no-op).

**Alternatives considered:**
- SQLite/PostgreSQL — adds a migration and a dependency; not needed for a demo. Documented as a "next step".

### D4: Background delivery — `firebase-messaging-sw.js` in `public/`

**Choice:** A service worker at the web root that calls `onBackgroundMessage` and shows an OS notification via the `showNotification` API.

**Rationale:** FCM requires the service worker to be served from the root scope to receive background messages for the origin. Vite's `public/` directory copies files verbatim to the build root, satisfying this.

**Alternatives considered:**
- Workbox-generated SW — more machinery than needed; the Firebase SW is ~10 lines.

### D5: Permission UX — request on explicit button click

**Choice:** Notification permission is requested only after the user clicks "Enable notifications", not on page load.

**Rationale:** Browsers throttle/block permission prompts triggered without user gesture; requesting on click keeps the demo reliable and models good practice.

### D6: Sender auth — shared dev secret in header

**Choice:** `POST /send` requires an `X-Dev-Secret` header matching `DEV_SECRET` env var.

**Rationale:** Prevents accidental open relay while keeping auth trivial for a POC. Clearly marked as non-production.

**Alternatives considered:**
- No auth — too easy to misuse if deployed.
- Full OAuth/JWT — out of scope for a POC.

## Risks / Trade-offs

- [FCM requires a real Firebase project] → README documents the console steps; no mock mode. Mitigation: a CLI script (`send.js`) lets the user test sending to an arbitrary token without the web client.
- [Service worker only works in secure context] → Dev runs on `localhost` (secure by default); production needs HTTPS. Documented in README.
- [Tokens can be invalidated by Firebase] → Sender logs send errors and removes invalid tokens; full retry/backoff is a non-goal.
- [In-memory token store lost on restart] → Acceptable for POC; SQLite migration documented as next step.
- [Browser notification permission can be permanently denied] → README includes a "reset permissions" note; the UI shows current permission state.

## Migration Plan

Not applicable — greenfield project, no existing deployment. Rollback = delete the change's directories.

## Open Questions

- Should the POC also demonstrate topic subscription/broadcast? (Recommended: yes, as a stretch goal behind a flag, since it adds ~1 endpoint and 1 button.)
- Should the sender also support data-only (silent) messages? (Recommended: defer; notification messages cover the visible UX.)
- Confirm the user's Firebase project region / whether they want a sample `.firebaserc` for hosting. (Default: no hosting; local dev only.)