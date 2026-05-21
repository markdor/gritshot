import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { auth } from '$lib/server/auth';

const authHandle: Handle = ({ event, resolve }) =>
	svelteKitHandler({ event, resolve, auth, building: false });

const sessionHandle: Handle = async ({ event, resolve }) => {
	const result = await auth.api.getSession({ headers: event.request.headers });
	event.locals.user = result?.user ?? null;
	event.locals.session = result?.session ?? null;
	return resolve(event);
};

const paraglideHandle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request }) => {
		event.request = request;
		return resolve(event);
	});

export const handle = sequence(authHandle, sessionHandle, paraglideHandle);
