import { describe, it, expect, vi } from 'vitest';

// The crypto module reads GARMIN_TOKEN_KEY at import time. Stub the env
// before importing so tests run without depending on the host's .env.
vi.mock('$env/dynamic/private', () => ({
	env: {
		// Deterministic 32-byte key — only used in tests.
		GARMIN_TOKEN_KEY: Buffer.alloc(32, 0x42).toString('base64')
	}
}));

import { encryptToken, decryptToken } from './crypto';

describe('garmin/crypto', () => {
	it('roundtrips arbitrary utf-8 input', () => {
		const plain = JSON.stringify({ access_token: 'abc.def.ghi', refresh_token: 'xyz', n: 42 });
		expect(decryptToken(encryptToken(plain))).toBe(plain);
	});

	it('produces a different ciphertext on every call (random IV)', () => {
		const plain = 'same input';
		const a = encryptToken(plain);
		const b = encryptToken(plain);
		expect(a).not.toBe(b);
		expect(decryptToken(a)).toBe(plain);
		expect(decryptToken(b)).toBe(plain);
	});

	it('throws when the ciphertext body is tampered', () => {
		const ct = encryptToken('secret payload');
		const buf = Buffer.from(ct, 'base64');
		// Flip a bit in the encrypted body (after iv+tag = byte 28+).
		buf[buf.length - 1] ^= 0xff;
		expect(() => decryptToken(buf.toString('base64'))).toThrow();
	});

	it('throws when the auth tag is tampered', () => {
		const ct = encryptToken('secret payload');
		const buf = Buffer.from(ct, 'base64');
		// Flip a bit inside the auth tag (bytes 12..28).
		buf[20] ^= 0x01;
		expect(() => decryptToken(buf.toString('base64'))).toThrow();
	});

	it('throws on obviously truncated input', () => {
		expect(() => decryptToken(Buffer.alloc(8).toString('base64'))).toThrow(/too short/);
	});
});
