import { describe, test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';

// The admin page reads `page.data.user?.id` from $app/state to detect "self"
// rows. Provide a minimal stub so the component renders in isolation.
vi.mock('$app/state', () => ({
	page: { data: { user: { id: 'self-id' } } }
}));

// invalidateAll is invoked from the delete-form callback; stub to a no-op.
vi.mock('$app/navigation', () => ({
	invalidateAll: vi.fn().mockResolvedValue(undefined)
}));

import Page from './+page.svelte';

const users = [
	{
		id: 'self-id',
		email: 'me@example.com',
		username: 'me',
		isAdmin: true,
		createdAt: new Date('2026-01-01')
	},
	{
		id: 'other-id',
		email: 'them@example.com',
		username: 'them',
		isAdmin: false,
		createdAt: new Date('2026-02-01')
	}
];

describe('Admin page', () => {
	test('renders heading, subtitle, and user count', async () => {
		render(Page, { data: { users }, form: null });

		await expect.element(page.getByRole('heading', { name: 'User administration' })).toBeVisible();
		await expect.element(page.getByText('Registered users (2)')).toBeVisible();
	});

	test('lists each user with email, username and admin badge', async () => {
		render(Page, { data: { users }, form: null });

		await expect.element(page.getByText('me@example.com')).toBeVisible();
		await expect.element(page.getByText('them@example.com')).toBeVisible();
		// The admin user shows the Admin badge; the non-admin shows a "—".
		const adminBadges = page.getByText('Admin', { exact: true }).elements();
		expect(adminBadges.length).toBeGreaterThan(0);
	});

	test('disables the delete button for the current user', async () => {
		const { container } = render(Page, { data: { users }, form: null });

		const deleteForms = container.querySelectorAll('form[action="?/delete"]');
		expect(deleteForms).toHaveLength(2);

		const selfDeleteBtn = deleteForms[0].querySelector(
			'button[type="submit"]'
		) as HTMLButtonElement;
		const otherDeleteBtn = deleteForms[1].querySelector(
			'button[type="submit"]'
		) as HTMLButtonElement;
		expect(selfDeleteBtn.disabled).toBe(true);
		expect(otherDeleteBtn.disabled).toBe(false);
	});

	test('shows the self-delete alert when the delete action returns that error', async () => {
		render(Page, {
			data: { users },
			form: { action: 'delete', error: 'self_delete' }
		});

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent(/can't delete your own account/i);
	});

	test('shows the self-demote-blocked warning after an update', async () => {
		render(Page, {
			data: { users },
			form: { action: 'update', selfDemoteBlocked: true }
		});

		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent(/admin flag can't be removed/i);
	});

	test('renders field errors next to the create form inputs', async () => {
		render(Page, {
			data: { users },
			form: {
				action: 'create',
				email: 'bad',
				username: 'me',
				fieldErrors: { email: 'invalid', username: 'taken' }
			}
		});

		await expect.element(page.getByText('Invalid value.')).toBeVisible();
		await expect.element(page.getByText('Already in use.')).toBeVisible();
	});

	test('clicking Edit swaps the row into an inline edit form', async () => {
		const { container } = render(Page, { data: { users }, form: null });

		// "Edit" appears twice — pick the second (non-self) row's button so the
		// admin checkbox isn't disabled by isSelf.
		const editButtons = page.getByRole('button', { name: 'Edit' }).elements();
		expect(editButtons).toHaveLength(2);
		await userEvent.click(editButtons[1]);

		// The update form for the chosen row now exists.
		const updateForm = container.querySelector('form[action="?/update"]') as HTMLFormElement;
		expect(updateForm).not.toBeNull();
		const hiddenId = updateForm.querySelector('input[name="id"]') as HTMLInputElement;
		expect(hiddenId.value).toBe('other-id');

		// Cancel collapses the form back to read-only.
		await userEvent.click(page.getByRole('button', { name: 'Cancel' }));
		expect(container.querySelector('form[action="?/update"]')).toBeNull();
	});

	test('renders the create-user form', async () => {
		const { container } = render(Page, { data: { users }, form: null });

		const createForm = container.querySelector('form[action="?/create"]') as HTMLFormElement;
		expect(createForm).not.toBeNull();
		expect(createForm.querySelector('input[name="email"]')).not.toBeNull();
		expect(createForm.querySelector('input[name="username"]')).not.toBeNull();
		expect(createForm.querySelector('input[name="isAdmin"][type="checkbox"]')).not.toBeNull();
	});
});
