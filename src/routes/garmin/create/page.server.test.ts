import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

vi.mock('$lib/server/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('$lib/server/garmin/client', () => ({
	hasGarminConnection: vi.fn(),
	withGarminClient: vi.fn()
}));
vi.mock('$lib/server/garmin/download', () => ({
	downloadActivityZip: vi.fn()
}));

import { load, actions } from './+page.server';
import { hasGarminConnection, withGarminClient } from '$lib/server/garmin/client';
import { downloadActivityZip } from '$lib/server/garmin/download';
import {
	GarminAuthError,
	GarminNetworkError,
	GarminNotConnectedError
} from '$lib/server/garmin/errors';

const zipBuffer = readFileSync(resolvePath('tests/fixtures/zip/valid.zip'));
const jpgBuffer = readFileSync(resolvePath('tests/fixtures/photos/valid.jpg'));

type ActionEvent = Parameters<NonNullable<typeof actions>['default']>[0];

function makeActionEvent(
	fields: Record<string, string | File>,
	userId: string | null = 'u1'
): ActionEvent {
	const fd = new FormData();
	for (const [k, v] of Object.entries(fields)) fd.append(k, v as Blob | string);
	const request = new Request('http://localhost/garmin/create', { method: 'POST', body: fd });
	const locals = { user: userId ? { id: userId } : null } as App.Locals;
	return { request, locals } as unknown as ActionEvent;
}

describe('garmin/create load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects unauthenticated users', async () => {
		await expect(
			load({ locals: { user: null } } as unknown as Parameters<typeof load>[0])
		).rejects.toThrow();
	});

	it('returns connected=false when user has no garmin connection', async () => {
		vi.mocked(hasGarminConnection).mockReturnValue(false);
		const result = await load({
			locals: { user: { id: 'u1' } }
		} as unknown as Parameters<typeof load>[0]);
		expect(result).toEqual({ connected: false });
		expect(withGarminClient).not.toHaveBeenCalled();
	});

	it('returns an auth-session error when withGarminClient throws GarminAuthError', async () => {
		vi.mocked(hasGarminConnection).mockReturnValue(true);
		vi.mocked(withGarminClient).mockRejectedValueOnce(new GarminAuthError('stale tokens'));

		const result = (await load({
			locals: { user: { id: 'u1' } }
		} as unknown as Parameters<typeof load>[0])) as {
			connected: true;
			activities: unknown[];
			error: string | null;
		};

		expect(result.connected).toBe(true);
		expect(result.activities).toEqual([]);
		expect(result.error).toMatch(/session expired/i);
	});

	it('returns a network error for any other failure during activity load', async () => {
		vi.mocked(hasGarminConnection).mockReturnValue(true);
		vi.mocked(withGarminClient).mockRejectedValueOnce(new Error('boom'));

		const result = (await load({
			locals: { user: { id: 'u1' } }
		} as unknown as Parameters<typeof load>[0])) as {
			connected: true;
			activities: unknown[];
			error: string | null;
		};

		expect(result.error).toMatch(/unreachable/i);
	});

	it('maps activities to lean DTOs', async () => {
		vi.mocked(hasGarminConnection).mockReturnValue(true);
		vi.mocked(withGarminClient).mockImplementation(async (_id, fn) =>
			// Cast: the lib's IActivity type is huge; only the fields below are exercised.
			fn({
				getActivities: async () => [
					{
						activityId: 12345,
						activityName: 'Morning Trail',
						activityType: { typeKey: 'trail_running' },
						startTimeLocal: '2026-05-22 06:00:00',
						distance: 12500,
						duration: 3600,
						elevationGain: 420
					}
				]
			} as never)
		);

		const result = (await load({
			locals: { user: { id: 'u1' } }
		} as unknown as Parameters<typeof load>[0])) as {
			connected: true;
			activities: unknown[];
			error: string | null;
		};

		expect(result.connected).toBe(true);
		expect(result.error).toBeNull();
		expect(result.activities).toEqual([
			{
				activityId: 12345,
				name: 'Morning Trail',
				type: 'trail_running',
				startTimeLocal: '2026-05-22 06:00:00',
				distanceKm: 12.5,
				durationSec: 3600,
				elevationM: 420
			}
		]);
	});
});

