# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

GritShot turns a Garmin FIT file + a photo into a shareable statistics card (distance, elevation, pace, heart rate, ...). Files are processed in-memory and never persisted — there is no upload storage, only a SQLite DB for accounts/sessions and the encrypted Garmin OAuth tokens needed to fetch activities on the user's behalf.

## Commands

```sh
npm run dev              # dev server (http://localhost:5173)
npm run build && npm run preview   # production build

npm run check             # svelte-check (type checking)
npm run lint               # prettier --check + eslint
npm run format              # prettier --write

npm run test:unit          # vitest (client + server projects), regenerates fixtures first
npx vitest run path/to/file.test.ts     # single file
npx vitest run -t "test name"           # single test by name
npm run test:coverage       # vitest with coverage (v8, reports only — no enforced gate in CI)
npm run test:e2e            # playwright against the Vite preview build
npm run docker:test          # playwright against the built Docker container (rebuilds it first; frees port 3000)
npm test                    # fixtures + unit + e2e, full suite

npm run db:generate          # generate a Drizzle migration from schema.ts changes (commit the output, don't drizzle-kit push)
```

`.env.local` (copy from `.env.local.example`) is picked up by Vite in dev and is optional — needed only for code paths that read `BASE_URL`. For Docker, copy `.env.example` to `.env`; `BASE_URL` must match the origin the app is actually reached at or SvelteKit's CSRF check rejects POSTs.

## Testing architecture

Vitest is split into two projects (`vite.config.ts`):

- **`client`**: `src/**/*.svelte.{test,spec}.ts`, runs in a real headless Chromium via `@vitest/browser-playwright`, excludes `src/lib/server/**`.
- **`server`**: `src/**/*.{test,spec}.ts` (non-`.svelte.`), Node environment.

Tests live next to the code they cover (e.g. `src/routes/create/page.server.test.ts`), not in a separate mirror tree. `expect.requireAssertions` is enabled globally — a test with no assertion fails. Playwright e2e specs (`tests/e2e/*.e2e.ts`) cover full flows (auth, gritshot creation) sparingly, not per-component.

`tests/fixtures/` holds adversarial inputs used across the suite — corrupt/encrypted/path-traversal/zip-bomb archives, invalid photos, real `.fit` samples. Regenerate them via `npm run test:fixtures` (also runs automatically before `test:unit`/`test`). When touching zip or FIT parsing, prefer adding a fixture over a synthetic in-test buffer — the point is exercising the real parser against a real malformed file.

## Architecture

**Request flow:** `hooks.server.ts` runs three handlers in sequence: better-auth's SvelteKit handler → session lookup (populates `event.locals.user`/`session`) → Paraglide i18n middleware. Route guards read `locals.user`/`locals.session` directly; `src/lib/server/authGuards.ts` has `requireUser(locals)` for endpoints that must reject unauthenticated access (throws a SvelteKit 401).

**Auth:** better-auth with a magic-link plugin (no passwords), Drizzle SQLite adapter. `src/lib/server/db/schema.ts` defines `user`/`session`/`account`/`verification`/`rateLimit` (better-auth's own tables) plus this app's `garminConnection` (per-user OAuth1+OAuth2 tokens for Garmin Connect, encrypted — see `garmin/crypto.ts`, keyed by `GARMIN_TOKEN_KEY`). `isAdmin` is a custom user field; `db/bootstrap.ts` idempotently promotes an env-configured admin (`ADMIN_EMAIL`/`ADMIN_USERNAME`) on every container start so the admin can't lock themselves out. There is no bot/API-token auth model anywhere in this app — it's browser session auth throughout.

**Server modules (`src/lib/server/`):**

- `fit/` — parses and validates uploaded `.fit` activity files.
- `zip/` — validates/extracts Garmin export zips; this is the highest-value area for security regressions (path traversal, zip bombs, decompression-ratio bombs — see the fixture names in `tests/fixtures/zip/`).
- `jpg/` — validates uploaded photos.
- `card/generate.ts` — composes the FIT stats + photo into the final card image (`sharp`).
- `garmin/` — `client.ts` (Garmin Connect API calls), `download.ts`, `crypto.ts` (token encryption), `errors.ts`.
- `rateLimit.ts` — in-memory sliding-window limiter (`checkAndIncrement(key, windowSeconds, max)`), separate from better-auth's own DB-backed rate limiting on auth endpoints.

**Error handling pattern:** validation/processing code throws `FileValidationError(message, userMessage)` (`src/lib/server/FileValidationError.ts`) — `message` is for logs, `userMessage` is safe to show the user. Route actions catch with `catch (e: unknown)`, narrow via `instanceof FileValidationError`, log the internal message through `pino` (`src/lib/server/logger.ts`), and return `fail(422, { error: e.userMessage })` for expected failures or `fail(500, { error: ... })` for unexpected ones. Never return raw error messages/stack traces to the client.

**i18n:** Paraglide (`@inlang/paraglide-js`) with **English as the base locale**, German as the translated locale (`messages/en.json`, `messages/de.json` — both must be kept in sync when adding user-facing strings; compiled output in `src/lib/paraglide/` is generated, don't hand-edit it). User-facing text goes through `m.some_key()` from `$lib/paraglide/messages`, not inline strings. Code, comments, and commit messages are English regardless of UI locale.

**Single package, no monorepo** — there is no `packages/shared`; everything lives under `src/`, and server-only code stays under `src/lib/server/` (never imported from `+page.svelte` or client code — SvelteKit enforces this at build time for `$lib/server/*`).

## Conventions

- Tabs, single quotes, no trailing commas, 100 char width (Prettier; `prettier-plugin-tailwindcss` sorts class lists, `prettier-plugin-svelte` handles `.svelte`).
- Svelte 5 runes mode is forced project-wide via `vitePlugin.dynamicCompileOptions` in `svelte.config.js`.
- Conventional Commits (`feat:`, `fix:`, `build:`, `chore:`) — semantic-release drives versioning/releases off these on `main`.
- Branches are `feat/<slug>` (no issue-number prefix in existing history).
