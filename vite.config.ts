import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { readFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

const { version } = JSON.parse(readFileSync('package.json', 'utf-8'));

// Vitest tears down the SSR module runner before SvelteKit's dev middleware
// finishes draining late requests from the headless browser (favicons, source
// maps, etc.). Vite then logs a noisy "transport was disconnected" stack trace
// AFTER all tests have already passed. Exit code is 0; this is purely cosmetic.
// The Vite SSR runner uses its own internal logger that customLogger can't
// reach, so we filter at the stderr boundary — only when running under Vitest
// and only for this exact, harmless pattern. Real errors are not touched.
if (process.env.VITEST) {
	const originalWrite = process.stderr.write.bind(process.stderr);
	let suppressing = false;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	process.stderr.write = ((chunk: any, ...rest: any[]) => {
		const text = typeof chunk === 'string' ? chunk : chunk?.toString?.() ?? '';
		if (text.includes('transport was disconnected, cannot call "fetchModule"')) {
			// Swallow this line AND the stack-trace block that immediately follows.
			suppressing = true;
			return true;
		}
		// Continuation lines of the same trace start with whitespace; the next
		// non-indented line ends the block.
		if (suppressing) {
			if (/^\s/.test(text) || text.trim() === '') return true;
			suppressing = false;
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (originalWrite as any)(chunk, ...rest);
	}) as typeof process.stderr.write;
}

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
			outdir: './src/lib/paraglide',
			strategy: ['cookie', 'preferredLanguage', 'baseLocale']
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
						provider: playwright({ contextOptions: { locale: 'en-US' } }),
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
