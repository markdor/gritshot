import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('hero logo is visible', async ({ page }) => {
		// The large hero logo (h-56 w-56) — distinct from nav (h-9) and footer (h-7) logos
		const heroLogo = page.locator('img[alt="GritShot"][class*="h-56"]');
		await expect(heroLogo).toBeVisible();
	});

	test('"Create Your Card" nav button shows coming soon toast', async ({ page }) => {
		await page.getByRole('button', { name: 'Create Your Card' }).first().click();
		await expect(page.getByText('Coming soon — stay tuned!')).toBeVisible();
	});

	test('"Create Your Card" hero button shows coming soon toast', async ({ page }) => {
		await page.getByRole('button', { name: 'Create Your Card' }).nth(1).click();
		await expect(page.getByText('Coming soon — stay tuned!')).toBeVisible();
	});

	test('"Create Your Card" CTA button shows coming soon toast', async ({ page }) => {
		await page.getByRole('button', { name: 'Create Your Card' }).last().click();
		await expect(page.getByText('Coming soon — stay tuned!')).toBeVisible();
	});

	test('"See How It Works" scrolls to the section', async ({ page }) => {
		await page.getByRole('link', { name: 'See How It Works' }).click();
		await expect(page.locator('#how-it-works')).toBeInViewport();
	});
});
