import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '$env/dynamic/private';

// Fail fast at module load — surfaces a missing/short key on container start
// rather than the first time a user tries to connect their Garmin account.
const KEY = Buffer.from(env.GARMIN_TOKEN_KEY ?? '', 'base64');
if (KEY.length !== 32) {
	throw new Error(
		'GARMIN_TOKEN_KEY must be a base64-encoded 32-byte key (set it in .env / .env.local)'
	);
}

const IV_LEN = 12;
const TAG_LEN = 16;

export function encryptToken(plain: string): string {
	const iv = randomBytes(IV_LEN);
	const cipher = createCipheriv('aes-256-gcm', KEY, iv);
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
	const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
