import { FileValidationError } from '$lib/server/FileValidationError';
import { m } from '$lib/paraglide/messages';

function isFit(buf: Buffer): boolean {
	// FIT header: bytes 8–11 must be ".FIT"
	return (
		buf.length >= 12 && buf[8] === 0x2e && buf[9] === 0x46 && buf[10] === 0x49 && buf[11] === 0x54
	);
}

export function validateFit(buf: Buffer): void {
	if (!isFit(buf)) {
		throw new FileValidationError(
			'The FIT magic bytes are missing or invalid.',
			m.error_invalid_fit()
		);
	}
}
