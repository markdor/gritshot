import { describe, test, expect } from 'vitest';
import { compressPhoto } from './compressPhoto';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1440;

function makeMarkedSource(width: number, height: number, borderPx: number): File {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d')!;
	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = 'black';
	ctx.fillRect(borderPx, borderPx, width - 2 * borderPx, height - 2 * borderPx);

	const dataUrl = canvas.toDataURL('image/png');
	const bytes = atob(dataUrl.split(',')[1]);
	const buf = new Uint8Array(bytes.length);
	for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
	return new File([buf], 'source.png', { type: 'image/png' });
}

async function samplePixel(file: File, x: number, y: number): Promise<[number, number, number]> {
	const bitmap = await createImageBitmap(file);
	const canvas = document.createElement('canvas');
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	const ctx = canvas.getContext('2d')!;
	ctx.drawImage(bitmap, 0, 0);
	const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
	return [r, g, b];
}

describe('compressPhoto', () => {
	test('produces a 1080x1440 JPEG', async () => {
		const source = makeMarkedSource(800, 400, 10);
		const result = await compressPhoto(source);

		expect(result.type).toBe('image/jpeg');
		expect(result.name).toBe('source.jpg');

		const bitmap = await createImageBitmap(result);
		expect(bitmap.width).toBe(CARD_WIDTH);
		expect(bitmap.height).toBe(CARD_HEIGHT);
	});

	test('crops a landscape source left/right around the centre', async () => {
		// 800x400 is wider than the 1080x1440 target aspect ratio, so the
		// centre-cropped region excludes the 10px white border on both sides.
		const source = makeMarkedSource(800, 400, 10);
		const result = await compressPhoto(source);

		const [r, g, b] = await samplePixel(result, 0, Math.floor(CARD_HEIGHT / 2));
		expect(r).toBeLessThan(100);
		expect(g).toBeLessThan(100);
		expect(b).toBeLessThan(100);
	});

	test('crops a narrow portrait source top/bottom around the centre', async () => {
		// 300x1000 is narrower than the 1080x1440 target aspect ratio, so the
		// centre-cropped region excludes the 10px white border top and bottom.
		const source = makeMarkedSource(300, 1000, 10);
		const result = await compressPhoto(source);

		const [r, g, b] = await samplePixel(result, Math.floor(CARD_WIDTH / 2), 0);
		expect(r).toBeLessThan(100);
		expect(g).toBeLessThan(100);
		expect(b).toBeLessThan(100);
	});

	test('rejects when the input cannot be decoded as an image', async () => {
		const notAnImage = new File([new Uint8Array([1, 2, 3])], 'broken.jpg', {
			type: 'image/jpeg'
		});

		await expect(compressPhoto(notAnImage)).rejects.toThrow();
	});
});
