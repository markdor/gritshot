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
			ADMIN_USERNAME: 'admin'
		}
	},
	testMatch: '**/*.e2e.{ts,js}'
});
