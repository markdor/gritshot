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
