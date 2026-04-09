import yauzl from 'yauzl';
import { FileValidationError } from '$lib/server/FileValidationError';

const MB = 1024 * 1024;
const MAX_ENTRIES = 1;
const MAX_TOTAL_UNCOMPRESSED_MB = 20;
const MAX_COMPRESSION_RATIO = 100;
const ALLOWED_EXTENSIONS = new Set(['.fit']);

function isZip(buf: Buffer): boolean {
	return (
		buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04
	);
}

/**
 * Validates a ZIP file for correct format, size limits, ZIP bombs, and malicious content.
 * Returns an error message string, or null if valid.
 *
 * Checks performed (without decompressing file contents):
 *  - Magic bytes (ZIP signature)
 *  - Corrupted / non-ZIP data
 *  - Encrypted entries
 *  - Too many entries (> MAX_ENTRIES)
 *  - Total uncompressed size exceeds limit
 *  - Per-entry compression ratio exceeds limit (ZIP bomb indicator)
 *  - Path traversal in entry names ("../", absolute paths)
 *  - Null bytes in entry names
 *  - Disallowed file extensions (only .fit allowed)
 */
export function validateZip(buf: Buffer): Promise<null> {
	if (!isZip(buf)) {
		throw new FileValidationError(
			'The ZIP magic bytes are missing or invalid.',
			'File is not a valid ZIP file'
		);
	}

	return validateZipContents(buf);
}

function validateZipContents(buf: Buffer): Promise<null> {
	return new Promise<null>((resolve, reject) => {
		yauzl.fromBuffer(buf, { lazyEntries: true, strictFileNames: true }, (err, zipfile) => {
			if (err) {
				return reject(
					new FileValidationError('Invalid or corrupted ZIP file', 'File is not a valid ZIP file')
				);
			}

			let entryCount = 0;
			let totalUncompressed = 0;

			zipfile.readEntry();

			zipfile.on('entry', (entry: yauzl.Entry) => {
				entryCount++;

				if (entryCount > MAX_ENTRIES) {
					zipfile.close();
					return reject(
						new FileValidationError(
							`ZIP contains too many entries (max ${MAX_ENTRIES})`,
							'File is not a valid ZIP file'
						)
					);
				}

				const name = entry.fileName;

				// Encrypted entries
				if (entry.generalPurposeBitFlag & 0x1) {
					zipfile.close();
					return reject(
						new FileValidationError(
							'ZIP contains encrypted entries',
							'File is not a valid ZIP file'
						)
					);
				}

				// Null bytes in filename
				if (name.includes('\0')) {
					zipfile.close();
					return reject(
						new FileValidationError(
							'ZIP entry contains invalid filename',
							'File is not a valid ZIP file'
						)
					);
				}

				// Path traversal and absolute paths
				if (
					name.includes('..') ||
					name.startsWith('/') ||
					name.startsWith('\\') ||
					name.includes('\\..') ||
					name.includes('/..')
				) {
					zipfile.close();
					return reject(
						new FileValidationError(
							'ZIP entry contains path traversal',
							'File is not a valid ZIP file'
						)
					);
				}

				// Reject directory entries
				if (name.endsWith('/')) {
					zipfile.close();
					return reject(
						new FileValidationError(
							'ZIP contains directory entries',
							'File is not a valid ZIP file'
						)
					);
				}

				// Extension allowlist
				const dotIndex = name.lastIndexOf('.');
				const ext = dotIndex !== -1 ? name.slice(dotIndex).toLowerCase() : '';
				if (!ALLOWED_EXTENSIONS.has(ext)) {
					zipfile.close();
					return reject(
						new FileValidationError(
							`ZIP contains disallowed file type: "${ext || '(no extension)'}"`,
							'File is not a valid ZIP file'
						)
					);
				}

				// Uncompressed size accumulation
				totalUncompressed += entry.uncompressedSize;

				if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED_MB * MB) {
					zipfile.close();
					return reject(
						new FileValidationError(
							`ZIP uncompressed content exceeds ${MAX_TOTAL_UNCOMPRESSED_MB} MB`,
							'File is not a valid ZIP file'
						)
					);
				}

				// Per-entry compression ratio (ZIP bomb indicator)
				if (
					entry.compressedSize > 0 &&
					entry.uncompressedSize / entry.compressedSize > MAX_COMPRESSION_RATIO
				) {
					zipfile.close();
					return reject(
						new FileValidationError(
							'ZIP entry has suspicious compression ratio',
							'File is not a valid ZIP file'
						)
					);
				}

				zipfile.readEntry();
			});

			zipfile.on('end', () => resolve(null));

			zipfile.on('error', () => {
				reject(new FileValidationError('Error reading ZIP file', 'File is not a valid ZIP file'));
			});
		});
	});
}
