// src/lib/server/zip/validator.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { validateZip } from './validate';

const fixture = (name: string) => fs.readFileSync(path.join('tests', 'fixtures', 'zip', name));

describe('validateZip', () => {
	it('akzeptiert ein valides ZIP mit FIT-Dateien', async () => {
		const result = await validateZip(fixture('valid.zip'));
		expect(result).toBeNull();
	});

	it('lehnt verdächtige Compression Ratio ab', async () => {
		await expect(async () => validateZip(fixture('ratio-bomb.zip'))).rejects.toThrow(
			'ZIP uncompressed content exceeds 20 MB'
		);
	});

	it('lehnt überschrittene unkomprimierte Gesamtgröße ab', async () => {
		await expect(async () => validateZip(fixture('size-bomb.zip'))).rejects.toThrow(
			'ZIP uncompressed content exceeds 20 MB'
		);
	});

	it('erkennt Path Traversal', async () => {
		await expect(async () => validateZip(fixture('path-traversal.zip'))).rejects.toThrow(
			'ZIP contains disallowed file type:'
		);
	});

	it('lehnt verbotene Dateierweiterungen ab', async () => {
		await expect(async () => validateZip(fixture('bad-extension.zip'))).rejects.toThrow(
			'ZIP contains disallowed file type: ".sh"'
		);
	});

	it('lehnt zu viele Dateien ab', async () => {
		await expect(async () => validateZip(fixture('too-many-files.zip'))).rejects.toThrow(
			'ZIP contains too many entries (max 1)'
		);
	});

	it('lehnt fehlende Magic Bytes ab', async () => {
		await expect(async () => validateZip(fixture('fake-magic.zip'))).rejects.toThrow(
			'The ZIP magic bytes are missing or invalid.'
		);
	});

	it('lehnt korruptes ZIP mit validen Magic Bytes ab', async () => {
		await expect(async () => validateZip(fixture('corrupt.zip'))).rejects.toThrow(
			'Invalid or corrupted ZIP file'
		);
	});

	it('lehnt verschlüsselte Einträge ab', async () => {
		await expect(async () => validateZip(fixture('encrypted.zip'))).rejects.toThrow(
			'ZIP contains encrypted entries'
		);
	});

	it('lehnt verdächtige Compression Ratio eines Eintrags ab', async () => {
		await expect(async () => validateZip(fixture('ratio-entry.zip'))).rejects.toThrow(
			'ZIP entry has suspicious compression ratio'
		);
	});

	it('lehnt Path Traversal im Dateinamen ab', async () => {
		await expect(async () => validateZip(fixture('path-traversal-substring.zip'))).rejects.toThrow(
			'ZIP entry contains path traversal'
		);
	});

	it('lehnt Null-Byte im Dateinamen ab', async () => {
		await expect(async () => validateZip(fixture('null-byte-filename.zip'))).rejects.toThrow(
			'ZIP entry contains invalid filename'
		);
	});

	it('lehnt Verzeichniseinträge ab', async () => {
		await expect(async () => validateZip(fixture('directory-entry.zip'))).rejects.toThrow(
			'ZIP contains directory entries'
		);
	});
});
