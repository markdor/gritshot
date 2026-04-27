import { fail } from '@sveltejs/kit';
import type { RequestEvent, ActionFailure } from '@sveltejs/kit';
import { generateCard } from '$lib/server/card/generate';
import { FileValidationError } from '$lib/server/FileValidationError';
import { logger } from '$lib/server/logger.js';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

function getFilesFromFormData(
	formData: FormData
): { title: string; fitFile: File; photoFile: File } | ActionFailure<{ error: string }> {
	const title = formData.get('title');
	const fitFile = formData.get('fitFile');
	const photoFile = formData.get('photoFile');

	if (typeof title !== 'string') {
		return fail(422, { error: 'Please enter an activity title' });
	}

	const sanitizedTitle = title.replace(/[\x00-\x1F\x7F]/g, '').trim();

	if (sanitizedTitle.length === 0) {
		return fail(422, { error: 'Please enter an activity title' });
	}

	if (sanitizedTitle.length > 28) {
		return fail(422, { error: 'Activity title must not exceed 28 characters' });
	}

	if (!(fitFile instanceof File) || fitFile.size === 0) {
		return fail(422, { error: 'No FIT file uploaded' });
	}

	if (!(photoFile instanceof File) || photoFile.size === 0) {
		return fail(422, { error: 'No photo uploaded' });
	}

	if (fitFile.size > MAX_UPLOAD_SIZE || photoFile.size > MAX_UPLOAD_SIZE) {
		return fail(422, { error: 'Files must not exceed 10 MB' });
	}

	return { title: sanitizedTitle, fitFile, photoFile };
}

export const actions = {
	default: async ({ request }: RequestEvent) => {
		const formData = await request.formData();
		const filesResult = getFilesFromFormData(formData);

		// If there was an error with the uploaded files, return the failure response
		if ('status' in filesResult) return filesResult;

		// At this point, we have valid File objects for both the FIT file and the photo
		const { title, fitFile, photoFile } = filesResult;

		try {
			const imageBuffer = await generateCard(fitFile, photoFile, title);
			return { image: imageBuffer.toString('base64') };
		} catch (e: unknown) {
			if (e instanceof FileValidationError) {
				logger.error(`File validation error: ${e.message}`);
				return fail(422, { error: e.userMessage });
			}

			logger.error(
				`Unexpected error during card generation: ${e instanceof Error ? e.message : String(e)}`
			);
			return fail(500, { error: 'Failed to generate card' });
		}
	}
};