describe('garmin/create default action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects when title is missing', async () => {
		const result = await actions.default(
			makeActionEvent({
				activityId: '12345',
				photoFile: new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' })
			})
		);
		expect(result).toMatchObject({
			status: 422,
			data: { error: 'Please enter an activity title' }
		});
	});

	it('rejects when title is too long', async () => {
		const result = await actions.default(
			makeActionEvent({
				title: 'A'.repeat(29),
				activityId: '12345',
				photoFile: new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' })
			})
		);
		expect(result).toMatchObject({
			status: 422,
			data: { error: 'Activity title must not exceed 28 characters' }
		});
	});

	it('rejects when activityId is missing or not numeric', async () => {
		const result = await actions.default(
			makeActionEvent({
				title: 'Run',
				activityId: 'nope',
				photoFile: new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' })
			})
		);
		expect(result).toMatchObject({ status: 422 });
	});

	it('rejects when photo is missing', async () => {
		const result = await actions.default(makeActionEvent({ title: 'Run', activityId: '12345' }));
		expect(result).toMatchObject({ status: 422, data: { error: 'No photo uploaded' } });
	});

	it('rejects when photo exceeds 10 MB', async () => {
		const oversized = new File([new Uint8Array(11 * 1024 * 1024)], 'huge.jpg', {
			type: 'image/jpeg'
		});
		const result = await actions.default(
			makeActionEvent({ title: 'Run', activityId: '12345', photoFile: oversized })
		);
		expect(result).toMatchObject({ status: 422, data: { error: 'Files must not exceed 10 MB' } });
	});

	it('returns 422 when the user has no garmin connection at submit time', async () => {
		vi.mocked(withGarminClient).mockRejectedValueOnce(new GarminNotConnectedError());

		const result = await actions.default(
			makeActionEvent({
				title: 'Run',
				activityId: '12345',
				photoFile: new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' })
			})
		);
		expect(result).toMatchObject({ status: 422 });
	});

	it('returns 401 when garmin tokens are rejected during download', async () => {
		vi.mocked(withGarminClient).mockRejectedValueOnce(new GarminAuthError('stale'));

		const result = await actions.default(
			makeActionEvent({
				title: 'Run',
				activityId: '12345',
				photoFile: new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' })
			})
		);
		expect(result).toMatchObject({ status: 401 });
	});

	it('returns 502 when garmin is unreachable during download', async () => {
		vi.mocked(withGarminClient).mockRejectedValueOnce(new GarminNetworkError('ETIMEDOUT'));

		const result = await actions.default(
			makeActionEvent({
				title: 'Run',
				activityId: '12345',
				photoFile: new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' })
			})
		);
		expect(result).toMatchObject({ status: 502 });
	});

	it('returns 422 with the userMessage when downloaded data fails validation', async () => {
		vi.mocked(withGarminClient).mockImplementation(async (_id, fn) => fn({} as never));
		// Not a real ZIP — validateZip will throw a FileValidationError.
		vi.mocked(downloadActivityZip).mockResolvedValueOnce(Buffer.from('definitely-not-a-zip'));

		const result = await actions.default(
			makeActionEvent({
				title: 'Run',
				activityId: '12345',
				photoFile: new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' })
			})
		);
		expect(result).toMatchObject({ status: 422, data: { error: 'File is not a valid ZIP file' } });
	});

	it('returns 500 on unexpected errors', async () => {
		vi.mocked(withGarminClient).mockRejectedValueOnce(new Error('out of memory'));

		const result = await actions.default(
			makeActionEvent({
				title: 'Run',
				activityId: '12345',
				photoFile: new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' })
			})
		);
		expect(result).toMatchObject({ status: 500, data: { error: 'Failed to generate GritShot' } });
	});

	it('generates a card when garmin download yields a valid zip', async () => {
		vi.mocked(withGarminClient).mockImplementation(async (_id, fn) => {
			// Fake client; downloadActivityZip is itself mocked below so the client isn't really used.
			return fn({} as never);
		});
		vi.mocked(downloadActivityZip).mockResolvedValue(zipBuffer);

		const result = await actions.default(
			makeActionEvent({
				title: 'Run',
				activityId: '12345',
				photoFile: new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' })
			})
		);

		expect(result).toMatchObject({
			image: expect.stringMatching(/^\/9j\//),
			title: 'Run'
		});
	});
});
