import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { db } from './db';
import { logger } from './logger';
import { sendMagicLinkMail } from './mailer';

const baseURL = env.BASE_URL ?? 'http://localhost:5173';

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	secret: env.AUTH_SECRET ?? 'dev-secret-do-not-use-in-production',
	baseURL,
	trustedOrigins: [baseURL],
	advanced: {
		ipAddress: {
			ipAddressHeaders: ['x-forwarded-for', 'x-real-ip']
		}
	},
	user: {
		additionalFields: {
			username: { type: 'string', required: true, input: false },
			isAdmin: {
				type: 'boolean',
				required: false,
				defaultValue: false,
				input: false
			}
		}
	},
	session: {
		expiresIn: 60 * 60 * 24 * 30,
		updateAge: 60 * 60 * 24
	},
	rateLimit: {
		enabled: true,
		storage: 'database',
		modelName: 'rateLimit',
		window: 60,
		max: 30,
		customRules: {
			'/sign-in/magic-link': { window: 15 * 60, max: 5 }
		}
	},
	plugins: [
		magicLink({
			disableSignUp: true,
			expiresIn: 60 * 60 * 24,
			sendMagicLink: async ({ email, url }) => {
				if (dev) {
					logger.info({ email, url }, 'magic link (dev console only, no SMTP)');
					return;
				}
				// fire-and-forget: SMTP latency must not gate the auth response, otherwise
				// timing differences leak whitelist membership.
				sendMagicLinkMail(email, url).catch((err) => {
					logger.error({ err, email }, 'failed to send magic link email');
				});
			}
		}),
		sveltekitCookies(getRequestEvent)
	]
});

export type Auth = typeof auth;
