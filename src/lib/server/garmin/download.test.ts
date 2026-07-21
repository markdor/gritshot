import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

vi.mock('$lib/server/logger', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

import { downloadActivityZip } from './download';

type FakeClient = {
	client: { get: ReturnType<typeof vi.fn> };
	downloadOriginalActivityData: ReturnType<typeof vi.fn>;
};

function makeFakeClient(): FakeClient {
	return {
		client: { get: vi.fn() },
		downloadOriginalActivityData: vi.fn()
	};
}

describe('downloadActivityZip', () => {
	let preDirs: string[];

	beforeEach(() => {
		// Track tmpdir entries so we can detect leaks after each test.
		preDirs = readdirSync(tmpdir()).filter((n) => n.startsWith('gritshot-garmin-'));
	});

	it('returns the buffer from the direct HTTP path without touching disk', async () => {
		const client = makeFakeClient();
		const payload = Buffer.from('zipdata');
		client.client.get.mockResolvedValueOnce(payload);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await downloadActivityZip(client as any, 12345);

		expect(result).toEqual(payload);
		expect(client.client.get).toHaveBeenCalledWith(
			'https://connectapi.garmin.com/download-service/files/activity/12345',
			{ responseType: 'arraybuffer' }
		);
		expect(client.downloadOriginalActivityData).not.toHaveBeenCalled();

		// Fallback dir must NOT have been created.
		const post = readdirSync(tmpdir()).filter((n) => n.startsWith('gritshot-garmin-'));
		expect(post).toEqual(preDirs);
	});

	it('converts an ArrayBuffer response to a Buffer', async () => {
		const client = makeFakeClient();
		const ab = new Uint8Array([1, 2, 3, 4]).buffer;
		client.client.get.mockResolvedValueOnce(ab);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await downloadActivityZip(client as any, 42);

		expect(Buffer.isBuffer(result)).toBe(true);
		expect(Array.from(result)).toEqual([1, 2, 3, 4]);
	});

	it('falls back to tmpdir+downloadOriginalActivityData when the direct call fails', async () => {
		const client = makeFakeClient();
		client.client.get.mockRejectedValueOnce(new Error('boom'));

		// The library writes a file like `<dir>/<activityId>.zip` — emulate that.
		client.downloadOriginalActivityData.mockImplementation(
			async (_a: { activityId: number }, dir: string) => {
				writeFileSync(`${dir}/77.zip`, Buffer.from('from-fallback'));
			}
		);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await downloadActivityZip(client as any, 77);

		expect(result.toString()).toBe('from-fallback');
		expect(client.downloadOriginalActivityData).toHaveBeenCalledWith(
			{ activityId: 77 },
			expect.any(String)
		);

		// Tmpdir must be cleaned up — no leftover gritshot-garmin- directory.
		const post = readdirSync(tmpdir()).filter((n) => n.startsWith('gritshot-garmin-'));
		expect(post).toEqual(preDirs);
	});

	it('cleans up tmpdir even when fallback itself throws', async () => {
		const client = makeFakeClient();
		client.client.get.mockRejectedValueOnce(new Error('primary failed'));
		// Intentionally do NOT write a zip — fallback will throw "produced no zip".
		client.downloadOriginalActivityData.mockResolvedValueOnce(undefined);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await expect(downloadActivityZip(client as any, 99)).rejects.toThrow(/no zip/);

		const post = readdirSync(tmpdir()).filter((n) => n.startsWith('gritshot-garmin-'));
		expect(post).toEqual(preDirs);
	});

	it('coerces a string activityId for the fallback path', async () => {
		const client = makeFakeClient();
		client.client.get.mockRejectedValueOnce(new Error('boom'));
		let capturedActivityId: unknown;
		client.downloadOriginalActivityData.mockImplementation(
			async (a: { activityId: number }, dir: string) => {
				capturedActivityId = a.activityId;
				writeFileSync(`${dir}/123.zip`, Buffer.from('x'));
			}
		);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await downloadActivityZip(client as any, '123');

		// The library expects a numeric id even when our public signature accepts strings.
		expect(capturedActivityId).toBe(123);
		// Sanity: tmpdir must be cleaned up.
		expect(existsSync(`${tmpdir()}/123.zip`)).toBe(false);
	});
});
