# GritShot

**GritShot** turns your Garmin activities into stunning, shareable photo cards with embedded statistics. Upload a FIT file from Garmin Connect, add a trail photo, and generate a card showing distance, elevation, pace, heart rate, and more — ready to share on Instagram, WhatsApp, or anywhere else.

Your files are processed on the server but never stored. No accounts, no tracking.

**Live at:** [gritshot.example.com](https://gritshot.example.com)

**Container image:** [ghcr.io/markdor/gritshot](https://github.com/markdor/gritshot/pkgs/container/gritshot)

## Getting Started

### Prerequisites

- Node.js >= 24
- npm

### Install and run

```sh
cp .env.local.example .env.local
npm install
npx playwright install --with-deps
npm run dev
```

The app is now available at `http://localhost:5173`.

[`.env.local`](./.env.local.example) is picked up automatically by Vite during `npm run dev` and overrides values from `.env`. It is not required for the dev server to start — SvelteKit's CSRF check uses the Vite host directly in dev — but server code that reads `BASE_URL` (e.g. for absolute URLs) will see the right value with it in place.

### Run tests

```sh
# Unit tests
npm run test:unit

# End-to-end tests (requires Playwright browsers installed above)
npm run test:e2e

# End-to-end tests against the Docker container instead of the Vite preview
npm run docker:test

# All tests
npm test
```

`docker:test` uses [`playwright.docker.config.ts`](./playwright.docker.config.ts) and points Playwright at `http://127.0.0.1:3000` (the URL from [`.env.example`](./.env.example)). It always rebuilds and recreates the container (`docker compose up --build --force-recreate`) — make sure nothing else is occupying port 3000 before running it.

### Build for production

```sh
npm run build
npm run preview
```

## Docker Deployment

A prebuilt image is published at `ghcr.io/markdor/gritshot:latest`. The container needs to know the public URL it's reached at — SvelteKit's CSRF protection rejects POSTs whose `Origin` header doesn't match the configured origin.

### Environment variables

| Variable          | Required | Default    | Description                                                           |
| ----------------- | -------- | ---------- | --------------------------------------------------------------------- |
| `BASE_URL`        | yes      | —          | Public URL the app is reached at, e.g. `https://gritshot.example.com` |
| `PORT`            | no       | `3000`     | Port the server listens on                                            |
| `BODY_SIZE_LIMIT` | no       | `21000000` | Max request body size in bytes (default 20 MB + multipart overhead)   |

### Local

```sh
cp .env.example .env
docker compose up --build
```

[`compose.yaml`](./compose.yaml) reads its environment from `.env` via `env_file:` — [`.env.example`](./.env.example) ships a working default (`BASE_URL=http://127.0.0.1:3000`). Adjust `.env` if you need a different host or port; it is gitignored so local tweaks stay out of version control.

### Production (behind a reverse proxy)

Set `BASE_URL` to the public URL the proxy serves the app under. Example with Docker Compose and Traefik:

```yaml
services:
  gritshot:
    image: ghcr.io/markdor/gritshot:latest
    env_file: .env
    labels:
      - traefik.enable=true
      - traefik.http.routers.gritshot.rule=Host(`gritshot.example.com`)
      - traefik.http.routers.gritshot.tls.certresolver=letsencrypt
```
