# mvc-structure Specification

## Purpose
TBD - created by archiving change mvc-rewrite. Update Purpose after archive.
## Requirements
### Requirement: Sender follows layered MVC structure

The sender SHALL separate HTTP adaptation (controllers + routes), business logic (service), persistence access (repository + model), cross-cutting auth (middleware), response shaping (views), and wiring (composition root), with dependencies flowing one way: routes → controllers → service → repository → model.

#### Scenario: Composition root preserves the factory contract
- **WHEN** any consumer imports `createApp` from `server/src/app.js` with `{ messaging, tokens, devSecret }`
- **THEN** it receives an Express app exposing `POST /register-token`, `POST /subscribe`, `POST /send`, and `GET /tokens` with unchanged behavior, and the passed-in `tokens` Set remains the live store

#### Scenario: One-way layer dependencies
- **WHEN** the sender source is inspected
- **THEN** controllers never import the token store directly, the service never touches `req`/`res`, the repository is the only module that reads/writes the store, and response shapes are constructed only in `views/responses.js`

#### Scenario: Admin SDK init lives in infrastructure
- **WHEN** the app boots via `server/src/index.js`
- **THEN** Firebase Admin is initialized from `infrastructure/firebase.js` (with `fcm.js` retained as a re-export), and `app.js` never imports Admin SDK modules directly

### Requirement: Web client follows layered MVC structure

The web client SHALL separate user-flow orchestration (controllers), state and server communication (models), DOM rendering (view), configuration (config), and service-worker setup (services), with `main.js` acting only as bootstrap wiring.

#### Scenario: Bootstrap-only entry
- **WHEN** the page loads
- **THEN** `main.js` initializes Firebase config, registers the service worker, subscribes the foreground `onMessage` handler to the view's toast renderer, and binds the three buttons to their controllers — containing no fetch calls or DOM construction itself

#### Scenario: All server communication flows through the API model
- **WHEN** any controller needs the sender (`/register-token`, `/subscribe`, `/send`)
- **THEN** it calls `models/apiClient.js`, which attaches `content-type: application/json` (plus `X-Dev-Secret` from `VITE_DEV_SECRET` for `/subscribe` and `/send`), and no controller constructs fetch headers inline

#### Scenario: All DOM access flows through the view
- **WHEN** any controller renders state (token, permission, scope, toast, send result)
- **THEN** it calls `views/domView.js` functions, and `index.html` element IDs (`enable`, `subscribe`, `send`, `token`, `topic`, `target`, `sendTopic`, `title`, `body`, `permission`, `scope`, `toast`, `sendResult`) are unchanged

### Requirement: Regression — externally observable behavior is unchanged

The rewrite SHALL preserve every contract pinned by `fcm-web-push`: route paths, HTTP status codes (200/400/401/404/502), response shapes (`{ok:true}`, `{messageId}`, `{sent,failed}`, `{count}`), idempotent registration, dev-secret gating (unset secret denies everything), permission-on-click flow, foreground-toast vs background-notification split, and topic stretch behavior.

#### Scenario: Existing sender tests pass unmodified
- **WHEN** `node --test` runs in `server/`
- **THEN** all 5 pre-existing tests pass with no modifications to `server/test/app.test.js`

#### Scenario: Web build stays clean
- **WHEN** `vite build` runs in `web/`
- **THEN** the build succeeds and `firebase-messaging-sw.js` remains served from the site root with its inline config intact

### Requirement: Broadcast send prunes dead tokens

The notification service SHALL apply the same invalid-token pruning rule to broadcast sends as the single-token path already applies: any token whose send rejects with `messaging/registration-token-not-registered` or `messaging/invalid-registration-token` is removed from the store.

#### Scenario: Broadcast removes dead tokens and reports counts
- **WHEN** a broadcast send covers one live token and one dead token (rejecting with `messaging/registration-token-not-registered`)
- **THEN** the response is `{ sent: 1, failed: 1 }` and the dead token is no longer in the store while the live token is untouched

