import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Navigation from './Navigation.svelte';

describe('Navigation.svelte', () => {
	it('renders the correct brand name', async () => {
		render(Navigation);

		await expect
			.element(page.getByRole('link', { name: 'GritShot', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: 'Create Your GritShot' }))
			.toBeInTheDocument();
	});
});
