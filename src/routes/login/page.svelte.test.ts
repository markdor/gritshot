import { describe, test, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Page from './+page.svelte';

describe('Login page', () => {
	test('renders heading, subtitle and the empty email form by default', async () => {
		render(Page, { data: { error: null }, form: null });

		await expect.element(page.getByRole('heading', { name: 'Sign in to GritShot' })).toBeVisible();
		await expect.element(page.getByLabelText('Email address')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Send sign-in link' })).toBeVisible();
	});

	test('shows the invalid-link alert when data.error is set', async () => {
		render(Page, { data: { error: 'invalid' }, form: null });
		await expect.element(page.getByRole('alert')).toHaveTextContent(/invalid or has expired/i);
	});

	test('renders the success message and hides the form after submit', async () => {
		const { container } = render(Page, { data: { error: null }, form: { sent: true } });

		await expect.element(page.getByRole('status')).toHaveTextContent(/sign-in link has been sent/i);
		// Form (and the heading above it) collapse on the sent state.
		expect(container.querySelector('form')).toBeNull();
		expect(page.getByRole('heading', { name: 'Sign in to GritShot' }).elements()).toHaveLength(0);
	});

	test('preserves the entered email after an invalid-email submit', async () => {
		const { container } = render(Page, {
			data: { error: null },
			form: { email: 'not-an-email', invalidEmail: true }
		});

		const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
		expect(emailInput.value).toBe('not-an-email');
		await expect.element(page.getByText(/Please enter a valid email/)).toBeVisible();
	});
});
