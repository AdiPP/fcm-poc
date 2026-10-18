## 1. Markup

- [x] 1.1 Replace the "2. Send a message" card and the dev-gated "3. Test panel" in `web/index.html` with three always-visible cards: "2. Testing token", "3. Testing topic", "4. Testing broadcast".
- [x] 1.2 Give each card its own title/body inputs, an action button, and a result area with `data-testid` (`token-title`/`token-body`/`test-token`/`token-result`, and the topic/broadcast equivalents). Topic card also gets an editable topic input defaulting to `poc-test`.
- [x] 1.3 Remove the `hidden` attribute from the test-card markup.

## 2. View

- [x] 2.1 Update `web/src/views/domView.js` refs to the per-card title/body/button/result elements; drop `target`, `sendTopic`, `send`, `sendResult`, `testPanel`, `testLog`.
- [x] 2.2 Replace `showSendResult`/`appendTestLog` with a per-card `setCardResult(card, text)` helper.

## 3. Controllers

- [x] 3.1 Add `createSendCardController(mode)` in `web/src/controllers/` handling token, topic (subscribe then send), and broadcast payloads; write results via `setCardResult` and guard missing registered token.
- [x] 3.2 Remove `web/src/controllers/testPanelController.js` and `web/src/controllers/sendController.js`.
- [x] 3.3 Wire the three cards in `web/src/main.js` and remove the `import.meta.env.DEV` gate.

## 4. Tests

- [x] 4.1 Update `web/tests/e2e/push.spec.js`: drop the `#testPanel` visibility assertion and point token/topic/broadcast assertions at the new per-card result elements.
- [x] 4.2 Run `cd web && npm run build` and `npx playwright test --list` to confirm the build and spec parse.

## 5. Docs

- [x] 5.1 Update the README "In-app test panel (dev only)" section to describe the three always-visible test cards.
- [x] 5.2 Update `AGENTS.md` UI/testing wording if it references the dev-gated panel.
