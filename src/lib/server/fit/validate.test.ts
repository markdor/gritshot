import { describe, it, expect } from 'vitest';
import { validateFit } from './validate.js';

describe('validateFit', () => {
	it('returns an error for an invalid FIT file', () => {
		// 12 bytes with wrong magic bytes at positions 8–11
		const invalidFit = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0x00, 0x00, 0x00, 0x00]);

		const result = validateFit(invalidFit);

		expect(result).toBe('File is not a valid FIT file');
	});
});
