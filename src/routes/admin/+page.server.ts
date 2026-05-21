import { error, fail, type Actions, type ServerLoad } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { logger } from '$lib/server/logger';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{2,40}$/;

function requireAdmin(locals: App.Locals) {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (!('isAdmin' in locals.user) || !locals.user.isAdmin) {
		throw error(403, 'Forbidden');
	}
	return locals.user;
}

export const load: ServerLoad = ({ locals }) => {
	requireAdmin(locals);
	const users = db
		.select({
			id: user.id,
			email: user.email,
			username: user.username,
			isAdmin: user.isAdmin,
			createdAt: user.createdAt
		})
		.from(user)
		.orderBy(asc(user.createdAt))
		.all();
	return { users };
};

function validate(rawEmail: string, rawUsername: string) {
	const email = rawEmail.trim().toLowerCase();
	const username = rawUsername.trim();
	const fieldErrors: Record<string, string> = {};
	if (!email) fieldErrors.email = 'required';
	else if (!EMAIL_RE.test(email) || email.length > 254) fieldErrors.email = 'invalid';
	if (!username) fieldErrors.username = 'required';
	else if (!USERNAME_RE.test(username)) fieldErrors.username = 'invalid';
	return { email, username, fieldErrors };
}

export const actions: Actions = {
	create: async ({ request, locals }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const rawEmail = String(form.get('email') ?? '');
		const rawUsername = String(form.get('username') ?? '');
		const isAdmin = form.get('isAdmin') === 'on';

		const { email, username, fieldErrors } = validate(rawEmail, rawUsername);
		if (Object.keys(fieldErrors).length > 0) {
			return fail(400, { action: 'create', email: rawEmail, username: rawUsername, fieldErrors });
		}

		try {
			const now = new Date();
			db.insert(user)
				.values({
					id: randomUUID(),
					name: username,
					email,
					emailVerified: true,
					username,
					isAdmin,
					createdAt: now,
					updatedAt: now
				})
				.run();
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			if (message.includes('UNIQUE')) {
				return fail(409, {
					action: 'create',
					email: rawEmail,
					username: rawUsername,
					fieldErrors: {
						[message.includes('email') ? 'email' : 'username']: 'taken'
					}
				});
			}
			logger.error({ err }, 'admin create user failed');
			throw err;
		}

		return { action: 'create', created: true };
	},

	update: async ({ request, locals }) => {
		const current = requireAdmin(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const rawEmail = String(form.get('email') ?? '');
		const rawUsername = String(form.get('username') ?? '');
		const isAdmin = form.get('isAdmin') === 'on';

		if (!id) return fail(400, { action: 'update', error: 'missing_id' });

		const { email, username, fieldErrors } = validate(rawEmail, rawUsername);
		if (Object.keys(fieldErrors).length > 0) {
			return fail(400, {
				action: 'update',
				id,
				email: rawEmail,
				username: rawUsername,
				fieldErrors
			});
		}

		// Self-protection: an admin must not be able to demote themselves.
		const targetIsCurrent = id === current.id;
		const finalIsAdmin = targetIsCurrent ? true : isAdmin;

		try {
			const result = db
				.update(user)
				.set({ email, username, name: username, isAdmin: finalIsAdmin, updatedAt: new Date() })
				.where(eq(user.id, id))
				.run();
			if (result.changes === 0) {
				return fail(404, { action: 'update', error: 'not_found' });
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			if (message.includes('UNIQUE')) {
				return fail(409, {
					action: 'update',
					id,
					email: rawEmail,
					username: rawUsername,
					fieldErrors: {
						[message.includes('email') ? 'email' : 'username']: 'taken'
					}
				});
			}
			logger.error({ err }, 'admin update user failed');
			throw err;
		}

		return {
			action: 'update',
			updated: true,
			selfDemoteBlocked: targetIsCurrent && !isAdmin
		};
	},

	delete: async ({ request, locals }) => {
		const current = requireAdmin(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		if (!id) return fail(400, { action: 'delete', error: 'missing_id' });

		// Self-protection: an admin must not delete their own entry.
		if (id === current.id) {
			return fail(400, { action: 'delete', error: 'self_delete' });
		}

		// Cascade on session.userId removes all of the user's active sessions,
		// forcing logout on the next request.
		const result = db.delete(user).where(eq(user.id, id)).run();
		if (result.changes === 0) {
			return fail(404, { action: 'delete', error: 'not_found' });
		}

		return { action: 'delete', deleted: true };
	}
};
