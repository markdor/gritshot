import { fail } from '@sveltejs/kit';
import type { RequestEvent, ActionFailure } from '@sveltejs/kit';
import { generateCard } from '$lib/server/card/generate';
import { FileValidationError } from '$lib/server/FileValidationError';
import { logger } from '$lib/server/logger.js';
import { m } from '$lib/paraglide/messages';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

function getFilesFromFormData(
	formData: FormData
): { title: string; fitFile: File; photoFile: File } | ActionFailure<{ error: string }> {
	const title = formData.get('title');
	const fitFile = formData.get('fitFile');
	const photoFile = formData.get('photoFile');

	if (typeof title !== 'string') {
		return fail(422, { error: m.error_title_required() });
	}

	const sanitizedTitle = title.replace(/\p{Cc}/gu, '').trim();

	if (sanitizedTitle.length === 0) {
		return fail(422, { error: m.error_title_required() });
	}

	if (sanitizedTitle.length > 28) {
		return fail(422, { error: m.error_title_too_long() });
	}

	if (!(fitFile instanceof File) || fitFile.size === 0) {
		return fail(422, { error: m.error_no_fit() });
	}

	if (!(photoFile instanceof File) || photoFile.size === 0) {
		return fail(422, { error: m.error_no_photo() });
	}

	if (fitFile.size > MAX_UPLOAD_SIZE || photoFile.size > MAX_UPLOAD_SIZE) {
		return fail(422, { error: m.error_file_too_large() });
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
			return fail(500, { error: m.error_generate_failed() });
		}
	}
};
