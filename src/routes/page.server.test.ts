import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/garmin/client', () => ({ hasGarminConnection: vi.fn() }));

import { load } from './+page.server';
import { hasGarminConnection } from '$lib/server/garmin/client';

type LoadEvent = Parameters<typeof load>[0];

describe('homepage load', () => {
	it('resolves to /create for anonymous users', async () => {
		const result = await load({ locals: { user: null } } as unknown as LoadEvent);
		expect(result).toEqual({ createHref: '/create' });
	});

	it('resolves to /garmin/required for users without a garmin connection', async () => {
		vi.mocked(hasGarminConnection).mockReturnValue(false);
		const result = await load({
			locals: { user: { id: 'u1' } }
		} as unknown as LoadEvent);
		expect(result).toEqual({ createHref: '/garmin/required' });
	});

	it('resolves to /garmin/create for users with a garmin connection', async () => {
		vi.mocked(hasGarminConnection).mockReturnValue(true);
		const result = await load({
			locals: { user: { id: 'u1' } }
		} as unknown as LoadEvent);
		expect(result).toEqual({ createHref: '/garmin/create' });
	});
});
