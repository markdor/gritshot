import yauzl from 'yauzl';

const MB = 1024 * 1024;
const MAX_SIZE_MB = 5;
const MAX_ENTRIES = 1;
const MAX_TOTAL_UNCOMPRESSED_MB = 50;
const MAX_COMPRESSION_RATIO = 100;
const ALLOWED_EXTENSIONS = new Set(['.fit']);

function isZip(buf: Buffer): boolean {
	return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
}

/**
 * Validates a ZIP file for correct format, size limits, ZIP bombs, and malicious content.
 * Returns an error message string, or null if valid.
 *
 * Checks performed (without decompressing file contents):
 *  - Magic bytes (ZIP signature)
 *  - File size exceeds limit
 *  - Corrupted / non-ZIP data
 *  - Encrypted entries
 *  - Too many entries (> MAX_ENTRIES)
 *  - Total uncompressed size exceeds limit
 *  - Per-entry compression ratio exceeds limit (ZIP bomb indicator)
 *  - Path traversal in entry names ("../", absolute paths)
 *  - Null bytes in entry names
 *  - Disallowed file extensions (only .fit allowed)
 */
export function validateZip(buf: Buffer, size: number): Promise<string | null> {
	if (!isZip(buf)) {
		return Promise.resolve('File is not a valid ZIP file');
	}

	if (size > MAX_SIZE_MB * MB) {
		return Promise.resolve(`ZIP file must not exceed ${MAX_SIZE_MB} MB`);
	}

	return validateZipContents(buf);
}

function validateZipContents(buf: Buffer): Promise<string | null> {
	return new Promise((resolve) => {
		yauzl.fromBuffer(buf, { lazyEntries: true, strictFileNames: true }, (err, zipfile) => {
			if (err) {
				resolve('Invalid or corrupted ZIP file');
				return;
			}

			let entryCount = 0;
			let totalUncompressed = 0;

			zipfile.readEntry();

			zipfile.on('entry', (entry: yauzl.Entry) => {
				entryCount++;

				if (entryCount > MAX_ENTRIES) {
					zipfile.close();
					resolve(`ZIP contains too many entries (max ${MAX_ENTRIES})`);
					return;
				}

				const name = entry.fileName;

				// Encrypted entries
				if (entry.generalPurposeBitFlag & 0x1) {
					zipfile.close();
					resolve('ZIP contains encrypted entries');
					return;
				}

				// Null bytes in filename
				if (name.includes('\0')) {
					zipfile.close();
					resolve('ZIP entry contains invalid filename');
					return;
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
					resolve('ZIP entry contains path traversal');
					return;
				}

				// Skip directory entries
				if (name.endsWith('/')) {
					zipfile.readEntry();
					return;
				}

				// Extension allowlist
				const dotIndex = name.lastIndexOf('.');
				const ext = dotIndex !== -1 ? name.slice(dotIndex).toLowerCase() : '';
				if (!ALLOWED_EXTENSIONS.has(ext)) {
					zipfile.close();
					resolve(`ZIP contains disallowed file type: "${ext || '(no extension)'}"`);
					return;
				}

				// Uncompressed size accumulation
				totalUncompressed += entry.uncompressedSize;

				if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED_MB * MB) {
					zipfile.close();
					resolve(`ZIP uncompressed content exceeds ${MAX_TOTAL_UNCOMPRESSED_MB} MB`);
					return;
				}

				// Per-entry compression ratio (ZIP bomb indicator)
				if (
					entry.compressedSize > 0 &&
					entry.uncompressedSize / entry.compressedSize > MAX_COMPRESSION_RATIO
				) {
					zipfile.close();
					resolve('ZIP entry has suspicious compression ratio');
					return;
				}

				zipfile.readEntry();
			});

			zipfile.on('end', () => resolve(null));

			zipfile.on('error', () => resolve('Error reading ZIP file'));
		});
	});
}
