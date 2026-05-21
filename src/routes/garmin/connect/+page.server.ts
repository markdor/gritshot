import { fail, redirect, type Actions, type ServerLoad } from '@sveltejs/kit';
import { requireUser } from '$lib/server/authGuards';
import { disconnect, hasGarminConnection, loginAndStore } from '$lib/server/garmin/client';
import { GarminAuthError, GarminNetworkError } from '$lib/server/garmin/errors';
import { logger } from '$lib/server/logger';
import { m } from '$lib/paraglide/messages';

export const load: ServerLoad = ({ locals }) => {
	const user = requireUser(locals);
	return { connected: hasGarminConnection(user.id) };
};

export const actions: Actions = {
	// TODO: rate-limit garmin connect attempts per user/IP (out of scope).
	connect: async ({ request, locals }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!email) return fail(422, { email, error: m.garmin_error_email_required() });
		if (!password) return fail(422, { email, error: m.garmin_error_password_required() });

		try {
			await loginAndStore(user.id, email, password);
		} catch (err) {
			if (err instanceof GarminAuthError) {
				return fail(401, { email, error: m.garmin_error_auth_login() });
			}
			if (err instanceof GarminNetworkError) {
				logger.warn({ err, userId: user.id }, 'garmin login network failure');
				return fail(502, { email, error: m.garmin_error_network() });
			}
			logger.error({ err, userId: user.id }, 'unexpected error during garmin login');
			return fail(500, { email, error: m.garmin_error_network() });
		}

		throw redirect(303, '/garmin/create');
	},

	disconnect: async ({ locals }) => {
		const user = requireUser(locals);
		disconnect(user.id);
		logger.info({ userId: user.id }, 'garmin connection removed');
		return { disconnected: true };
	}
};
