import { defineConfig } from '@playwright/test';

export default defineConfig({
	globalSetup: './playwright.global-setup.ts',
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		env: {
			BASE_URL: 'http://localhost:4173',
			AUTH_SECRET: 'e2e-test-secret-please-do-not-deploy-anywhere',
			DB_PATH: './e2e.db',
			ADMIN_EMAIL: 'admin@e2e.test',
			ADMIN_USERNAME: 'admin',
			// Deterministic 32-byte test key. SvelteKit's build-time analyse step
			// eager-loads server modules, including garmin/crypto.ts, so this
			// must be set even when no E2E test touches a /garmin route.
			GARMIN_TOKEN_KEY: 'QkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkI='
		}
	},
	testMatch: '**/*.e2e.{ts,js}'
});
