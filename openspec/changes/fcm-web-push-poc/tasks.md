## 1. Project Setup

- [ ] 1.1 Create root `.gitignore` (node_modules, dist, .env, serviceAccount.json)
- [ ] 1.2 Create root `.env.example` documenting Firebase config, VAPID key, DEV_SECRET, PORT
- [ ] 1.3 Create `README.md` with Firebase console setup steps and manual test checklist

## 2. Sender Service (Node + Express + firebase-admin)

- [ ] 2.1 Scaffold `server/` (package.json, src/index.js, src/fcm.js, .env.example)
- [ ] 2.2 Initialize Firebase Admin from `serviceAccount.json` (path from env)
- [ ] 2.3 Implement in-memory token store with idempotent registration
- [ ] 2.4 Implement `POST /register-token` endpoint
- [ ] 2.5 Implement `POST /send` endpoint with `X-Dev-Secret` auth, supporting token and topic targets
- [ ] 2.6 Implement invalid-token handling (remove token, return error)
- [ ] 2.7 Implement topic subscribe endpoint `POST /subscribe` (stretch)
- [ ] 2.8 Add `npm run dev` and `npm start` scripts

## 3. Web Client (Vite + vanilla JS)

- [ ] 3.1 Scaffold `web/` (package.json, vite.config.js, index.html, src/main.js)
- [ ] 3.2 Add Firebase JS SDK config from env (VITE_FIREBASE_*)
- [ ] 3.3 Implement permission request on button click + token display
- [ ] 3.4 Register token with sender (`/register-token`)
- [ ] 3.5 Implement `onMessage` foreground toast display
- [ ] 3.6 Add send form that calls `POST /send` via the sender

## 4. Service Worker (background delivery)

- [ ] 4.1 Create `web/public/firebase-messaging-sw.js` with `onBackgroundMessage` + `showNotification`
- [ ] 4.2 Register the service worker in the client and verify scope is root

## 5. Verification

- [ ] 5.1 Manual test: foreground message displays in-app toast
- [ ] 5.2 Manual test: background message displays OS notification
- [ ] 5.3 Manual test: invalid token is removed from store
- [ ] 5.4 Manual test: missing dev secret returns 401
- [ ] 5.5 (Stretch) Manual test: topic broadcast reaches subscribed tokens