import { fail } from '@sveltejs/kit';
import type { RequestEvent, ActionFailure } from '@sveltejs/kit';
import { ZipProcessor } from '$lib/server/zip/process';
import { validateFit } from '$lib/server/fit/validate';
import { validateJpeg } from '$lib/server/jpg/validate';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

function getFilesFromFormData(
	formData: FormData
): { fitFile: File; photoFile: File } | ActionFailure<{ error: string }> {
	const fitFile = formData.get('fitFile');
	const photoFile = formData.get('photoFile');

	if (!(fitFile instanceof File) || fitFile.size === 0) {
		return fail(422, { error: 'No FIT file uploaded' });
	}

	if (!(photoFile instanceof File) || photoFile.size === 0) {
		return fail(422, { error: 'No photo uploaded' });
	}

	if (fitFile.size > MAX_UPLOAD_SIZE || photoFile.size > MAX_UPLOAD_SIZE) {
		return fail(422, { error: 'Files must not exceed 10 MB' });
	}

	return { fitFile, photoFile };
}

export const actions = {
	default: async ({ request }: RequestEvent) => {
		const formData = await request.formData();
		const filesResult = getFilesFromFormData(formData);

		// If there was an error with the uploaded files, return the failure response
		if ('status' in filesResult) return filesResult;

		// At this point, we have valid File objects for both the FIT file and the photo
		const { fitFile, photoFile } = filesResult;

		// Read file contents for validation
		let fitBuffer: Buffer = Buffer.from(await fitFile.arrayBuffer());		

		// ZIP extraction
		const ext = fitFile.name.split('.').pop()?.toLowerCase();
		if (ext === 'zip') {
			try {
				const extracted = await new ZipProcessor().extract(fitBuffer);
				fitBuffer = extracted.content;
			} catch (e) {
				return fail(422, { error: (e as Error).message });
			}
		} else if (ext !== 'fit') {
			return fail(422, { error: 'FIT file must be a .fit or .zip file' });
		}

		// FIT validation
		const fitError = validateFit(fitBuffer);
		if (fitError) return fail(422, { error: fitError });

		// Photo validation
		const photoBuffer = Buffer.from(await photoFile.arrayBuffer());
		const jpegError = validateJpeg(photoBuffer);
		if (jpegError) return fail(422, { error: jpegError });

		console.log('FIT file:', fitFile.name, fitBuffer.byteLength, 'bytes');
		console.log('Photo:', photoFile.name, photoBuffer.byteLength, 'bytes');

		return { success: true };
	}
};
