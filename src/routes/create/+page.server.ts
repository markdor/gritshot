import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

const MB = 1024 * 1024;

function isZip(buf: Buffer): boolean {
	return buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
}

function isFit(buf: Buffer): boolean {
	// FIT header: bytes 8–11 must be ".FIT"
	return (
		buf.length >= 12 &&
		buf[8] === 0x2e &&
		buf[9] === 0x46 &&
		buf[10] === 0x49 &&
		buf[11] === 0x54
	);
}

function isJpeg(buf: Buffer): boolean {
	return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

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

		// Size checks
		if (fitFile.size > 5 * MB) {
			return fail(422, { error: 'FIT/ZIP file must not exceed 5 MB' });
		}

		if (photoFile.size > 10 * MB) {
			return fail(422, { error: 'Photo must not exceed 10 MB' });
		}

		// Read file contents for magic-byte validation
		const fitBuffer = Buffer.from(await fitFile.arrayBuffer());
		const photoBuffer = Buffer.from(await photoFile.arrayBuffer());

		// Format checks
		if (!isFit(fitBuffer) && !isZip(fitBuffer)) {
			return fail(422, { error: 'FIT file must be a valid .fit or .zip file' });
		}

		if (!isJpeg(photoBuffer)) {
			return fail(422, { error: 'Photo must be a valid JPEG file' });
		}

		console.log('FIT file:', fitFile.name, fitBuffer.byteLength, 'bytes');
		console.log('Photo:', photoFile.name, photoBuffer.byteLength, 'bytes');

		return { success: true };
	}
};
