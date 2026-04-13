import { describe, test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';

vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

import Page from './+page.svelte';

describe('Homepage', () => {
	test('"Create Your Card" hero link points to /create', async () => {
		render(Page);
		const links = page.getByRole('link', { name: 'Create Your Card' });
		await expect.element(links.first()).toHaveAttribute('href', '/create');
	});

	test('"Create Your Card" CTA link points to /create', async () => {
		render(Page);
		const links = page.getByRole('link', { name: 'Create Your Card' });
		await expect.element(links.last()).toHaveAttribute('href', '/create');
	});
});
