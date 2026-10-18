## RENAMED Requirements

- FROM: `### Requirement: Web in-app test panel (dev-gated)`
- TO: `### Requirement: Web per-mode test cards (always visible)`

## MODIFIED Requirements

### Requirement: Web per-mode test cards (always visible)

The web client SHALL render three always-visible test cards — token, topic, and broadcast — each with its own title and body inputs, an action button, and a result area. The token card SHALL send to the currently registered token. The topic card SHALL subscribe the registered token to a topic (default `poc-test`) and then send to that topic. The broadcast card SHALL send with no target. The cards SHALL render in both development and production builds.

#### Scenario: Cards visible in production
- **WHEN** the app is built for production
- **THEN** the token, topic, and broadcast test cards are rendered

#### Scenario: Token test runs
- **WHEN** the user submits the token card with a registered token
- **THEN** the client sends to that token and renders the status and response in the token card's result area

#### Scenario: Topic test runs
- **WHEN** the user submits the topic card with a registered token
- **THEN** the client subscribes the token to the topic, sends to that topic, and renders both results in the topic card's result area

#### Scenario: Broadcast test runs
- **WHEN** the user submits the broadcast card
- **THEN** the client sends with only title and body and renders `{ sent, failed }` in the broadcast card's result area

#### Scenario: Missing registered token
- **WHEN** the user submits the token or topic card without a registered token
- **THEN** the card renders a message directing the user to enable notifications first
