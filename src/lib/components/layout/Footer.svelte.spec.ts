import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Footer from './Footer.svelte';

describe('Footer.svelte', () => {
	it('renders the logo image', async () => {
		render(Footer);

		await expect.element(page.getByRole('img', { name: 'GritShot' })).toBeInTheDocument();
	});

	it('renders a version link whose text matches the release href', async () => {
		render(Footer);

		const versionLink = page.getByRole('link', { name: /^v\d+\.\d+\.\d+$/ });
		await expect.element(versionLink).toBeInTheDocument();

		const version = versionLink.element().textContent?.trim() ?? '';
		await expect
			.element(versionLink)
			.toHaveAttribute('href', `https://github.com/markdor/gritshot/releases/tag/${version}`);
	});

	it('renders the GitHub repository link', async () => {
		render(Footer);

		await expect
			.element(page.getByRole('link', { name: 'GitHub Repository' }))
			.toHaveAttribute('href', 'https://github.com/markdor/gritshot');
	});
});
