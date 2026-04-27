import { ZipProcessor } from '$lib/server/zip/process';
import { validateFit } from '$lib/server/fit/validate';
import { parseFitData } from '$lib/server/fit/process';
import { validateJpeg } from '$lib/server/jpg/validate';
import { validateZip } from '../zip/validate';
import { FileValidationError } from '$lib/server/FileValidationError';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

const fontDir = join(process.cwd(), 'static', 'fonts');
const font400 = readFileSync(join(fontDir, 'barlow-condensed-latin-400-normal.woff2')).toString('base64');
const font400italic = readFileSync(join(fontDir, 'barlow-condensed-latin-400-italic.woff2')).toString('base64');
const font700 = readFileSync(join(fontDir, 'barlow-condensed-latin-700-normal.woff2')).toString('base64');
const font700italic = readFileSync(join(fontDir, 'barlow-condensed-latin-700-italic.woff2')).toString('base64');

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
const barHeight = 230;
const barY = cardHeight - barHeight;
const divX1 = 360;
const divX2 = 700;
const col1Center = divX1 / 2;
const col2Center = (divX1 + divX2) / 2;
const col3Center = (divX2 + cardWidth) / 2;

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

const THIN_SPACE = ' ';

function formatDistance(km: number): string {
	return `${km.toFixed(2)}${THIN_SPACE}km`;
}

function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	return `${h}:${String(m).padStart(2, '0')}${THIN_SPACE}h`;
}

function formatElevation(m: number): string {
	return `${Math.round(m * 1000)}${THIN_SPACE}m`;
}

export async function generateCard(fitFile: File, photoFile: File, title: string): Promise<Buffer> {
	const photoBuffer: Buffer = await readAndValidatePhoto(photoFile);
	const fitBuffer: Buffer = await readAndValidateFit(fitFile);
	const fitData = await parseFitData(fitBuffer);

	const croppedBuffer = await sharp(photoBuffer)
		.resize(cardWidth, cardHeight, { fit: 'cover', position: 'centre' })
		.toBuffer();

	const titleY = barY + 75;
	const labelY = barY + 136;
	const valueY = barY + 193;
	const divY1 = barY + 105;
	const divY2 = cardHeight - 15;

	const overlay = `
    <svg width="${cardWidth}" height="${cardHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @font-face {
            font-family: 'Barlow Condensed';
            font-weight: 400;
            font-style: normal;
            src: url('data:font/woff2;base64,${font400}') format('woff2');
          }
          @font-face {
            font-family: 'Barlow Condensed';
            font-weight: 400;
            font-style: italic;
            src: url('data:font/woff2;base64,${font400italic}') format('woff2');
          }
          @font-face {
            font-family: 'Barlow Condensed';
            font-weight: 700;
            font-style: normal;
            src: url('data:font/woff2;base64,${font700}') format('woff2');
          }
          @font-face {
            font-family: 'Barlow Condensed';
            font-weight: 700;
            font-style: italic;
            src: url('data:font/woff2;base64,${font700italic}') format('woff2');
          }
        </style>
      </defs>

      <rect x="0" y="${barY}" width="${cardWidth}" height="${barHeight}"
            fill="#444444" fill-opacity="0.45" />

      <!-- Title -->
      <text x="50" y="${titleY}"
            font-family="Barlow Condensed" font-size="70"
            font-weight="700" font-style="italic" fill="white">${escapeXml(title)}</text>

      <!-- Dividers -->
      <line x1="${divX1}" y1="${divY1}" x2="${divX1}" y2="${divY2}"
            stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
      <line x1="${divX2}" y1="${divY1}" x2="${divX2}" y2="${divY2}"
            stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>

      <!-- Labels -->
      <text x="${col1Center}" y="${labelY}" text-anchor="middle"
            font-family="Barlow Condensed" font-size="30" font-weight="400"
            fill="white" letter-spacing="2">DISTANZ</text>
      <text x="${col2Center}" y="${labelY}" text-anchor="middle"
            font-family="Barlow Condensed" font-size="30" font-weight="400"
            fill="white" letter-spacing="2">HÖHENMETER</text>
      <text x="${col3Center}" y="${labelY}" text-anchor="middle"
            font-family="Barlow Condensed" font-size="30" font-weight="400"
            fill="white" letter-spacing="2">ZEIT</text>

      <!-- Values -->
      <text x="${col1Center}" y="${valueY}" text-anchor="middle"
            font-family="Barlow Condensed" font-size="44" font-weight="400"
            fill="white">${formatDistance(fitData.distance)}</text>
      <text x="${col2Center}" y="${valueY}" text-anchor="middle"
            font-family="Barlow Condensed" font-size="44" font-weight="400"
            fill="white">${formatElevation(fitData.elevation)}</text>
      <text x="${col3Center}" y="${valueY}" text-anchor="middle"
            font-family="Barlow Condensed" font-size="44" font-weight="400"
            fill="white">${formatDuration(fitData.durationTotal)}</text>
    </svg>
  `;

	const blurredBar = await sharp(croppedBuffer)
		.extract({ left: 0, top: barY, width: cardWidth, height: barHeight })
		.blur(16)
		.toBuffer();

	return sharp(croppedBuffer)
		.composite([
			{ input: blurredBar, top: barY, left: 0 },
			{ input: Buffer.from(overlay), top: 0, left: 0 }
		])
		.jpeg({ quality: 90 })
		.toBuffer();
}
