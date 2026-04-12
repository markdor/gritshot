import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MountainSilhouette from './MountainSilhouette.svelte';

describe('MountainSilhouette.svelte', () => {
	it('renders the logo image', async () => {
		render(MountainSilhouette);

		await expect.element(page.getByRole('img', { name: 'GritShot' })).toBeInTheDocument();
	});
});
