function isJpeg(buf: Buffer): boolean {
	return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

/**
 * Validates a JPEG file for correct format.
 * Returns an error message string, or null if valid.
 */
export function validateJpeg(buf: Buffer): string | null {
	if (!isJpeg(buf)) {
		return 'Photo must be a valid JPEG file';
	}

	return null;
}
