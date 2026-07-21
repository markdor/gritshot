import { describe, test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';

vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

import Page from './+page.svelte';

describe('Homepage', () => {
	test('"Create Your GritShot" hero link points to the given createHref', async () => {
		render(Page, { data: { user: null, createHref: '/create' } });
		const link = page.getByRole('link', { name: 'Create Your GritShot' });
		await expect.element(link).toHaveAttribute('href', '/create');
	});

	test('hero link points to /garmin/create when the server resolved that target', async () => {
		render(Page, { data: { user: null, createHref: '/garmin/create' } });
		const link = page.getByRole('link', { name: 'Create Your GritShot' });
		await expect.element(link).toHaveAttribute('href', '/garmin/create');
	});
});
