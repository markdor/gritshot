import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.user) return { user: null };
	return {
		user: {
			id: locals.user.id,
			username: locals.user.username,
			isAdmin: Boolean(locals.user.isAdmin)
		}
	};
};
