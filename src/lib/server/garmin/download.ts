import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { GarminConnect } from 'garmin-connect';
import { logger } from '$lib/server/logger';

const GARMIN_FIT_ZIP_URL = 'https://connectapi.garmin.com/download-service/files/activity/';

/**
 * Returns the ZIP buffer that Garmin serves for a given activity (a single
 * .fit file inside). The "primary" path makes a direct authenticated HTTP
 * call to avoid the library's behavior of writing the file to disk. The
 * fallback delegates to the library and reads/cleans up a temp directory.
 */
export async function downloadActivityZip(
	client: GarminConnect,
	activityId: number | string
): Promise<Buffer> {
	try {
		const data = await client.client.get<ArrayBuffer | Buffer>(
			`${GARMIN_FIT_ZIP_URL}${activityId}`,
			{ responseType: 'arraybuffer' }
		);
		return Buffer.from(data as ArrayBuffer);
	} catch (primaryErr) {
		logger.warn(
			{ activityId, err: primaryErr },
			'garmin direct download failed, falling back to tmpdir'
		);
		const dir = mkdtempSync(join(tmpdir(), 'gritshot-garmin-'));
		try {
			await client.downloadOriginalActivityData({ activityId: Number(activityId) }, dir);
			const file = readdirSync(dir).find((n) => n.endsWith('.zip'));
			if (!file) {
				throw new Error('garmin download produced no zip', { cause: primaryErr });
			}
			return readFileSync(join(dir, file));
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	}
}
