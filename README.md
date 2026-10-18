# FCM Web Push POC

Minimal end-to-end Firebase Cloud Messaging web push loop:

```
web/ (Vite + Firebase JS SDK)          server/ (FastAPI + firebase-admin)
  getToken() ── /register-token ──────►  in-memory token Set
  send form ── /send (X-Dev-Secret) ──►  admin messaging.send() ──► FCM ──► browser
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
cp .env.example .env                 # fill DEV_SECRET, VITE_FIREBASE_*, VITE_VAPID_KEY, VITE_DEV_SECRET (= DEV_SECRET)
# serviceAccount.json goes in server/ (gitignored)
cd server && uv sync && uv run python -m src.main   # reads ../.env (run from server/)

cd web && npm install && npm run dev      # http://localhost:5173 (reads ../.env via envDir)
```

Also copy the six `VITE_FIREBASE_*` values into `web/public/firebase-messaging-sw.js` — Vite copies `public/` verbatim, so the service worker cannot read `.env`. (Firebase's documented approach for the messaging SW.)

Service workers need a secure context; `localhost` qualifies. Anywhere else needs HTTPS.

## Manual test checklist

1. **Foreground toast** — open the page in one focused tab, fill the send form, click Send → in-app toast appears (no OS notification).
2. **Background notification** — minimize/close the tab, trigger a send (second tab, or curl below) → OS notification appears.
3. **Invalid token removed** — register, then restart `server` and send to an old token copy → 404 `token invalid, removed from store`.
4. **Missing dev secret → 401**:
   ```bash
   curl -i -X POST localhost:3000/send -H 'content-type: application/json' \
     -d '{"token":"x","title":"a","body":"b"}'          # 401
   curl -i -X POST localhost:3000/send -H 'content-type: application/json' \
     -H "X-Dev-Secret: $DEV_SECRET" -d '{"title":"a","body":"b"}'   # broadcast to all
   ```
5. **(Stretch) Topic** — click *Subscribe token to topic* with `news`, then send with only the topic field → message arrives.

Permission permanently denied? Address bar → site info icon → Site settings → Notifications → Allow, then reload.

## Automated checks

```bash
cd server && uv run pytest   # sender logic (registration, 401, invalid-token removal, broadcast) — no Firebase needed
```

## Run with Docker

```bash
cp .env.example .env                 # fill DEV_SECRET, VITE_FIREBASE_*, VITE_VAPID_KEY, VITE_DEV_SECRET
# add server/serviceAccount.json and configure web/public/firebase-messaging-sw.js
docker compose up
```

Open http://localhost:5173. The web container proxies `/send` etc. to the server container. Hot reload works via bind mounts; if file changes aren't picked up, ensure `DOCKER=1` is set (it is in compose) so Vite uses polling. Use `http://localhost:5173` (not a LAN IP) so the browser keeps a secure context for the service worker.

## Non-goals / next steps

In-memory store dies on restart — swap for SQLite if needed. No retry/backoff, rate limiting, or real auth (`X-Dev-Secret` is a shared string, POC only; `VITE_DEV_SECRET` ships in the client bundle).
