## Why

The repository is an empty scaffold with no working code. We need a small, self-contained proof-of-concept that exercises Firebase Cloud Messaging end-to-end so the mechanics (token registration, sending, foreground and background delivery) can be learned and validated before being reused in larger systems. Doing this now, while scope is tiny, avoids coupling FCM learning to a production codebase.

## What Changes

- Add a Node.js sender service (`server/`) using the Firebase Admin SDK, exposing endpoints to register device tokens and send messages to a token, topic, or all registered tokens.
- Add a Vite web client (`web/`) using the Firebase JS SDK that requests notification permission, obtains an FCM registration token (VAPID), registers it with the sender, and handles both foreground (`onMessage`) and background (`onBackgroundMessage` via service worker) delivery.
- Add a service worker (`firebase-messaging-sw.js`) for background notification display.
- Add environment templates (`.env.example`) documenting required Firebase config, VAPID key, and service account path.
- Add a README with Firebase console setup steps and a manual test checklist.
- Gitignore secrets (`serviceAccount.json`, `.env`).

## Capabilities

### New Capabilities

- `fcm-web-push`: End-to-end web push round trip — token registration, sending a notification to a registered token/topic, foreground in-app display, and background OS notification display via service worker.

### Modified Capabilities

<!-- None: greenfield project, no existing specs. -->

## Impact

- New top-level directories `server/` and `web/` plus root-level config/docs.
- New runtime dependencies: Node.js 18+, `firebase-admin`, Express, Vite, Firebase JS SDK v10.
- Requires a Firebase project with Cloud Messaging enabled, a Web app, a VAPID key pair, and a service account JSON (user-provided; not committed).
- Requires a secure context (HTTPS or localhost) for service worker registration.