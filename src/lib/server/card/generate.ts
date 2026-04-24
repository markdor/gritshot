import { ZipProcessor } from '$lib/server/zip/process';
import { validateFit } from '$lib/server/fit/validate';
import { parseFitData } from '$lib/server/fit/process';
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

const cardWidth = 1080;
const cardHeight = 1440;

export async function generateCard(fitFile: File, photoFile: File): Promise<Buffer> {
	const photoBuffer: Buffer = await readAndValidatePhoto(photoFile);
	const fitBuffer: Buffer = await readAndValidateFit(fitFile);
	const fitData = await parseFitData(fitBuffer);

	// TODO: render card using fitData and photoBuffer, return as JPG
	const croppedBuffer = await sharp(photoBuffer)
		.resize(cardWidth, cardHeight, { fit: 'cover', position: 'centre' })
		.toBuffer();

	const overlay = `
    <svg width="${cardWidth}" height="${cardHeight}">
      <rect x="0" y="${cardHeight - 120}" width="${cardWidth}" height="120"
            fill="black" fill-opacity="0.5" />
      <text x="40" y="${cardHeight - 70}"
            font-family="Inter, sans-serif" font-size="48"
            font-weight="bold" fill="white">${fitData.distance}</text>
      <text x="40" y="${cardHeight - 20}"
            font-family="Inter, sans-serif" font-size="28"
            fill="rgba(255,255,255,0.8)">${fitData.durationTotal} · ${fitData.elevation}Hm</text>
    </svg>
  `;

	return sharp(croppedBuffer)
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
