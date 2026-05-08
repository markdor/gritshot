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
npm install
npx playwright install --with-deps
npm run dev
```

The app is now available at `http://localhost:5173`.

### Run tests

```sh
# Unit tests
npm run test:unit

# End-to-end tests (requires Playwright browsers installed above)
npm run test:e2e

# All tests
npm test
```

### Build for production

```sh
npm run build
npm run preview
```

## Docker Deployment

A prebuilt image is published at `ghcr.io/markdor/gritshot:latest`. The container needs to know the public URL it's reached at — SvelteKit's CSRF protection rejects POSTs whose `Origin` header doesn't match the configured origin.

### Environment variables

| Variable          | Required | Default      | Description                                                                  |
| ----------------- | -------- | ------------ | ---------------------------------------------------------------------------- |
| `ORIGIN`          | yes      | —            | Public URL the app is reached at, e.g. `https://gritshot.example.com`        |
| `PORT`            | no       | `3000`       | Port the server listens on                                                   |
| `BODY_SIZE_LIMIT` | no       | `21000000`   | Max request body size in bytes (default 20 MB + multipart overhead)          |

### Local

```sh
docker compose up --build
```

This uses [`compose.yaml`](./compose.yaml), which sets `ORIGIN=http://localhost:3000`.

### Production (behind a reverse proxy)

Set `ORIGIN` to the public URL the proxy serves the app under. Example with Docker Compose and Traefik:

```yaml
services:
  gritshot:
    image: ghcr.io/markdor/gritshot:latest
    environment:
      ORIGIN: https://gritshot.example.com
    labels:
      - traefik.enable=true
      - traefik.http.routers.gritshot.rule=Host(`gritshot.example.com`)
      - traefik.http.routers.gritshot.tls.certresolver=letsencrypt
```
