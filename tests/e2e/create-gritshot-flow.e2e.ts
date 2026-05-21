import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

test.use({ locale: 'en-US' });

test.describe('Create GritShot flow', () => {
	test('full flow: language switch, form submission, lightbox download', async ({
		page,
		context
	}) => {
		// Ensure the cookie strategy doesn't already pin the locale to DE.
		await context.clearCookies();

		await page.goto('/');

		// Homepage renders in English (preferredLanguage strategy honors Accept-Language).
		await expect(page.getByRole('heading', { name: /Your adventure,/ })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Create Your GritShot' }).first()).toBeVisible();

		// Switch to German via the language toggle in the navigation.
		await page.getByRole('button', { name: 'DE', exact: true }).click();

		// Homepage now renders in German.
		await expect(page.getByRole('heading', { name: /Dein Abenteuer,/ })).toBeVisible();
		const createLink = page.getByRole('link', { name: 'GritShot erstellen' }).first();
		await expect(createLink).toBeVisible();

		// Navigate to the create page.
		await createLink.click();
		await expect(page).toHaveURL(/\/create$/);
		await expect(page.getByRole('heading', { name: 'GritShot erstellen' })).toBeVisible();

		// Fill the form: title, FIT file, photo.
		await page.locator('input[name="title"]').fill('Graveln im Aurachtal');

		const fitInput = page.locator('input[name="fitFile"]');
		await fitInput.setInputFiles(path.resolve(here, '../fixtures/fit/gravel-aurachtal.fit'));

		const photoInput = page.locator('input[name="photoFile"]');
		await photoInput.setInputFiles(path.resolve(here, '../fixtures/photos/valid.jpg'));

		// Capture the local date now — the download filename uses the browser's local date.
		const now = new Date();
		const dateStr =
			`${now.getFullYear()}` +
			`${String(now.getMonth() + 1).padStart(2, '0')}` +
			`${String(now.getDate()).padStart(2, '0')}`;

		// Submit the form.
		const submitButton = page.getByRole('button', { name: 'GritShot generieren' });
		await expect(submitButton).toBeEnabled();
		await submitButton.click();

		// Waiting donut overlay should appear (role=status with the German label).
		await expect(page.getByRole('status', { name: 'Dein GritShot wird generiert…' })).toBeVisible();

		// Lightbox dialog opens with the generated image.
		const dialog = page.getByRole('dialog', { name: 'Vorschau deines GritShots' });
		await expect(dialog).toBeVisible({ timeout: 30_000 });
		await expect(dialog.getByRole('img', { name: 'Dein GritShot' })).toBeVisible();

		// Click download — expect a JPEG with filename "GritShot-<date>-Graveln im Aurachtal.jpg".
		const downloadPromise = page.waitForEvent('download');
		await dialog.getByRole('button', { name: 'GritShot herunterladen' }).click();
		const download = await downloadPromise;
		expect(download.suggestedFilename()).toBe(`GritShot-${dateStr}-Graveln im Aurachtal.jpg`);
	});
});
