import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateJpeg } from './validate.js';

describe('validateJpeg', () => {
	it('throws for invalid-fileformat.jpg', () => {
		const buf = readFileSync(resolve('tests/fixtures/photos/invalid-fileformat.jpg'));

		expect(() => validateJpeg(buf)).toThrow('The JPG magic bytes are missing or invalid.');
	});
});
