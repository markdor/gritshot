import { describe, test, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Page from './+page.svelte';

describe('Garmin connect page', () => {
	test('shows the login form when not connected', async () => {
		render(Page, { data: { user: null, connected: false }, form: null });

		await expect.element(page.getByLabelText('Garmin email')).toBeVisible();
		await expect.element(page.getByLabelText('Garmin password')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Connect Garmin' })).toBeVisible();
		await expect.element(page.getByText(/Your credentials are never stored/)).toBeVisible();
	});

	test('renders the form error when connect action fails', async () => {
		render(Page, {
			data: { user: null, connected: false },
			form: { email: 'a@b.c', error: 'Garmin rejected those credentials.' }
		});

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Garmin rejected those credentials.');
	});

	test('preserves the previously-entered email after a failed submit', async () => {
		const { container } = render(Page, {
			data: { user: null, connected: false },
			form: { email: 'me@example.com', error: 'whatever' }
		});

		const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
		expect(emailInput.value).toBe('me@example.com');
	});

	test('shows the connected status and disconnect form when connected', async () => {
		render(Page, { data: { user: null, connected: true }, form: null });

		await expect.element(page.getByText('Your Garmin account is connected.')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Disconnect Garmin' })).toBeVisible();
		await expect.element(page.getByRole('link', { name: 'Pick a recent activity' })).toBeVisible();
	});

	test('hides the login form when connected', async () => {
		const { container } = render(Page, {
			data: { user: null, connected: true },
			form: null
		});
		expect(container.querySelector('input[name="email"]')).toBeNull();
		expect(container.querySelector('input[name="password"]')).toBeNull();
	});
});
