import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { readFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

const { version } = JSON.parse(readFileSync('package.json', 'utf-8'));

const copyFontsPlugin: Plugin = {
	name: 'copy-fonts-to-static',
	buildStart() {
		const src = 'node_modules/@fontsource/barlow-condensed/files';
		const dest = 'static/fonts';
		mkdirSync(dest, { recursive: true });
		for (const file of [
			'barlow-condensed-latin-400-normal.woff2',
			'barlow-condensed-latin-400-italic.woff2',
			'barlow-condensed-latin-700-normal.woff2',
			'barlow-condensed-latin-700-italic.woff2'
		]) {
			copyFileSync(join(src, file), join(dest, file));
		}
	}
};

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		copyFontsPlugin,
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		})
	],
	define: {
		__APP_VERSION__: JSON.stringify(version)
	},
	test: {
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov', 'html', 'json', 'json-summary'],
			include: ['src/**/*.{ts,svelte}'],
			exclude: [
				'src/**/*.test.ts',
				'src/**/*.spec.ts',
				'src/**/*.e2e.ts',
				'src/routes/+layout.svelte'
			]
		},
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
