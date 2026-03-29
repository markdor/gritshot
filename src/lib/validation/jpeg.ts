const MB = 1024 * 1024;
const MAX_SIZE_MB = 10;

function isJpeg(buf: Buffer): boolean {
	return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

/**
 * Validates a JPEG file for correct format and size limits.
 * Returns an error message string, or null if valid.
 */
export function validateJpeg(buf: Buffer, size: number): string | null {
	if (!isJpeg(buf)) {
		return 'Photo must be a valid JPEG file';
	}

	if (size > MAX_SIZE_MB * MB) {
		return `Photo must not exceed ${MAX_SIZE_MB} MB`;
	}

	return null;
}
