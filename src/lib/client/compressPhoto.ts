import { CARD_WIDTH, CARD_HEIGHT } from '$lib/cardDimensions';

const JPEG_QUALITY = 0.9;

interface CropRect {
	sx: number;
	sy: number;
	sw: number;
	sh: number;
}

export async function compressPhoto(file: File): Promise<File> {
	const bitmap = await createImageBitmap(file);
	try {
		const crop = coverCropRect(bitmap.width, bitmap.height, CARD_WIDTH, CARD_HEIGHT);
		const blob = await drawToJpeg(bitmap, crop);
		return new File([blob], toJpgName(file.name), { type: 'image/jpeg' });
	} finally {
		bitmap.close();
	}
}

// Mirrors sharp's resize(..., { fit: 'cover', position: 'centre' }): crop a
// centered region matching the target aspect ratio, then scale it to fill.
function coverCropRect(
	srcWidth: number,
	srcHeight: number,
	targetWidth: number,
	targetHeight: number
): CropRect {
	const targetAspect = targetWidth / targetHeight;
	const srcAspect = srcWidth / srcHeight;

	if (srcAspect > targetAspect) {
		const sh = srcHeight;
		const sw = srcHeight * targetAspect;
		return { sx: (srcWidth - sw) / 2, sy: 0, sw, sh };
	}

	const sw = srcWidth;
	const sh = srcWidth / targetAspect;
	return { sx: 0, sy: (srcHeight - sh) / 2, sw, sh };
}

async function drawToJpeg(bitmap: ImageBitmap, crop: CropRect): Promise<Blob> {
	if (typeof OffscreenCanvas !== 'undefined') {
		const canvas = new OffscreenCanvas(CARD_WIDTH, CARD_HEIGHT);
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('2D canvas context unavailable');
		ctx.drawImage(bitmap, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, CARD_WIDTH, CARD_HEIGHT);
		return canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
	}

	const canvas = document.createElement('canvas');
	canvas.width = CARD_WIDTH;
	canvas.height = CARD_HEIGHT;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('2D canvas context unavailable');
	ctx.drawImage(bitmap, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, CARD_WIDTH, CARD_HEIGHT);

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
			'image/jpeg',
			JPEG_QUALITY
		);
	});
}

function toJpgName(name: string): string {
	return `${name.replace(/\.[^./\\]+$/, '')}.jpg`;
}
