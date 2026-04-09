import { ZipProcessor } from '$lib/server/zip/process';
import { validateFit } from '$lib/server/fit/validate';
import { parseFitBuffer } from '$lib/server/fit/process';
import { validateJpeg } from '$lib/server/jpg/validate';
import { validateZip } from '../zip/validate';
import { FileValidationError } from '$lib/server/FileValidationError';
import sharp from 'sharp';

async function readAndValidatePhoto(photoFile: File): Promise<Buffer> {
	const buffer: Buffer = Buffer.from(await photoFile.arrayBuffer());
	validateJpeg(buffer);
	return buffer;
}

async function readAndValidateFit(fitFile: File): Promise<Buffer> {
	const ext = fitFile.name.split('.').pop()?.toLowerCase();
	let buffer: Buffer = Buffer.from(await fitFile.arrayBuffer());

	if (ext === 'zip') {
		await validateZip(buffer);

		try {
			const extracted = await new ZipProcessor().extract(buffer);
			buffer = extracted.content;
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to process ZIP file';
			throw new FileValidationError(msg, 'Could not extract ZIP file');
		}
	}

	validateFit(buffer);

	return buffer;
}

export async function generateCard(fitFile: File, photoFile: File): Promise<Buffer> {
	const photoBuffer: Buffer = await readAndValidatePhoto(photoFile);
	const fitBuffer: Buffer = await readAndValidateFit(fitFile);
	const fitData: Awaited<ReturnType<typeof parseFitBuffer>> = await parseFitBuffer(fitBuffer);

	// TODO: render card using fitData and photoBuffer, return as JPG
	const { width, height } = await sharp(photoBuffer).metadata();

	const session = fitData.activity.sessions?.[0];
	const overlay = `
    <svg width="${width}" height="${height}">
      <rect x="0" y="${height! - 120}" width="${width}" height="120"
            fill="black" fill-opacity="0.5" />
      <text x="40" y="${height! - 70}" 
            font-family="Inter, sans-serif" font-size="48"
            font-weight="bold" fill="white">${session?.total_distance ?? ''}</text>
      <text x="40" y="${height! - 20}"
            font-family="Inter, sans-serif" font-size="28"
            fill="rgba(255,255,255,0.8)">${fitData.activity.total_timer_time} · ${session?.total_ascent ?? 0}Hm</text>
    </svg>
  `;

	return sharp(photoBuffer)
		.composite([
			{
				input: Buffer.from(overlay),
				top: 0,
				left: 0
			}
		])
		.jpeg({ quality: 90 })
		.toBuffer();
}
