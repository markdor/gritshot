import { eq } from 'drizzle-orm';
import { GarminConnect } from 'garmin-connect';
import type { IGarminTokens } from 'garmin-connect/dist/garmin/types';
import { db } from '$lib/server/db';
import { garminConnection } from '$lib/server/db/schema';
import { logger } from '$lib/server/logger';
import { encryptToken, decryptToken } from './crypto';
import { GarminAuthError, GarminNetworkError, GarminNotConnectedError } from './errors';

function isAuthFailure(err: unknown): boolean {
	// The library throws plain Errors with a JSON-ish message body from axios.
	// 401 / 403 → bad credentials. The message also contains the status.
	const msg = err instanceof Error ? err.message : String(err);
	return /\((401|403)\)/.test(msg) || /invalid.*credentials/i.test(msg);
}

function persistTokens(userId: string, tokens: IGarminTokens, isInsert: boolean): void {
	const now = new Date();
	const oauth1 = encryptToken(JSON.stringify(tokens.oauth1));
	const oauth2 = encryptToken(JSON.stringify(tokens.oauth2));

	if (isInsert) {
		db.insert(garminConnection)
			.values({
				userId,
				oauth1Token: oauth1,
				oauth2Token: oauth2,
				connectedAt: now,
				lastRefreshedAt: now
			})
			.onConflictDoUpdate({
				target: garminConnection.userId,
				set: { oauth1Token: oauth1, oauth2Token: oauth2, connectedAt: now, lastRefreshedAt: now }
			})
			.run();
	} else {
		db.update(garminConnection)
			.set({ oauth1Token: oauth1, oauth2Token: oauth2, lastRefreshedAt: now })
			.where(eq(garminConnection.userId, userId))
			.run();
	}
}

export async function loginAndStore(
	userId: string,
	email: string,
	password: string
): Promise<void> {
	const client = new GarminConnect({ username: email, password });
	try {
		await client.login(email, password);
	} catch (err) {
		if (isAuthFailure(err)) {
			throw new GarminAuthError('Garmin rejected credentials');
		}
		throw new GarminNetworkError('Garmin login failed', err);
	}

	const tokens = client.exportToken();
	persistTokens(userId, tokens, true);
	logger.info({ userId }, 'garmin connection established');
}

export async function withGarminClient<T>(
	userId: string,
	fn: (client: GarminConnect) => Promise<T>
): Promise<T> {
	const row = db.select().from(garminConnection).where(eq(garminConnection.userId, userId)).get();
	if (!row) throw new GarminNotConnectedError();

	const oauth1 = JSON.parse(decryptToken(row.oauth1Token));
	const oauth2 = JSON.parse(decryptToken(row.oauth2Token));

	const client = new GarminConnect({ username: '', password: '' });
	client.loadToken(oauth1, oauth2);

	let result: T;
	try {
		result = await fn(client);
	} catch (err) {
		if (isAuthFailure(err)) {
			throw new GarminAuthError('Garmin tokens rejected — reconnect required');
		}
		throw new GarminNetworkError('Garmin request failed', err);
	}

	// Last-write-wins on concurrent refresh — harmless because refreshes use
	// the same source-of-truth refresh token, and the library refreshes oauth2
	// internally when expired. Re-export captures any change.
	try {
		persistTokens(userId, client.exportToken(), false);
	} catch (err) {
		logger.warn({ err, userId }, 'failed to persist refreshed garmin tokens');
	}

	return result;
}

export function disconnect(userId: string): void {
	db.delete(garminConnection).where(eq(garminConnection.userId, userId)).run();
}

export function hasGarminConnection(userId: string): boolean {
	const row = db
		.select({ userId: garminConnection.userId })
		.from(garminConnection)
		.where(eq(garminConnection.userId, userId))
		.get();
	return !!row;
}
