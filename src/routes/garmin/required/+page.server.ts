import { redirect } from '@sveltejs/kit';
import type { ServerLoad } from '@sveltejs/kit';
import { requireUser } from '$lib/server/authGuards';
import { hasGarminConnection } from '$lib/server/garmin/client';

export const load: ServerLoad = ({ locals }) => {
	const user = requireUser(locals);

	if (hasGarminConnection(user.id)) {
		throw redirect(303, '/garmin/create');
	}
};
