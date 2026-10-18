# FCM Testing

## Purpose

Layered, repeatable validation of the web push loop's three targeting modes (single token, topic, broadcast): deterministic pytest unit tests without Firebase credentials, gated live-FCM integration tests, committed browser E2E via Playwright, a manual CLI test runner, and a dev-gated in-app test panel.

## Requirements

### Requirement: Deterministic unit tests cover all three targeting modes

The project SHALL provide pytest unit tests that exercise single-token, topic, and broadcast sends without Firebase credentials, using a stub messaging implementation.

#### Scenario: Single-token send succeeds
- **WHEN** a valid registered token, title, and body are posted to `/send`
- **THEN** the response is 200 with a `messageId` and the stub records the message with `token` set

#### Scenario: Single-token send prunes invalid token
- **WHEN** an invalid/unregistered token is posted to `/send`
- **THEN** the response is an error status and the token is removed from the store

#### Scenario: Topic send succeeds
- **WHEN** a topic, title, and body are posted to `/send`
- **THEN** the response is 200 with a `messageId` and the stub records the message with `topic` set

#### Scenario: Broadcast sends to all tokens
- **WHEN** title and body are posted to `/send` with no token and no topic
- **THEN** the response is 200 with `{ sent, failed }` reflecting all registered tokens

#### Scenario: Broadcast prunes dead tokens
- **WHEN** broadcast encounters an invalid token
- **THEN** that token is removed from the store and counted as failed

#### Scenario: Broadcast on empty store
- **WHEN** broadcast is invoked with no registered tokens
- **THEN** the response is 200 with `{ sent: 0, failed: 0 }`

### Requirement: Validation and error paths are tested

The project SHALL provide unit tests for request validation and error handling across all endpoints.

#### Scenario: Missing token on register-token
- **WHEN** `/register-token` is posted without a token
- **THEN** the response is 400

#### Scenario: Missing title or body on send
- **WHEN** `/send` is posted without title or body
- **THEN** the response is 400

#### Scenario: Missing token or topic on subscribe
- **WHEN** `/subscribe` is posted without token or topic
- **THEN** the response is 400

#### Scenario: Generic send failure returns 502
- **WHEN** the messaging backend raises a non-pruning exception
- **THEN** the response is 502 and the token remains in the store

### Requirement: Stub messaging supports failure injection

The test fixture SHALL allow injecting `InvalidArgumentError` and generic exceptions so pruning and 502 paths can be exercised deterministically.

#### Scenario: Inject invalid-argument error
- **WHEN** a stub is configured to raise `InvalidArgumentError` for a token
- **THEN** the send prunes that token and returns an error status

#### Scenario: Inject generic error
- **WHEN** a stub is configured to raise a generic exception
- **THEN** the send returns 502 and does not prune the token

### Requirement: Gated integration tests exercise real FCM

The project SHALL provide integration tests, enabled only when `FCM_INTEGRATION=1` is set (and a service account + VAPID key are available), that send real notifications for token, topic, and broadcast modes and verify dead-token pruning.

#### Scenario: Integration tests skipped by default
- **WHEN** `FCM_INTEGRATION` is unset
- **THEN** integration tests are skipped and `uv run pytest` passes without credentials

#### Scenario: Real token send succeeds
- **WHEN** an integration test posts a real registered token
- **THEN** FCM returns a message id

#### Scenario: Real broadcast prunes expired token
- **WHEN** broadcast includes an expired/invalid token
- **THEN** the token is removed from the store

### Requirement: Browser E2E covers foreground delivery

The project SHALL include a committed Playwright spec that automates granting notification permission, enabling notifications, registering a token, sending a message, and asserting the foreground toast appears.

#### Scenario: Foreground toast appears
- **WHEN** a message is sent while the tab is focused
- **THEN** the in-app toast renders the title and body

#### Scenario: Background notification smoke check
- **WHEN** a message is sent while the tab is backgrounded
- **THEN** the service worker calls showNotification (verified via console or notification permission state)

### Requirement: Manual test runner for ad-hoc sends

The project SHALL provide a CLI helper to fire token, topic, or broadcast sends against a running server using a provided token and title/body.

#### Scenario: Run token mode
- **WHEN** the helper is invoked with `--mode token --token <t>`
- **THEN** it POSTs to `/send` with that token and prints the response

#### Scenario: Run topic mode
- **WHEN** the helper is invoked with `--mode topic --topic <t>`
- **THEN** it POSTs to `/send` with that topic and prints the response

#### Scenario: Run broadcast mode
- **WHEN** the helper is invoked with `--mode broadcast`
- **THEN** it POSTs to `/send` with only title/body and prints `{ sent, failed }`

### Requirement: Web in-app test panel (dev-gated)

The web client SHALL provide a dev-gated test panel (visible only when `import.meta.env.DEV` is true) with buttons to run token, topic, and broadcast tests using the currently registered token, and a result log.

#### Scenario: Panel hidden in production
- **WHEN** the app is built for production
- **THEN** the test panel is not rendered

#### Scenario: Token test runs
- **WHEN** the user clicks "Test token"
- **THEN** the client sends to the registered token and appends the status + response to the log

#### Scenario: Topic test runs
- **WHEN** the user clicks "Test topic"
- **THEN** the client subscribes the token to a test topic, sends to that topic, and appends the result

#### Scenario: Broadcast test runs
- **WHEN** the user clicks "Test broadcast"
- **THEN** the client sends with only title/body and appends `{ sent, failed }`

### Requirement: Web E2E covers all three targeting modes

The project SHALL include a committed Playwright spec under `web/tests/e2e/` that automates notification permission grant, service worker registration, token registration, and sends in token, topic, and broadcast modes, asserting a 2xx result and a foreground toast for the token case.

#### Scenario: E2E token flow passes
- **WHEN** the E2E runs the token flow
- **THEN** registration succeeds and the foreground toast renders the sent title/body

#### Scenario: E2E topic flow passes
- **WHEN** the E2E runs the topic flow (subscribe then send)
- **THEN** the send returns 2xx

#### Scenario: E2E broadcast flow passes
- **WHEN** the E2E runs the broadcast flow
- **THEN** the send returns 200 with `{ sent, failed }`
