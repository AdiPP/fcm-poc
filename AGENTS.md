# FCM Web Push POC

Minimal end-to-end FCM web push loop: Vite web client (`web/`) + FastAPI sender (`server/`).

## Commands

- Server: `cd server && uv sync && uv run python -m src.main` (port 3000; reads root `.env` via `src/config/env.py`).
- Web: `cd web && npm install && npm run dev` (port 5173; reads root `.env` via `envDir`).
- Tests: `cd server && uv run pytest` (no Firebase needed). Single: `uv run pytest tests/test_app.py::test_send_broadcast`.
- Docker: `docker compose up` (first run ~2 min for uv/npm install). Fresh reset: `docker compose down -v && docker compose up -d`.
- Health checks: `curl http://localhost:3000/tokens` and `curl -X POST http://localhost:3000/send -H 'content-type: application/json' -d '{"title":"hi","body":"x"}'`.

## Architecture

- `server/src/app.py` `create_app(messaging, tokens)` is the composition root (no `dev_secret` — sender is open in POC mode).
- MVC: `controllers/` → `services/` → `repositories/` → `models/`; `routes.py` wires; `middleware/` removed.
- `NotificationService` prunes tokens on `UnregisteredError` / `InvalidArgumentError`.
- Token store is in-memory (`models/token_store.py`); lost on restart.
- `Message.token=` (registration token), not `fid` — `firebase-admin` 7.7 deprecation warning is expected and safe.

## Env

- Single root `.env` (gitignored). `server/.env.example` and `web/.env.example` are templates.
- `web/public/firebase-messaging-sw.js` cannot read `.env` (Vite copies `public/` verbatim) — paste the six `VITE_FIREBASE_*` values there manually.
- VAPID key (`VITE_VAPID_KEY`) must match the Firebase console's Web Push certificate key pair exactly.

## Gotchas

- `localhost` is a secure context (push works); any other host needs HTTPS.
- First Docker run installs dependencies inside containers; don't curl before "Uvicorn running"/"ready in" logs.
- Web Push token retrieval hangs if notification permission is not granted before `getToken` runs. In automated browser testing, grant permission first, then click "Enable notifications".
- Brave Shields can block the push endpoint; use Chrome for testing push, or disable Shields for `localhost:5173`.
- VAPID key mismatch is not always the cause of a hang — verify the key in the Firebase console (Project settings → Cloud Messaging → Web Push certificates) matches `.env` exactly. In this repo they match; the earlier hang was a permission-timing issue, resolved by granting permission before invoking enable.