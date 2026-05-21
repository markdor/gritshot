import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('$lib/server/garmin/client', () => ({
	loginAndStore: vi.fn(),
	disconnect: vi.fn(),
	hasGarminConnection: vi.fn()
}));

import { actions, load } from './+page.server';
import { loginAndStore, disconnect, hasGarminConnection } from '$lib/server/garmin/client';
import { GarminAuthError, GarminNetworkError } from '$lib/server/garmin/errors';

type ActionEvent = Parameters<NonNullable<typeof actions>['connect']>[0];

function makeFormEvent(form: Record<string, string>, userId: string | null = 'u1'): ActionEvent {
	const fd = new FormData();
	for (const [k, v] of Object.entries(form)) fd.append(k, v);
	const request = new Request('http://localhost/garmin/connect', { method: 'POST', body: fd });
	const locals = { user: userId ? { id: userId } : null } as App.Locals;
	return { request, locals } as unknown as ActionEvent;
}

describe('garmin/connect load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects unauthenticated users with 401', () => {
		vi.mocked(hasGarminConnection).mockReturnValue(false);
		expect(() =>
			load({ locals: { user: null } } as unknown as Parameters<typeof load>[0])
		).toThrow();
	});

	it('returns connected=true when a connection exists', () => {
		vi.mocked(hasGarminConnection).mockReturnValue(true);
		const result = load({
			locals: { user: { id: 'u1' } }
		} as unknown as Parameters<typeof load>[0]);
		expect(result).toEqual({ connected: true });
	});
});

describe('garmin/connect connect action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects missing email', async () => {
		const result = await actions.connect(makeFormEvent({ password: 'pw' }));
		expect(result).toMatchObject({ status: 422 });
		expect(loginAndStore).not.toHaveBeenCalled();
	});

	it('rejects missing password', async () => {
		const result = await actions.connect(makeFormEvent({ email: 'a@b.c' }));
		expect(result).toMatchObject({ status: 422 });
		expect(loginAndStore).not.toHaveBeenCalled();
	});

	it('returns 401 on Garmin auth failure', async () => {
		vi.mocked(loginAndStore).mockRejectedValueOnce(new GarminAuthError('bad'));
		const result = await actions.connect(makeFormEvent({ email: 'a@b.c', password: 'pw' }));
		expect(result).toMatchObject({ status: 401 });
	});

	it('returns 502 on network failure', async () => {
		vi.mocked(loginAndStore).mockRejectedValueOnce(new GarminNetworkError('down'));
		const result = await actions.connect(makeFormEvent({ email: 'a@b.c', password: 'pw' }));
		expect(result).toMatchObject({ status: 502 });
	});

	it('redirects to /garmin/create on success', async () => {
		vi.mocked(loginAndStore).mockResolvedValueOnce();
		await expect(
			actions.connect(makeFormEvent({ email: 'a@b.c', password: 'pw' }))
		).rejects.toMatchObject({ status: 303, location: '/garmin/create' });
		expect(loginAndStore).toHaveBeenCalledWith('u1', 'a@b.c', 'pw');
	});
});

describe('garmin/connect disconnect action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deletes the connection and returns success', async () => {
		const result = await actions.disconnect(makeFormEvent({}));
		expect(disconnect).toHaveBeenCalledWith('u1');
		expect(result).toEqual({ disconnected: true });
	});
});
