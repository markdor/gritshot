import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/garmin/client', () => ({ hasGarminConnection: vi.fn() }));

import { load } from './+page.server';
import { hasGarminConnection } from '$lib/server/garmin/client';

type LoadEvent = Parameters<typeof load>[0];

describe('garmin/required load', () => {
	it('rejects unauthenticated users', async () => {
		await expect(
			Promise.resolve().then(() => load({ locals: { user: null } } as unknown as LoadEvent))
		).rejects.toThrow();
	});

	it('does not redirect users without a garmin connection', async () => {
		vi.mocked(hasGarminConnection).mockReturnValue(false);
		const result = await load({
			locals: { user: { id: 'u1' } }
		} as unknown as LoadEvent);
		expect(result).toBeUndefined();
	});

	it('redirects garmin-connected users to /garmin/create', async () => {
		vi.mocked(hasGarminConnection).mockReturnValue(true);
		await expect(
			Promise.resolve().then(() => load({ locals: { user: { id: 'u1' } } } as unknown as LoadEvent))
		).rejects.toMatchObject({ status: 303, location: '/garmin/create' });
	});
});
