import FitParser from 'fit-file-parser';
import { FileValidationError } from '$lib/server/FileValidationError';
import type { FitData } from './types.js';

const parser = new FitParser({
	force: true,
	speedUnit: 'km/h',
	lengthUnit: 'km',
	temperatureUnit: 'celsius',
	pressureUnit: 'bar',
	elapsedRecordField: true,
	mode: 'cascade'
});

export async function parseFitData(buffer: Buffer): Promise<FitData> {
	const parsed = await parser.parseAsync(buffer.buffer as ArrayBuffer);
	const session = parsed.activity.sessions?.[0];

	if (!session) {
		throw new FileValidationError(
			'FIT file contains no session',
			'FIT file contains no activity data'
		);
	}

	return {
		distance: session.total_distance ?? 0,
		durationAction: session.total_timer_time ?? 0,
		durationTotal: session.total_elapsed_time ?? 0,
		elevation: session.total_ascent ?? 0
	};
}
