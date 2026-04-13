import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ZipProcessor } from './process.js';

const fixture = (name: string) => fs.readFileSync(path.join('tests', 'fixtures', 'zip', name));

describe('ZipProcessor.extract', () => {
	it('extracts the FIT file from a valid ZIP', async () => {
		const result = await new ZipProcessor().extract(fixture('valid.zip'));

		expect(result.name).toMatch(/\.fit$/i);
		expect(result.content).toBeInstanceOf(Buffer);
		expect(result.content.length).toBeGreaterThan(0);
	});

	it('rejects when the ZIP is corrupted', async () => {
		await expect(new ZipProcessor().extract(fixture('corrupt.zip'))).rejects.toThrow(
			'Invalid or corrupted ZIP file'
		);
	});

	it('rejects when the ZIP contains no FIT file', async () => {
		// bad-extension.zip contains script.sh — no .fit entry
		await expect(new ZipProcessor().extract(fixture('bad-extension.zip'))).rejects.toThrow(
			'ZIP contains no .fit file'
		);
	});

	it('rejects when the ZIP contains more than one FIT file', async () => {
		// too-many-files.zip contains 100 .fit entries
		await expect(new ZipProcessor().extract(fixture('too-many-files.zip'))).rejects.toThrow(
			'ZIP contains more than one .fit file'
		);
	});
});
