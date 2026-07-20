import { describe, it, expect, vi, beforeEach } from 'vitest';

// crypto.ts reads the key at import time — stub the env so tests don't depend
// on the host's .env. (Same fixed test key as crypto.test.ts.)
vi.mock('$env/dynamic/private', () => ({
	env: { GARMIN_TOKEN_KEY: Buffer.alloc(32, 0x42).toString('base64') }
}));
vi.mock('$lib/server/logger', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

// One-row fake DB: client.ts only ever touches a single user's row in any
// given call, so a singleton store is enough. The eq() condition is opaque
// (drizzle returns an SQL expression object) — we trust the production code
// targets the right user and only assert observable behavior.
const store = {
	row: null as null | {
		userId: string;
		oauth1Token: string;
		oauth2Token: string;
		connectedAt: Date;
		lastRefreshedAt: Date;
	}
};

vi.mock('$lib/server/db', () => ({
	db: {
		insert: () => ({
			values: (v: unknown) => ({
				onConflictDoUpdate: () => ({
					run: () => {
						store.row = { ...(v as typeof store.row & object) } as typeof store.row;
					}
				})
			})
		}),
		update: () => ({
			set: (s: unknown) => ({
				where: () => ({
					run: () => {
						if (store.row)
							store.row = { ...store.row, ...(s as Partial<NonNullable<typeof store.row>>) };
					}
				})
			})
		}),
		delete: () => ({
			where: () => ({ run: () => (store.row = null) })
		}),
		select: () => ({
			from: () => ({
				where: () => ({ get: () => store.row ?? undefined })
			})
		})
	}
}));

// Stub the garmin-connect package — we don't want real HTTP and we want to
// control which branch of the auth/network mapping is exercised.
const garminMock = {
	loginImpl: vi.fn<(u: string, p: string) => Promise<void>>().mockResolvedValue(),
	loadTokenImpl: vi.fn(),
	exportTokenImpl: vi.fn(() => ({
		oauth1: { oauth_token: 'o1', oauth_token_secret: 'o1s' },
		oauth2: { access_token: 'a', refresh_token: 'r', expires_at: 1, expires_in: 1 }
	}))
};

vi.mock('garmin-connect', () => ({
	GarminConnect: class {
		client = { get: vi.fn() };
		async login(u: string, p: string) {
			await garminMock.loginImpl(u, p);
		}
		loadToken(o1: unknown, o2: unknown) {
			garminMock.loadTokenImpl(o1, o2);
		}
		exportToken() {
			return garminMock.exportTokenImpl();
		}
	}
}));

import { loginAndStore, withGarminClient, disconnect, hasGarminConnection } from './client';
import { GarminAuthError, GarminNetworkError, GarminNotConnectedError } from './errors';
import { decryptToken } from './crypto';

function resetMocks() {
	store.row = null;
	garminMock.loginImpl.mockReset().mockResolvedValue();
	garminMock.loadTokenImpl.mockReset();
	garminMock.exportTokenImpl.mockReset().mockReturnValue({
		oauth1: { oauth_token: 'o1', oauth_token_secret: 'o1s' },
		oauth2: { access_token: 'a', refresh_token: 'r', expires_at: 1, expires_in: 1 }
	});
}

describe('loginAndStore', () => {
	beforeEach(resetMocks);
	it('persists encrypted tokens on success', async () => {
		await loginAndStore('user-1', 'me@example.com', 'secret');

		expect(garminMock.loginImpl).toHaveBeenCalledWith('me@example.com', 'secret');
		expect(store.row).not.toBeNull();
		expect(store.row!.userId).toBe('user-1');

		// Stored values must round-trip via decryptToken back to the originals.
		expect(JSON.parse(decryptToken(store.row!.oauth1Token))).toEqual({
			oauth_token: 'o1',
			oauth_token_secret: 'o1s'
		});
		expect(JSON.parse(decryptToken(store.row!.oauth2Token))).toMatchObject({
			access_token: 'a',
			refresh_token: 'r'
		});
		expect(store.row!.connectedAt).toBeInstanceOf(Date);
		expect(store.row!.lastRefreshedAt).toBeInstanceOf(Date);
	});

	it('maps a 401 from Garmin to GarminAuthError', async () => {
		garminMock.loginImpl.mockRejectedValueOnce(new Error('ERROR: (401), Unauthorized, {}'));
		await expect(loginAndStore('user-1', 'a@b.c', 'pw')).rejects.toBeInstanceOf(GarminAuthError);
		expect(store.row).toBeNull();
	});

	it('maps a 403 from Garmin to GarminAuthError', async () => {
		garminMock.loginImpl.mockRejectedValueOnce(new Error('ERROR: (403), Forbidden, {}'));
		await expect(loginAndStore('user-1', 'a@b.c', 'pw')).rejects.toBeInstanceOf(GarminAuthError);
	});

	it('maps other failures to GarminNetworkError', async () => {
		garminMock.loginImpl.mockRejectedValueOnce(new Error('ENOTFOUND connectapi.garmin.com'));
		await expect(loginAndStore('user-1', 'a@b.c', 'pw')).rejects.toBeInstanceOf(GarminNetworkError);
	});
});

describe('withGarminClient', () => {
	beforeEach(resetMocks);

	it('throws GarminNotConnectedError when the user has no connection', async () => {
		await expect(withGarminClient('user-1', async () => 'x')).rejects.toBeInstanceOf(
			GarminNotConnectedError
		);
	});

	it('loads tokens, invokes fn, persists refreshed tokens, returns result', async () => {
		// Seed a connection.
		await loginAndStore('user-1', 'me@example.com', 'secret');
		const initialRefreshedAt = store.row!.lastRefreshedAt;

		// Force the next exportToken (the post-fn refresh write) to return a
		// distinguishable new value.
		garminMock.exportTokenImpl.mockReturnValueOnce({
			oauth1: { oauth_token: 'o1-new', oauth_token_secret: 'o1s-new' },
			oauth2: { access_token: 'a-new', refresh_token: 'r-new', expires_at: 2, expires_in: 1 }
		});

		// Add a small wait so lastRefreshedAt strictly increases.
		await new Promise((r) => setTimeout(r, 10));

		const result = await withGarminClient('user-1', async (client) => {
			expect(garminMock.loadTokenImpl).toHaveBeenCalled();
			expect(client).toBeDefined();
			return 'payload';
		});

		expect(result).toBe('payload');
		expect(JSON.parse(decryptToken(store.row!.oauth1Token))).toMatchObject({
			oauth_token: 'o1-new'
		});
		expect(store.row!.lastRefreshedAt.getTime()).toBeGreaterThan(initialRefreshedAt.getTime());
	});

	it('maps auth failures during fn() to GarminAuthError', async () => {
		await loginAndStore('user-1', 'me@example.com', 'secret');
		await expect(
			withGarminClient('user-1', async () => {
				throw new Error('ERROR: (401), Unauthorized, {}');
			})
		).rejects.toBeInstanceOf(GarminAuthError);
	});

	it('maps other failures during fn() to GarminNetworkError', async () => {
		await loginAndStore('user-1', 'me@example.com', 'secret');
		await expect(
			withGarminClient('user-1', async () => {
				throw new Error('socket hang up');
			})
		).rejects.toBeInstanceOf(GarminNetworkError);
	});
});

describe('hasGarminConnection / disconnect', () => {
	beforeEach(resetMocks);

	it('hasGarminConnection reflects current state', async () => {
		expect(hasGarminConnection('user-1')).toBe(false);
		await loginAndStore('user-1', 'me@example.com', 'secret');
		expect(hasGarminConnection('user-1')).toBe(true);
	});

	it('disconnect removes the row', async () => {
		await loginAndStore('user-1', 'me@example.com', 'secret');
		disconnect('user-1');
		expect(store.row).toBeNull();
		expect(hasGarminConnection('user-1')).toBe(false);
	});
});
