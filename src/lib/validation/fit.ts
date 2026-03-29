const MB = 1024 * 1024;
const MAX_SIZE_MB = 5;

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

/**
 * Validates a FIT file for correct format and size limits.
 * Returns an error message string, or null if valid.
 */
export function validateFit(buf: Buffer, size: number): string | null {
	if (!isFit(buf)) {
		return 'File is not a valid FIT file';
	}

	if (size > MAX_SIZE_MB * MB) {
		return `FIT file must not exceed ${MAX_SIZE_MB} MB`;
	}

	return null;
}
