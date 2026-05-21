import { redirect, type Actions, type ServerLoad } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

export const load: ServerLoad = () => {
	throw redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ request }) => {
		await auth.api.signOut({ headers: request.headers });
		throw redirect(303, '/');
	}
};
