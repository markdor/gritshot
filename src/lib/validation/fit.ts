function isFit(buf: Buffer): boolean {
	// FIT header: bytes 8–11 must be ".FIT"
	return (
		buf.length >= 12 && buf[8] === 0x2e && buf[9] === 0x46 && buf[10] === 0x49 && buf[11] === 0x54
	);
}

/**
 * Validates a FIT file for correct format.
 * Returns an error message string, or null if valid.
 */
export function validateFit(buf: Buffer): string | null {
	if (!isFit(buf)) {
		return 'File is not a valid FIT file';
	}

	return null;
}
