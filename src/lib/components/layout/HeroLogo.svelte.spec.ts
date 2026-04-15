import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import HeroLogo from './HeroLogo.svelte';

describe('HeroLogo.svelte', () => {
	it('renders the logo image', async () => {
		render(HeroLogo);

		await expect.element(page.getByRole('img', { name: 'GritShot' })).toBeInTheDocument();
	});
});
