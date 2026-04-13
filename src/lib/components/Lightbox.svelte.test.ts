import { describe, test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { flushSync } from 'svelte';
import Lightbox from './Lightbox.svelte';

const FAKE_IMAGE = 'abc123base64data';

describe('Lightbox', () => {
	test('is not visible without image', () => {
		const { container } = render(Lightbox, { image: undefined });
		expect(container.querySelector('[role="dialog"]')).toBeNull();
	});

	test('opens when image is provided', async () => {
		render(Lightbox, { image: FAKE_IMAGE });
		await expect.element(page.getByRole('dialog')).toBeVisible();
		await expect.element(page.getByAltText('Your GritShot card')).toBeVisible();
	});

	test('closes when X button is clicked', async () => {
		const { container } = render(Lightbox, { image: FAKE_IMAGE });
		await userEvent.click(page.getByRole('button', { name: 'Close' }));
		expect(container.querySelector('[role="dialog"]')).toBeNull();
	});

	test('closes when backdrop is clicked', () => {
		const { container } = render(Lightbox, { image: FAKE_IMAGE });
		const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
		dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		flushSync();
		expect(container.querySelector('[role="dialog"]')).toBeNull();
	});

	test('closes on Escape key', () => {
		const { container } = render(Lightbox, { image: FAKE_IMAGE });
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		flushSync();
		expect(container.querySelector('[role="dialog"]')).toBeNull();
	});

	test('download button triggers download with correct filename and data', async () => {
		render(Lightbox, { image: FAKE_IMAGE });

		const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

		await userEvent.click(page.getByRole('button', { name: 'Download Card' }));

		expect(clickSpy).toHaveBeenCalledOnce();
		const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;
		expect(anchor.download).toBe('gritshot.jpg');
		expect(anchor.href).toBe(`data:image/jpeg;base64,${FAKE_IMAGE}`);

		clickSpy.mockRestore();
	});
});
