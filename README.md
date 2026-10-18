# FCM Web Push POC

Minimal end-to-end Firebase Cloud Messaging web push loop:

```
web/ (Vite + Firebase JS SDK)          server/ (FastAPI + firebase-admin)
  getToken() ── /register-token ──────►  in-memory token Set
  send cards ── /send ──►  admin messaging.send() ──► FCM ──► browser
```

Foreground message → page `onMessage` toast. Background message → `firebase-messaging-sw.js` `onBackgroundMessage` → OS notification.

## Prerequisites

- Node.js 22+ for the web client (uses `--env-file-if-exists`)
- Python 3.12+ and [uv](https://docs.astral.sh/uv/) for the sender
- A Firebase project with **Cloud Messaging enabled**, one **Web app**, and a **Web Push certificate (VAPID) key pair**

## Firebase console setup

1. [console.firebase.google.com](https://console.firebase.google.com) → create/select project.
2. Grow → **Cloud Messaging** → Enable (accept default location).
3. Project settings → **Your apps** → add a **Web app** → copy the config object values.
4. Project settings → **Service accounts** → **Generate new key** → save the JSON as `server/serviceAccount.json`.
5. Project settings → **Cloud Messaging** → **Web configuration** → **Generate key pair** → copy the **Web Push certificate key pair** *key* (not the pair).

## Run

```bash
cp .env.example .env                 # fill VITE_FIREBASE_*, VITE_VAPID_KEY
# serviceAccount.json goes in server/ (gitignored)
cd server && uv sync && uv run python -m src.main   # reads ../.env (run from server/)

cd web && npm install && npm run dev      # http://localhost:5173 (reads ../.env via envDir)
```

Also copy the six `VITE_FIREBASE_*` values into `web/public/firebase-messaging-sw.js` — Vite copies `public/` verbatim, so the service worker cannot read `.env`. (Firebase's documented approach for the messaging SW.)

Service workers need a secure context; `localhost` qualifies. Anywhere else needs HTTPS.

## Manual test checklist

1. **Foreground toast** — open the page in one focused tab, use the **Testing token** card → in-app toast appears (no OS notification).
2. **Background notification** — minimize/close the tab, trigger a send (second tab, or curl below) → OS notification appears.
3. **Invalid token removed** — register, then restart `server` and send to an old token copy → 404 `token invalid, removed from store`.
4. **Broadcast to all**:
   ```bash
   curl -i -X POST localhost:3000/send -H 'content-type: application/json' \
     -d '{"title":"a","body":"b"}'   # broadcast to all registered tokens
   ```
5. **(Stretch) Topic** — use the **Testing topic** card (set the topic, e.g. `news`) → message arrives.

Permission permanently denied? Address bar → site info icon → Site settings → Notifications → Allow, then reload.

## Automated checks

```bash
cd server && uv run pytest        # unit tests: all three targeting modes, validation, pruning, 502s — no Firebase needed
```

Unit tests use a stub messaging backend with failure injection (`server/tests/conftest.py`), so they run without credentials. Markers: `unit` (default) and `integration`.

### Live-FCM integration tests (gated)

Skipped unless `FCM_INTEGRATION=1`. Requires `server/serviceAccount.json` (real Firebase project, Cloud Messaging enabled) and `FCM_TEST_TOKEN` — a registration token copied from the web client after clicking *Enable notifications*:

```bash
cd server
FCM_INTEGRATION=1 FCM_TEST_TOKEN="<registration token>" uv run pytest -m integration
```

Scenarios: real token send, topic send, broadcast, and dead-token pruning against live FCM.

### Browser E2E (Playwright)

Covers enable → register → token/topic/broadcast sends → foreground toast, plus a background-notification smoke check (permission state + root-scope service worker). Prerequisites: sender on `:3000`, dev server on `:5173`, root `.env` with `VITE_FIREBASE_*`/`VITE_VAPID_KEY`, and matching values pasted into `web/public/firebase-messaging-sw.js`.

```bash
cd web
npm install && npx playwright install chromium   # first time only
npm run test:e2e
```

Notes: the Push API is blocked in incognito, so the spec uses a persistent profile and the real Chrome channel (`channel: 'chrome'`). Override with `E2E_CHANNEL` / `E2E_BASE_URL` / `E2E_PROFILE_DIR` if your setup differs.

### Manual test runner

Fire one send from the CLI against a running sender (exit 0 on 2xx):

```bash
cd server
uv run python scripts/send_test.py --mode token --token <reg-token>
uv run python scripts/send_test.py --mode topic --topic news
uv run python scripts/send_test.py --mode broadcast
```

### In-app test cards

The page renders three always-visible cards — **Testing token**, **Testing topic**, and **Testing broadcast** — each with its own title/body inputs, an action button, and an inline result area. The topic card also has an editable topic (default `poc-test`) and subscribes the registered token before sending. They hit the sender directly and are handy for QA and demos.

## Run with Docker

```bash
cp .env.example .env                 # fill VITE_FIREBASE_*, VITE_VAPID_KEY
# add server/serviceAccount.json and configure web/public/firebase-messaging-sw.js
docker compose up
```

Open http://localhost:5173. The web container proxies `/send` etc. to the server container. Hot reload works via bind mounts; if file changes aren't picked up, ensure `DOCKER=1` is set (it is in compose) so Vite uses polling. Use `http://localhost:5173` (not a LAN IP) so the browser keeps a secure context for the service worker.

## Non-goals / next steps

In-memory store dies on restart — swap for SQLite if needed. No retry/backoff, rate limiting, or auth (POC only; sender is an open relay — do not expose publicly).
