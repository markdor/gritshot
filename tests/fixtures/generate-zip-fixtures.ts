// tests/fixtures/generate-zip-fixtures.ts
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const FIXTURES_DIR = path.join('tests', 'fixtures', 'zip');

async function createZipWithRatio(filename: string, uncompressedMB: number) {
	// Highly compressible content: repeated bytes (like real zip bombs)
	const uncompressedBytes = uncompressedMB * 1024 * 1024;
	const payload = Buffer.alloc(uncompressedBytes, 0x00); // null bytes = maximum compression

	return new Promise<void>((resolve, reject) => {
		const output = fs.createWriteStream(path.join(FIXTURES_DIR, filename));
		const archive = archiver('zip', { zlib: { level: 9 } });

		archive.pipe(output);
		archive.append(payload, { name: 'payload.fit' });
		archive.finalize();

		output.on('close', resolve);
		archive.on('error', reject);
	});
}

function exists(filename: string): boolean {
	return fs.existsSync(path.join(FIXTURES_DIR, filename));
}

async function main() {
	fs.mkdirSync(FIXTURES_DIR, { recursive: true });

	// ✅ Legitimate ZIP with real FIT files
	// → stored as real file in repo: tests/fixtures/zip/valid.zip

	// 💣 Ratio bomb: small ZIP, exploding uncompressed size
	if (!exists('ratio-bomb.zip')) await createZipWithRatio('ratio-bomb.zip', 50); // > MAX_COMPRESSION_RATIO

	// 💣 Size bomb: uncompressed size exceeds absolute limit
	if (!exists('size-bomb.zip')) await createZipWithRatio('size-bomb.zip', 200); // > MAX_UNCOMPRESSED_SIZE (200 MB)

	// 💣 Path traversal
	if (!exists('path-traversal.zip')) {
		const traversalZip = path.join(FIXTURES_DIR, 'path-traversal.zip');
		const archive = archiver('zip');
		archive.pipe(fs.createWriteStream(traversalZip));
		archive.append(Buffer.from('malicious'), { name: '../../../etc/passwd' });
		await new Promise<void>((r) => {
			archive.finalize();
			archive.on('close', r);
		});
	}

	// 💣 Forbidden file extension
	if (!exists('bad-extension.zip')) {
		const extZip = path.join(FIXTURES_DIR, 'bad-extension.zip');
		const archive2 = archiver('zip');
		archive2.pipe(fs.createWriteStream(extZip));
		archive2.append(Buffer.from('#!/bin/bash'), { name: 'script.sh' });
		await new Promise<void>((r) => {
			archive2.finalize();
			archive2.on('close', r);
		});
	}

	// 💣 Fake magic bytes (not a real ZIP)
	if (!exists('fake-magic.zip')) {
		fs.writeFileSync(
			path.join(FIXTURES_DIR, 'fake-magic.zip'),
			Buffer.concat([Buffer.from([0xff, 0xfe, 0x00, 0x00]), Buffer.from('not a zip')])
		);
	}

	// 💣 Corrupt ZIP: valid magic bytes but broken content
	if (!exists('corrupt.zip')) {
		fs.writeFileSync(
			path.join(FIXTURES_DIR, 'corrupt.zip'),
			Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('CORRUPT_GARBAGE')])
		);
	}

	// 💣 Encrypted ZIP: generalPurposeBitFlag bit 0 set
	if (!exists('encrypted.zip')) {
		// Minimal valid ZIP, manually constructed, with encryption bit set.
		// yauzl checks for stored+encrypted: compressedSize = uncompressedSize + 12 (encryption header).
		// uncompressedSize=4, compressedSize=16 (4+12).
		// Local file header: 30 header + 8 name + 16 data = 54 bytes (offset 0x00)
		// Central directory:  46 header + 8 name          = 54 bytes (offset 0x36)
		// EOCD:                                              22 bytes (offset 0x6c)
		const buf = Buffer.from([
			// Local file header (offset 0x00)
			0x50,
			0x4b,
			0x03,
			0x04, // signature
			0x14,
			0x00, // version needed: 2.0
			0x01,
			0x00, // general purpose bit flag: bit 0 = encrypted
			0x00,
			0x00, // compression: stored
			0x00,
			0x00, // mod time
			0x00,
			0x00, // mod date
			0x00,
			0x00,
			0x00,
			0x00, // CRC-32
			0x10,
			0x00,
			0x00,
			0x00, // compressed size: 16 (= 4 uncompressed + 12 encryption header)
			0x04,
			0x00,
			0x00,
			0x00, // uncompressed size: 4
			0x08,
			0x00, // filename length: 8
			0x00,
			0x00, // extra field length: 0
			0x74,
			0x65,
			0x73,
			0x74,
			0x2e,
			0x66,
			0x69,
			0x74, // "test.fit"
			0x00,
			0x00,
			0x00,
			0x00,
			0x00,
			0x00,
			0x00,
			0x00, // encryption header (12 bytes)
			0x00,
			0x00,
			0x00,
			0x00,
			0x00,
			0x00,
			0x00,
			0x00, // + encrypted data (4 bytes)
			// Central directory (offset 0x36 = 54)
			0x50,
			0x4b,
			0x01,
			0x02, // signature
			0x14,
			0x00, // version made by
			0x14,
			0x00, // version needed
			0x01,
			0x00, // general purpose bit flag: bit 0 = encrypted
			0x00,
			0x00, // compression: stored
			0x00,
			0x00, // mod time
			0x00,
			0x00, // mod date
			0x00,
			0x00,
			0x00,
			0x00, // CRC-32
			0x10,
			0x00,
			0x00,
			0x00, // compressed size: 16
			0x04,
			0x00,
			0x00,
			0x00, // uncompressed size: 4
			0x08,
			0x00, // filename length: 8
			0x00,
			0x00, // extra field length: 0
			0x00,
			0x00, // file comment length: 0
			0x00,
			0x00, // disk number start: 0
			0x00,
			0x00, // internal file attributes
			0x00,
			0x00,
			0x00,
			0x00, // external file attributes
			0x00,
			0x00,
			0x00,
			0x00, // local header offset: 0
			0x74,
			0x65,
			0x73,
			0x74,
			0x2e,
			0x66,
			0x69,
			0x74, // "test.fit"
			// End of central directory (offset 0x6c = 108)
			0x50,
			0x4b,
			0x05,
			0x06, // signature
			0x00,
			0x00, // disk number: 0
			0x00,
			0x00, // disk with start of CD: 0
			0x01,
			0x00, // entries on this disk: 1
			0x01,
			0x00, // total entries: 1
			0x36,
			0x00,
			0x00,
			0x00, // CD size: 54
			0x36,
			0x00,
			0x00,
			0x00, // CD offset: 54
			0x00,
			0x00 // comment length: 0
		]);
		fs.writeFileSync(path.join(FIXTURES_DIR, 'encrypted.zip'), buf);
	}

	// 💣 Suspicious compression ratio (per entry): uncompressedSize=10MB, compressedSize=1000
	// → ratio 10485 > MAX_COMPRESSION_RATIO (100), but totalUncompressed < 20MB (size check comes first).
	// compressionMethod=8 (deflate) required: yauzl's validateEntrySizes only triggers for method=0 (stored).
	// Local file header: 30 + 8 (name) + 1000 (data) = 1038 bytes (offset 0x00)
	// Central dir:       46 + 8 (name)               =   54 bytes (offset 0x0000040E = 1038)
	// EOCD:                                               22 bytes (offset 0x00000444 = 1092)
	if (!exists('ratio-entry.zip')) {
		const filenameBytes = Buffer.from('test.fit'); // 8 bytes
		const compressedSize = 1000;
		// uncompressedSize = 10 * 1024 * 1024 = 10 MB → 0x00A00000 in header bytes
		const fileData = Buffer.alloc(compressedSize, 0x00);
		const cdOffset = 30 + 8 + compressedSize; // 1038

		const localHeader = Buffer.from([
			0x50,
			0x4b,
			0x03,
			0x04, // signature
			0x14,
			0x00, // version needed: 2.0
			0x00,
			0x00, // general purpose bit flag
			0x08,
			0x00, // compression: deflate (8)
			0x00,
			0x00, // mod time
			0x00,
			0x00, // mod date
			0x00,
			0x00,
			0x00,
			0x00, // CRC-32
			0xe8,
			0x03,
			0x00,
			0x00, // compressedSize: 1000 (0x3E8)
			0x00,
			0x00,
			0xa0,
			0x00, // uncompressedSize: 10MB (0xA00000)
			0x08,
			0x00, // filename length: 8
			0x00,
			0x00 // extra field length: 0
		]);

		const centralDir = Buffer.from([
			0x50,
			0x4b,
			0x01,
			0x02, // signature
			0x14,
			0x00, // version made by
			0x14,
			0x00, // version needed
			0x00,
			0x00, // general purpose bit flag
			0x08,
			0x00, // compression: deflate (8)
			0x00,
			0x00, // mod time
			0x00,
			0x00, // mod date
			0x00,
			0x00,
			0x00,
			0x00, // CRC-32
			0xe8,
			0x03,
			0x00,
			0x00, // compressedSize: 1000
			0x00,
			0x00,
			0xa0,
			0x00, // uncompressedSize: 10MB
			0x08,
			0x00, // filename length: 8
			0x00,
			0x00, // extra field length: 0
			0x00,
			0x00, // file comment length: 0
			0x00,
			0x00, // disk number start: 0
			0x00,
			0x00, // internal file attributes
			0x00,
			0x00,
			0x00,
			0x00, // external file attributes
			0x00,
			0x00,
			0x00,
			0x00 // local header offset: 0
		]);

		// cdSize = 46 + 8 = 54 → used in eocd as cd size bytes below
		const eocd = Buffer.from([
			0x50,
			0x4b,
			0x05,
			0x06, // signature
			0x00,
			0x00, // disk number: 0
			0x00,
			0x00, // disk with start of CD: 0
			0x01,
			0x00, // entries on this disk: 1
			0x01,
			0x00, // total entries: 1
			0x36,
			0x00,
			0x00,
			0x00, // CD size: 54
			// CD offset: 1038 = 0x0000040E
			cdOffset & 0xff,
			(cdOffset >> 8) & 0xff,
			(cdOffset >> 16) & 0xff,
			(cdOffset >> 24) & 0xff,
			0x00,
			0x00 // comment length: 0
		]);

		const buf = Buffer.concat([
			localHeader,
			filenameBytes,
			fileData,
			centralDir,
			filenameBytes,
			eocd
		]);
		fs.writeFileSync(path.join(FIXTURES_DIR, 'ratio-entry.zip'), buf);
	}

	// 💣 Path traversal: "test..fit" (9 bytes) — ".." as substring, not a path segment,
	// passes yauzl's validateFileName (split("/").indexOf("..") === -1),
	// but caught by our name.includes('..') check.
	// Local header: 30 + 9 + 4 = 43 bytes (offset 0x00)
	// Central dir:  46 + 9     = 55 bytes (offset 0x2b = 43)
	// EOCD:                      22 bytes (offset 0x62 = 98)
	if (!exists('path-traversal-substring.zip')) {
		const filename = [0x74, 0x65, 0x73, 0x74, 0x2e, 0x2e, 0x66, 0x69, 0x74]; // "test..fit"
		const buf = Buffer.from([
			// Local file header (offset 0x00)
			0x50,
			0x4b,
			0x03,
			0x04, // signature
			0x14,
			0x00, // version needed: 2.0
			0x00,
			0x00, // general purpose bit flag
			0x00,
			0x00, // compression: stored
			0x00,
			0x00, // mod time
			0x00,
			0x00, // mod date
			0x00,
			0x00,
			0x00,
			0x00, // CRC-32
			0x04,
			0x00,
			0x00,
			0x00, // compressed size: 4
			0x04,
			0x00,
			0x00,
			0x00, // uncompressed size: 4
			0x09,
			0x00, // filename length: 9
			0x00,
			0x00, // extra field length: 0
			...filename, // "test..fit"
			0x00,
			0x00,
			0x00,
			0x00, // file data (4 bytes)
			// Central directory (offset 0x2b = 43)
			0x50,
			0x4b,
			0x01,
			0x02, // signature
			0x14,
			0x00, // version made by
			0x14,
			0x00, // version needed
			0x00,
			0x00, // general purpose bit flag
			0x00,
			0x00, // compression: stored
			0x00,
			0x00, // mod time
			0x00,
			0x00, // mod date
			0x00,
			0x00,
			0x00,
			0x00, // CRC-32
			0x04,
			0x00,
			0x00,
			0x00, // compressed size: 4
			0x04,
			0x00,
			0x00,
			0x00, // uncompressed size: 4
			0x09,
			0x00, // filename length: 9
			0x00,
			0x00, // extra field length: 0
			0x00,
			0x00, // file comment length: 0
			0x00,
			0x00, // disk number start: 0
			0x00,
			0x00, // internal file attributes
			0x00,
			0x00,
			0x00,
			0x00, // external file attributes
			0x00,
			0x00,
			0x00,
			0x00, // local header offset: 0
			...filename, // "test..fit"
			// End of central directory (offset 0x62 = 98)
			0x50,
			0x4b,
			0x05,
			0x06, // signature
			0x00,
			0x00, // disk number: 0
			0x00,
			0x00, // disk with start of CD: 0
			0x01,
			0x00, // entries on this disk: 1
			0x01,
			0x00, // total entries: 1
			0x37,
			0x00,
			0x00,
			0x00, // CD size: 55
			0x2b,
			0x00,
			0x00,
			0x00, // CD offset: 43
			0x00,
			0x00 // comment length: 0
		]);
		fs.writeFileSync(path.join(FIXTURES_DIR, 'path-traversal-substring.zip'), buf);
	}

	// 💣 Null byte in filename (e.g. "test\0.fit", 9 bytes)
	// Local header: 30 + 9 + 4 = 43 bytes (offset 0x00)
	// Central dir:  46 + 9     = 55 bytes (offset 0x2b)
	// EOCD:                      22 bytes (offset 0x62)
	if (!exists('null-byte-filename.zip')) {
		const nullByteFilename = [0x74, 0x65, 0x73, 0x74, 0x00, 0x2e, 0x66, 0x69, 0x74]; // "test\0.fit"
		const buf = Buffer.from([
			// Local file header (offset 0x00)
			0x50,
			0x4b,
			0x03,
			0x04, // signature
			0x14,
			0x00, // version needed: 2.0
			0x00,
			0x00, // general purpose bit flag
			0x00,
			0x00, // compression: stored
			0x00,
			0x00, // mod time
			0x00,
			0x00, // mod date
			0x00,
			0x00,
			0x00,
			0x00, // CRC-32
			0x04,
			0x00,
			0x00,
			0x00, // compressed size: 4
			0x04,
			0x00,
			0x00,
			0x00, // uncompressed size: 4
			0x09,
			0x00, // filename length: 9
			0x00,
			0x00, // extra field length: 0
			...nullByteFilename, // "test\0.fit"
			0x00,
			0x00,
			0x00,
			0x00, // file data (4 bytes)
			// Central directory (offset 0x2b = 43)
			0x50,
			0x4b,
			0x01,
			0x02, // signature
			0x14,
			0x00, // version made by
			0x14,
			0x00, // version needed
			0x00,
			0x00, // general purpose bit flag
			0x00,
			0x00, // compression: stored
			0x00,
			0x00, // mod time
			0x00,
			0x00, // mod date
			0x00,
			0x00,
			0x00,
			0x00, // CRC-32
			0x04,
			0x00,
			0x00,
			0x00, // compressed size: 4
			0x04,
			0x00,
			0x00,
			0x00, // uncompressed size: 4
			0x09,
			0x00, // filename length: 9
			0x00,
			0x00, // extra field length: 0
			0x00,
			0x00, // file comment length: 0
			0x00,
			0x00, // disk number start: 0
			0x00,
			0x00, // internal file attributes
			0x00,
			0x00,
			0x00,
			0x00, // external file attributes
			0x00,
			0x00,
			0x00,
			0x00, // local header offset: 0
			...nullByteFilename, // "test\0.fit"
			// End of central directory (offset 0x62 = 98)
			0x50,
			0x4b,
			0x05,
			0x06, // signature
			0x00,
			0x00, // disk number: 0
			0x00,
			0x00, // disk with start of CD: 0
			0x01,
			0x00, // entries on this disk: 1
			0x01,
			0x00, // total entries: 1
			0x37,
			0x00,
			0x00,
			0x00, // CD size: 55
			0x2b,
			0x00,
			0x00,
			0x00, // CD offset: 43
			0x00,
			0x00 // comment length: 0
		]);
		fs.writeFileSync(path.join(FIXTURES_DIR, 'null-byte-filename.zip'), buf);
	}

	// 💣 Directory entry
	if (!exists('directory-entry.zip')) {
		const dirZip = archiver('zip');
		dirZip.pipe(fs.createWriteStream(path.join(FIXTURES_DIR, 'directory-entry.zip')));
		dirZip.append(Buffer.alloc(0), { name: 'subdir/' });
		await new Promise<void>((r) => {
			dirZip.finalize();
			dirZip.on('close', r);
		});
	}

	// 💣 Too many files
	if (!exists('too-many-files.zip')) {
		const manyFilesZip = archiver('zip');
		manyFilesZip.pipe(fs.createWriteStream(path.join(FIXTURES_DIR, 'too-many-files.zip')));
		for (let i = 0; i < 100; i++) {
			manyFilesZip.append(Buffer.from('data'), { name: `file-${i}.fit` });
		}
		await new Promise<void>((r) => {
			manyFilesZip.finalize();
			manyFilesZip.on('close', r);
		});
	}

	console.log('Fixtures generated.');
}

main();
