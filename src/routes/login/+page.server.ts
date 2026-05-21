import { fail, redirect, type Actions, type ServerLoad } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { checkAndIncrement } from '$lib/server/rateLimit';
import { logger } from '$lib/server/logger';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Our own codes plus the ones Better Auth's magic-link plugin emits when it
// overwrites our errorCallbackURL on a failed verification (INVALID_TOKEN /
// EXPIRED_TOKEN). All of them render the same generic message — keeping them
// indistinguishable avoids leaking why verification failed.
const KNOWN_ERRORS = new Set([
	'expired',
	'invalid',
	'used',
	'INVALID_TOKEN',
	'EXPIRED_TOKEN'
]);

export const load: ServerLoad = ({ locals, url }) => {
	if (locals.user) throw redirect(303, '/');
	const errorParam = url.searchParams.get('error');
	const error = errorParam && KNOWN_ERRORS.has(errorParam) ? errorParam : null;
	return { error };
};

export const actions: Actions = {
	default: async ({ request, getClientAddress }) => {
		const form = await request.formData();
		const rawEmail = String(form.get('email') ?? '').trim();
		const email = rawEmail.toLowerCase();

		if (!email || !EMAIL_RE.test(email) || email.length > 254) {
			return fail(400, { email: rawEmail, invalidEmail: true });
		}

		const ip = getClientAddress();
		const ipLimit = checkAndIncrement(`magic-link:ip:${ip}`, 15 * 60, 5);
		const emailLimit = checkAndIncrement(`magic-link:email:${email}`, 60 * 60, 3);

		if (ipLimit.allowed && emailLimit.allowed) {
			// Whitelist check: only send magic links to users that exist in the DB.
			// Better Auth's `disableSignUp: true` only blocks creating the user on
			// verification — it would still send mail to unknown addresses, which the
			// spec rules out. We do an indexed SELECT by email (~1ms either branch).
			const exists = db
				.select({ id: userTable.id })
				.from(userTable)
				.where(eq(userTable.email, email))
				.get();

			if (exists) {
				// Fire-and-forget: never await DB work or SMTP. The response time is
				// the same on hit and miss, so a remote observer cannot enumerate
				// the whitelist by timing.
				auth.api
					.signInMagicLink({
						body: {
							email,
							callbackURL: '/',
							errorCallbackURL: '/login?error=invalid'
						},
						headers: request.headers
					})
					.catch((err) => {
						if (err instanceof APIError) {
							logger.debug(
								{ status: err.status, email },
								'magic link request rejected by auth layer'
							);
						} else {
							logger.warn({ err, email }, 'unexpected error during magic link request');
						}
					});
			} else {
				logger.debug({ email }, 'magic link request for non-whitelisted email (ignored)');
			}
		} else {
			logger.info(
				{ ip, email, ipBlocked: !ipLimit.allowed, emailBlocked: !emailLimit.allowed },
				'magic link request rate-limited'
			);
		}

		// Identical response regardless of branch above.
		return { sent: true };
	}
};
