import type { ServerLoad } from '@sveltejs/kit';
import { hasGarminConnection } from '$lib/server/garmin/client';

type CreateHref = '/create' | '/garmin/required' | '/garmin/create';

export const load: ServerLoad = ({ locals }) => {
	let createHref: CreateHref = '/create';

	if (locals.user) {
		createHref = hasGarminConnection(locals.user.id) ? '/garmin/create' : '/garmin/required';
	}

	return { createHref };
};
