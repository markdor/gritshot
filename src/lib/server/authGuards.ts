import { error } from '@sveltejs/kit';

type CurrentUser = NonNullable<App.Locals['user']>;

export function requireUser(locals: App.Locals): CurrentUser {
	if (!locals.user) throw error(401, 'Unauthorized');
	return locals.user;
}
