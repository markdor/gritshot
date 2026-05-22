import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

const IV_LEN = 12;
const TAG_LEN = 16;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
	if (cachedKey) return cachedKey;
	const k = Buffer.from(env.GARMIN_TOKEN_KEY ?? '', 'base64');
	if (k.length !== 32) {
		throw new Error(
			'GARMIN_TOKEN_KEY must be a base64-encoded 32-byte key (set it in .env / .env.local)'
		);
	}
	cachedKey = k;
	return k;
}

// Fail fast at server start — surfaces a missing/short key on container start
// rather than the first time a user tries to connect their Garmin account.
// Skipped during SvelteKit's prerender/analyse step, which eager-loads server
// modules at build time but never reaches encrypt/decrypt.
if (!building) {
	getKey();
}

export function encryptToken(plain: string): string {
	const iv = randomBytes(IV_LEN);
	const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
	const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
	return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString('base64');
}

export function decryptToken(b64: string): string {
	const buf = Buffer.from(b64, 'base64');
	if (buf.length < IV_LEN + TAG_LEN) {
		throw new Error('ciphertext too short');
	}
	const iv = buf.subarray(0, IV_LEN);
	const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
	const enc = buf.subarray(IV_LEN + TAG_LEN);
	const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
