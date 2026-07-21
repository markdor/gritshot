import { describe, test, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import UserSlot from './UserSlot.svelte';

const user = { id: 'u1', username: 'alice', isAdmin: false };
const admin = { id: 'a1', username: 'admin', isAdmin: true };

describe('UserSlot.svelte', () => {
	test('renders only a Login link when no user is signed in', async () => {
		render(UserSlot, { user: null });

		const login = page.getByRole('link', { name: 'Login' });
		await expect.element(login).toBeVisible();
		await expect.element(login).toHaveAttribute('href', '/login');

		// No dropdown trigger.
		expect(page.getByRole('button').elements()).toHaveLength(0);
	});

	test('shows the username and a closed dropdown trigger when signed in', async () => {
		render(UserSlot, { user });

		const trigger = page.getByRole('button', { name: /alice/ });
		await expect.element(trigger).toBeVisible();
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		// Menu items are not rendered until the dropdown opens.
		expect(page.getByRole('menuitem').elements()).toHaveLength(0);
	});

	test('opens the menu on trigger click and shows the expected items for a non-admin', async () => {
		render(UserSlot, { user });

		await userEvent.click(page.getByRole('button', { name: /alice/ }));

		await expect
			.element(page.getByRole('button', { name: /alice/ }))
			.toHaveAttribute('aria-expanded', 'true');

		const garminLink = page.getByRole('menuitem', { name: 'Garmin activity' });
		await expect.element(garminLink).toBeVisible();
		await expect.element(garminLink).toHaveAttribute('href', '/garmin/create');

		await expect.element(page.getByRole('menuitem', { name: 'Logout' })).toBeVisible();
		// Admin link only renders for admins.
		expect(page.getByRole('menuitem', { name: 'Admin' }).elements()).toHaveLength(0);
	});

	test('shows the Admin link only for admin users', async () => {
		render(UserSlot, { user: admin });
		await userEvent.click(page.getByRole('button', { name: /admin/i }));

		const adminLink = page.getByRole('menuitem', { name: 'Admin' });
		await expect.element(adminLink).toBeVisible();
		await expect.element(adminLink).toHaveAttribute('href', '/admin');
	});

	test('closes the menu when Escape is pressed', async () => {
		render(UserSlot, { user });
		await userEvent.click(page.getByRole('button', { name: /alice/ }));
		await expect.element(page.getByRole('menuitem', { name: 'Logout' })).toBeVisible();

		await userEvent.keyboard('{Escape}');
		expect(page.getByRole('menuitem').elements()).toHaveLength(0);
	});

	test('closes the menu when a menuitem link is clicked', async () => {
		render(UserSlot, { user });
		await userEvent.click(page.getByRole('button', { name: /alice/ }));

		await userEvent.click(page.getByRole('menuitem', { name: 'Garmin activity' }));
		// After the link onclick handler fires, the menu collapses.
		expect(page.getByRole('menuitem').elements()).toHaveLength(0);
	});

	test('closes the menu when clicking outside the container', async () => {
		render(UserSlot, { user });
		await userEvent.click(page.getByRole('button', { name: /alice/ }));
		await expect.element(page.getByRole('menuitem', { name: 'Logout' })).toBeVisible();

		// Click somewhere outside the component (the document body).
		await userEvent.click(document.body);
		expect(page.getByRole('menuitem').elements()).toHaveLength(0);
	});

	test('renders a real logout form POSTing to /logout', async () => {
		const { container } = render(UserSlot, { user });
		await userEvent.click(page.getByRole('button', { name: /alice/ }));

		const form = container.querySelector('form[action="/logout"][method="POST"]');
		expect(form).not.toBeNull();
		expect(form!.querySelector('button[type="submit"]')).not.toBeNull();
	});
});
