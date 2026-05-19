import { defineConfig } from '@playwright/test';

// Runs the same e2e suite against the production-like container from
// compose.yaml instead of the Vite preview server. Keep the URL in sync
// with BASE_URL in .env / .env.example.
const baseURL = 'http://127.0.0.1:3000';

export default defineConfig({
	webServer: {
		command: 'docker compose up --build --force-recreate',
		url: baseURL,
		reuseExistingServer: false,
		timeout: 180_000
	},
	use: { baseURL },
	testMatch: '**/*.e2e.{ts,js}'
});
