# Docker Compose Dev Environment

## Purpose

Reproducible containerized local development of the FCM POC — service definitions, ports, volume strategy, environment wiring, and documented prerequisites.

## Requirements

### Requirement: Docker Compose defines the server and web services

The project SHALL provide a root `docker-compose.yml` that defines a `server` service and a `web` service, each built from the official `node:22-alpine` image.

#### Scenario: Both services are defined
- **WHEN** a user runs `docker compose config`
- **THEN** the configuration contains services named `server` and `web`, both using image `node:22-alpine`

### Requirement: Services expose the expected ports

The `server` service SHALL publish port 3000 and the `web` service SHALL publish port 5173 to the host.

#### Scenario: Ports are mapped
- **WHEN** the stack is running
- **THEN** the sender is reachable at `http://localhost:3000` and the web client at `http://localhost:5173`

### Requirement: Source, env, and secrets are mounted from the host

The compose file SHALL bind-mount `./server` and `./web` into their containers, mount each service's `.env` file, and mount `./server/serviceAccount.json` read-only into the server container.

#### Scenario: Hot reload and secret injection
- **WHEN** a source file or `.env` value changes on the host
- **THEN** the running container observes the change without an image rebuild
- **AND** the server container can read the service account at `/app/serviceAccount.json`

### Requirement: Web container proxies to the server container

The `web` service SHALL set `SENDER_URL=http://server:3000` so Vite's dev proxy forwards API requests to the server container by service name.

#### Scenario: Send request reaches the sender
- **WHEN** the browser (via the web container) posts to `/send`
- **THEN** the request is proxied to the `server` service and returns the sender's response

### Requirement: Anonymous volumes protect container node_modules

The compose file SHALL use named anonymous volumes for `node_modules` in both services so host and container dependency trees do not clobber each other.

#### Scenario: Platform-independent installs
- **WHEN** `docker compose up` runs on a host whose `node_modules` is absent or for a different platform
- **THEN** each container installs and uses its own `node_modules` volume without error

### Requirement: Documentation describes the Docker workflow

The README SHALL include a "Run with Docker" section documenting prerequisites (`.env` files, `serviceAccount.json`, configured service worker) and the `docker compose up` command.

#### Scenario: Documented prerequisites
- **WHEN** a new user follows the README's Docker section
- **THEN** they can bring up the stack without consulting other sources
