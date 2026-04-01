import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateJpeg } from './validate.js';

describe('validateJpeg', () => {
	it('returns an error for invalid-fileformat.jpg', () => {
		const buf = readFileSync(resolve('tests/fixtures/photos/invalid-fileformat.jpg'));

		const result = validateJpeg(buf);

		expect(result).toBe('Photo must be a valid JPEG file');
	});
});
