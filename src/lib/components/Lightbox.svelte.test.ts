import { describe, test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
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
		await expect.element(page.getByAltText('Your GritShot')).toBeVisible();
	});

	test('closes when X button is clicked', () => {
		const { container } = render(Lightbox, { image: FAKE_IMAGE });
		const closeButton = container.querySelector('button[aria-label]') as HTMLElement;
		closeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		flushSync();
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

	test('download button triggers download with correct filename and data', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 4, 7));

		const { container } = render(Lightbox, { image: FAKE_IMAGE, title: 'Morning Run' });

		const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

		const downloadButton = container.querySelector('button:not([aria-label])') as HTMLElement;
		downloadButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

		expect(clickSpy).toHaveBeenCalledOnce();
		const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;
		expect(anchor.download).toBe('GritShot-20260507-Morning Run.jpg');
		expect(anchor.href).toBe(`data:image/jpeg;base64,${FAKE_IMAGE}`);

		clickSpy.mockRestore();
		vi.useRealTimers();
	});

	test('download filename strips filesystem-unsafe characters from title', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 0, 3));

		const { container } = render(Lightbox, { image: FAKE_IMAGE, title: 'Trail/Run: 5k?' });

		const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

		const downloadButton = container.querySelector('button:not([aria-label])') as HTMLElement;
		downloadButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

		const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;
		expect(anchor.download).toBe('GritShot-20260103-TrailRun 5k.jpg');

		clickSpy.mockRestore();
		vi.useRealTimers();
	});
});
