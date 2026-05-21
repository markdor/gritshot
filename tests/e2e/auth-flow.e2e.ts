import { test, expect } from '@playwright/test';
import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';

const ADMIN_EMAIL = 'admin@e2e.test';
const DB_PATH = './e2e.db';

// The local Playwright config seeds ./e2e.db on the host so the test can read
// magic-link tokens out of the verification table directly. When running
// against the Docker container (or any deployed system), the DB lives on a
// named volume inside the container and is unreachable from the test process
// — we can't grab the token there, so we skip the magic-link tests entirely.
const hasLocalDb = existsSync(DB_PATH);

/**
 * In the magic-link verification table, identifier is the stored token (plain
 * text in our config — we don't enable storeToken=hashed), and value is JSON
 * holding the email. We construct the verify URL the same way Better Auth
 * does in its sendMagicLink callback.
 */
function buildVerifyUrl(token: string, baseURL: string): string {
	const url = new URL('/api/auth/magic-link/verify', baseURL);
	url.searchParams.set('token', token);
	url.searchParams.set('callbackURL', '/');
	url.searchParams.set('errorCallbackURL', '/login?error=invalid');
	return url.toString();
}

function readLatestTokenFor(email: string): string | null {
	const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
	try {
		const row = db
			.prepare(
				`SELECT identifier, value FROM verification
				 WHERE value LIKE ?
				 ORDER BY created_at DESC, expires_at DESC
				 LIMIT 1`
			)
			.get(`%${email}%`) as { identifier: string; value: string } | undefined;
		if (!row) return null;
		// Sanity-check the value really is a magic-link entry for this email.
		try {
			const parsed = JSON.parse(row.value);
			if (parsed?.email !== email) return null;
		} catch {
			return null;
		}
		return row.identifier;
	} finally {
		db.close();
	}
}

test.describe('Magic-link sign-in flow', () => {
	test.skip(
		!hasLocalDb,
		'no host-side access to the magic-link DB — running against a remote server or container'
	);

	test('admin signs in via magic link, visits /admin, then logs out', async ({
		page,
		baseURL
	}) => {
		expect(baseURL).toBeTruthy();

		await page.goto('/');
		await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();

		await page.getByRole('link', { name: 'Login' }).click();
		await expect(page).toHaveURL(/\/login$/);

		await page.getByLabel('Email address').fill(ADMIN_EMAIL);
		await page.getByRole('button', { name: 'Send sign-in link' }).click();

		await expect(page.getByRole('status')).toContainText(
			/sign-in link has been sent/i
		);

		// Token lands in the DB asynchronously (fire-and-forget). Poll briefly.
		let token: string | null = null;
		for (let i = 0; i < 30 && !token; i++) {
			token = readLatestTokenFor(ADMIN_EMAIL);
			if (!token) await new Promise((r) => setTimeout(r, 100));
		}
		expect(token, 'magic-link token should appear in the verification table').toBeTruthy();

		await page.goto(buildVerifyUrl(token!, baseURL!));
		await expect(page).toHaveURL(new URL('/', baseURL!).toString());

		// Header switched from Login button to a user dropdown.
		await expect(page.getByRole('link', { name: 'Login' })).toHaveCount(0);
		const userButton = page.getByRole('button', { name: /admin/i, exact: false });
		await expect(userButton).toBeVisible();

		// Open the dropdown and navigate to the admin page.
		await userButton.click();
		await page.getByRole('menuitem', { name: 'Admin' }).click();
		await expect(page).toHaveURL(/\/admin$/);
		await expect(page.getByRole('cell', { name: ADMIN_EMAIL })).toBeVisible();

		// Bootstrapped admin cannot delete themselves.
		const deleteButton = page
			.getByRole('row', { name: new RegExp(ADMIN_EMAIL, 'i') })
			.getByRole('button', { name: 'Delete' });
		await expect(deleteButton).toBeDisabled();

		// Log out.
		await userButton.click();
		await page.getByRole('menuitem', { name: 'Logout' }).click();
		await expect(page).toHaveURL(new URL('/', baseURL!).toString());
		await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
	});

	test('non-whitelisted email gets the same response and no token is created', async ({
		page
	}) => {
		const stranger = 'stranger-not-in-db@e2e.test';

		await page.goto('/login');
		await page.getByLabel('Email address').fill(stranger);
		await page.getByRole('button', { name: 'Send sign-in link' }).click();
		await expect(page.getByRole('status')).toContainText(
			/sign-in link has been sent/i
		);

		// Wait briefly to give a hypothetical async insert time to land, then
		// confirm nothing showed up.
		await new Promise((r) => setTimeout(r, 500));
		const token = readLatestTokenFor(stranger);
		expect(token, 'no token should be created for a non-whitelisted email').toBeNull();
	});

});

// Lives outside the describe above because it doesn't need DB access — it
// just visits an obviously bogus verify URL. Useful smoke test against a
// real deployment too.
test('expired or invalid token redirects to /login with an error', async ({ page, baseURL }) => {
	await page.goto(buildVerifyUrl('definitely-not-a-real-token', baseURL!));
	await expect(page).toHaveURL(/\/login/);
	await expect(page.getByRole('alert')).toContainText(/invalid or has expired/i);
});
