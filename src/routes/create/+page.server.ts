import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { validateZip } from '$lib/validation/zip';
import { validateFit } from '$lib/validation/fit';
import { validateJpeg } from '$lib/validation/jpeg';

export const actions = {
	default: async ({ request }: RequestEvent) => {
		const formData = await request.formData();

		const fitFile = formData.get('fitFile') as File | null;
		const photoFile = formData.get('photoFile') as File | null;

		if (!fitFile || fitFile.size === 0) {
			return fail(422, { error: 'No FIT file uploaded' });
		}

		if (!photoFile || photoFile.size === 0) {
			return fail(422, { error: 'No photo uploaded' });
		}

		// Read file contents for validation
		const fitBuffer = Buffer.from(await fitFile.arrayBuffer());
		const photoBuffer = Buffer.from(await photoFile.arrayBuffer());

		// FIT/ZIP validation
		const ext = fitFile.name.split('.').pop()?.toLowerCase();
		if (ext === 'fit') {
			const fitError = validateFit(fitBuffer, fitFile.size);
			if (fitError) return fail(422, { error: fitError });
		} else if (ext === 'zip') {
			const zipError = await validateZip(fitBuffer, fitFile.size);
			if (zipError) return fail(422, { error: zipError });
		} else {
			return fail(422, { error: 'FIT file must be a .fit or .zip file' });
		}

		// Photo validation
		const jpegError = validateJpeg(photoBuffer, photoFile.size);
		if (jpegError) return fail(422, { error: jpegError });

		console.log('FIT file:', fitFile.name, fitBuffer.byteLength, 'bytes');
		console.log('Photo:', photoFile.name, photoBuffer.byteLength, 'bytes');

		return { success: true };
	}
};
