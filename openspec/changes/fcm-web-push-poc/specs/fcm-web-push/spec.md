## ADDED Requirements

### Requirement: Client obtains an FCM registration token

The web client SHALL request notification permission only after an explicit user action, then obtain an FCM registration token using the configured VAPID key, and display the token to the user.

#### Scenario: Permission granted and token obtained
- **WHEN** the user clicks "Enable notifications" and grants permission
- **THEN** the client calls `getToken()` with the VAPID key and displays the resulting token string

#### Scenario: Permission denied
- **WHEN** the user denies notification permission
- **THEN** the client shows a message explaining notifications are disabled and does not attempt token registration

### Requirement: Client registers its token with the sender

The web client SHALL send its FCM registration token to the sender's `/register-token` endpoint, and the sender SHALL store the token idempotently.

#### Scenario: New token registration
- **WHEN** the client POSTs `{ token }` to `/register-token`
- **THEN** the sender adds the token to its in-memory store and responds 200 with `{ ok: true }`

#### Scenario: Duplicate token registration
- **WHEN** the client registers a token already present in the store
- **THEN** the sender does not create a duplicate and responds 200 with `{ ok: true }`

### Requirement: Sender sends a notification to a registered token

The sender SHALL expose `POST /send` that accepts `{ token, title, body }` (or `{ topic, title, body }`) and delivers an FCM notification message via the Admin SDK, returning the FCM message id on success.

#### Scenario: Send to a valid token
- **WHEN** an authenticated request provides a valid registered token, title, and body
- **THEN** the sender calls `admin.messaging().send()` and responds 200 with `{ messageId }`

#### Scenario: Send to an invalid token
- **WHEN** the target token is invalid or unregistered
- **THEN** the sender responds with an error status and removes the token from the store

#### Scenario: Missing dev secret
- **WHEN** a request to `/send` omits or mismatches the `X-Dev-Secret` header
- **THEN** the sender responds 401 and does not send any message

### Requirement: Client displays foreground messages

The web client SHALL handle messages received while the page is in the foreground and display them as an in-app toast/notification without triggering an OS notification.

#### Scenario: Foreground message received
- **WHEN** an FCM message arrives while the tab is focused
- **THEN** the client's `onMessage` handler renders the title and body in the page UI

### Requirement: Client displays background messages

The web client SHALL register a service worker that handles messages received while the page is not in the foreground and displays an OS notification.

#### Scenario: Background message received
- **WHEN** an FCM message arrives while the tab is backgrounded or closed
- **THEN** the service worker's `onBackgroundMessage` handler calls `showNotification` with the message title and body

### Requirement: Sender supports topic broadcast (stretch)

The sender SHALL allow subscribing a registered token to a named topic and sending a notification to that topic.

#### Scenario: Subscribe and broadcast
- **WHEN** a token is subscribed to topic `news` and a send targets `topic: "news"`
- **THEN** FCM delivers the notification to all tokens subscribed to `news`