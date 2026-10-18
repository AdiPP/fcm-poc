## Why

The web client currently splits testing across a general "Send a message" form (arbitrary target/topic) and a separate dev-gated "Test panel" with three bare buttons and a shared log. The three targeting modes — token, topic, broadcast — are the core of the POC, so each deserves a first-class, self-contained card with its own inputs and visible result. The dev gate also makes the panel invisible in production builds, which is unnecessary for a POC whose whole point is demonstrating the three modes.

## What Changes

- **BREAKING (UI)** Replace the "2. Send a message" card and the dev-gated "3. Test panel" with three always-visible cards:
  - **2. Testing token** — title/body inputs, sends to the currently registered token, renders the result inline.
  - **3. Testing topic** — topic field (default `poc-test`), title/body inputs, subscribes the registered token then sends to the topic, renders subscribe + send results inline.
  - **4. Testing broadcast** — title/body inputs, sends with no target (broadcast to all registered tokens), renders `{ sent, failed }` inline.
- Remove the `import.meta.env.DEV` gate and the `hidden` attribute; the test cards render in all builds.
- Replace the shared test log with a per-card result area.
- Retire the general send form/controller (its behaviour is covered by the three cards).
- Update the Playwright E2E to target the new per-card buttons/results and drop the "panel visible" assertion.
- Update README/AGENTS UI and testing descriptions.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `fcm-testing`: The "Web in-app test panel (dev-gated)" requirement becomes "Web per-mode test cards (always visible)"; the "Panel hidden in production" scenario is replaced by a "Cards visible in production" scenario and the token/topic/broadcast scenarios are reworded for per-card results.

## Impact

- `web/index.html` — card markup (cards 2/3/4 replace card 2 + test panel).
- `web/src/views/domView.js` — refs and per-card result setters replace the shared log.
- `web/src/main.js` — remove dev gate; wire three controllers.
- `web/src/controllers/` — `testPanelController.js` replaced by per-mode card controllers; `sendController.js` retired; `subscriptionController.js` unchanged.
- `web/tests/e2e/push.spec.js` — new selectors; drop panel-visibility assertion.
- `README.md`, `AGENTS.md` — UI/testing wording.
- No server, API, or dependency changes.
