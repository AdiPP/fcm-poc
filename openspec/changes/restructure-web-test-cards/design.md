## Context

The web client (`web/`) is a Vite + Firebase JS SDK app organised MVC-style:

```
index.html            static markup (cards as <section>)
src/main.js           composition root; wires DOM events to controllers
src/views/domView.js  element refs + render helpers (showToast, appendTestLog, ...)
src/controllers/      notification, subscription, send, testPanel
src/models/           apiClient (fetch wrappers), tokenModel, permissionModel
src/config/firebase.js
src/services/swRegistration.js
```

Today the UI has an "Enable notifications" card, a general "Send a message" form, and a dev-gated "Test panel" (`hidden` unless `import.meta.env.DEV`) with three buttons writing to one shared log. The `fcm-testing` spec formalises the panel as dev-gated.

## Goals / Non-Goals

**Goals:**
- One self-contained card per targeting mode (token, topic, broadcast), each with its own title/body inputs, button, and result area.
- Cards always visible (dev and production builds).
- Minimal controller surface; no server/API changes.
- Keep E2E coverage of all three modes with stable button test ids.

**Non-Goals:**
- Redesigning card 1 (permission/register/subscribe).
- Adding new endpoints, auth, or persistence.
- Vitest unit tests for the web layer (still deferred).

## Decisions

**1. Per-mode cards replace the general send form.**
The general form's only unique capability was sending to an arbitrary token/topic typed by hand. The token card uses the registered token and the topic card uses an editable topic, so the general form is redundant. Removing it also removes the `sendController` and its `target`/`sendTopic` inputs.
*Alternative:* keep the general form and add cards — rejected as duplicated UI and ambiguous ordering.

**2. Always visible, not dev-gated.**
The POC exists to demonstrate the three modes; hiding the controls in production builds defeats that. The `hidden` attribute and `import.meta.env.DEV` branch are removed. This is a spec change (see `fcm-testing` delta).
*Alternative:* keep the dev gate — rejected per user decision.

**3. One controller factory parameterised by mode.**
Replace `testPanelController.js` with a single `createSendCardController(mode)` that reads that card's inputs, builds the payload for the mode, and writes to that card's result element. A topic card performs the subscribe call first. This avoids three near-identical files.
*Alternative:* three separate controller files — more duplication for no benefit.

**4. Per-card result areas, no shared log.**
`appendTestLog` (shared `<pre>`) is replaced by a `setCardResult(card, text)` helper in `domView`. Results stay next to the action that produced them.
*Alternative:* keep one shared log — rejected; harder to read with three concurrent cards.

**5. Stable test ids.**
Buttons keep `data-testid="test-token" | "test-topic" | "test-broadcast"`; each card adds `*-title`, `*-body`, `*-result`. The E2E drops the `#testPanel` visibility assertion and asserts per-card results.

## Risks / Trade-offs

- **[E2E selectors drift]** → Keep button test ids unchanged; only the result selector changes from `test-log` to `*-result`.
- **[Topic card auto-subscribe may fail silently]** → Render the subscribe result in the same card before the send result, so failures are visible.
- **[Removing the general send form breaks muscle memory / docs]** → Update README and AGENTS wording in the same change.
- **[Always-visible controls in a shared demo]** → Acceptable for a POC; the sender is already an open relay and not for public exposure.

## Migration Plan

Single web-only change; no data migration. Rollback is reverting the web commit(s). Existing E2E runs against the dev server and needs no environment changes.

## Open Questions

- None blocking. (Topic field made editable, default `poc-test`; card 1's manual subscribe retained.)
