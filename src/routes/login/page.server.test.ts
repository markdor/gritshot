import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';

vi.mock('$lib/server/db', async () => {
	const Database = (await import('better-sqlite3')).default;
	const { drizzle } = await import('drizzle-orm/better-sqlite3');
	const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');
	const schema = await import('$lib/server/db/schema');
	const sqlite = new Database(':memory:');
	sqlite.pragma('foreign_keys = ON');
	const db = drizzle(sqlite, { schema });
	migrate(db, { migrationsFolder: './drizzle' });
	return { db, schema };
});

const { signInMagicLink } = vi.hoisted(() => ({
	signInMagicLink: vi.fn(async () => ({ status: true }))
}));

vi.mock('$lib/server/auth', () => ({
	auth: { api: { signInMagicLink } }
}));

vi.mock('$lib/server/logger', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { actions, load } from './+page.server';
import { _resetForTests as resetRateLimits } from '$lib/server/rateLimit';

function makeEvent(form: Record<string, string>, ip = '1.2.3.4'): RequestEvent {
	const formData = new FormData();
	for (const [k, v] of Object.entries(form)) formData.append(k, v);
	const request = new Request('http://localhost/login', { method: 'POST', body: formData });
	return {
		request,
		getClientAddress: () => ip
	} as unknown as RequestEvent;
}

function insertUser(email: string) {
	const now = new Date();
	const username = email.split('@')[0];
	db.insert(user)
		.values({
			id: randomUUID(),
			name: username,
			email,
			emailVerified: true,
			username,
			isAdmin: false,
			createdAt: now,
			updatedAt: now
		})
		.run();
}

beforeEach(() => {
	db.delete(user).run();
	signInMagicLink.mockClear();
	resetRateLimits();
});

describe('login load', () => {
	it('redirects logged-in users to /', async () => {
		await expect(
			Promise.resolve().then(() =>
				load({
					locals: { user: { id: 'x' } },
					url: new URL('http://localhost/login')
				} as unknown as Parameters<typeof load>[0])
			)
		).rejects.toMatchObject({ status: 303, location: '/' });
	});

	it('passes through known error codes only', () => {
		const result = load({
			locals: { user: null },
			url: new URL('http://localhost/login?error=expired')
		} as unknown as Parameters<typeof load>[0]) as { error: string | null };
		expect(result.error).toBe('expired');

		const ignored = load({
			locals: { user: null },
			url: new URL('http://localhost/login?error=funky')
		} as unknown as Parameters<typeof load>[0]) as { error: string | null };
		expect(ignored.error).toBeNull();
	});
});

describe('login action — constant-time response', () => {
	it('returns the same shape whether or not the email is whitelisted', async () => {
		insertUser('hit@test.com');

		const hit = await actions.default(makeEvent({ email: 'hit@test.com' }, '10.0.0.1'));
		const miss = await actions.default(makeEvent({ email: 'miss@test.com' }, '10.0.0.2'));

		expect(hit).toEqual({ sent: true });
		expect(miss).toEqual({ sent: true });
	});

	it('only calls signInMagicLink for whitelisted emails', async () => {
		insertUser('hit@test.com');

		await actions.default(makeEvent({ email: 'hit@test.com' }, '10.0.0.3'));
		await actions.default(makeEvent({ email: 'miss@test.com' }, '10.0.0.4'));

		// Fire-and-forget — yield once so the microtask runs
		await new Promise((r) => setImmediate(r));

		expect(signInMagicLink).toHaveBeenCalledTimes(1);
		const calls = signInMagicLink.mock.calls as unknown as Array<[{ body: { email: string } }]>;
		expect(calls[0][0].body.email).toBe('hit@test.com');
	});

	it('rejects malformed emails with 400 before any side-effects', async () => {
		const result = await actions.default(makeEvent({ email: 'not-an-email' }));
		expect(result).toMatchObject({ status: 400, data: { invalidEmail: true } });
		expect(signInMagicLink).not.toHaveBeenCalled();
	});

	it('lowercases and trims the email on lookup', async () => {
		insertUser('mixed@test.com');
		const result = await actions.default(makeEvent({ email: '  MiXeD@TEST.com  ' }, '10.0.0.5'));
		expect(result).toEqual({ sent: true });
		await new Promise((r) => setImmediate(r));
		expect(signInMagicLink).toHaveBeenCalledTimes(1);
	});
});

describe('login action — rate limiting', () => {
	it('silently swallows requests beyond the per-email limit', async () => {
		insertUser('rate@test.com');
		for (let i = 0; i < 3; i++) {
			await actions.default(makeEvent({ email: 'rate@test.com' }, `10.1.0.${i}`));
		}
		await new Promise((r) => setImmediate(r));
		expect(signInMagicLink).toHaveBeenCalledTimes(3);

		const blocked = await actions.default(makeEvent({ email: 'rate@test.com' }, '10.1.0.99'));
		await new Promise((r) => setImmediate(r));
		// Response shape is identical (no leak), but signIn was not called again.
		expect(blocked).toEqual({ sent: true });
		expect(signInMagicLink).toHaveBeenCalledTimes(3);
	});

	it('silently swallows requests beyond the per-IP limit', async () => {
		insertUser('a@test.com');
		insertUser('b@test.com');
		insertUser('c@test.com');
		insertUser('d@test.com');
		insertUser('e@test.com');
		insertUser('f@test.com');
		const ip = '10.2.3.4';
		for (const email of ['a', 'b', 'c', 'd', 'e'].map((x) => `${x}@test.com`)) {
			await actions.default(makeEvent({ email }, ip));
		}
		await new Promise((r) => setImmediate(r));
		expect(signInMagicLink).toHaveBeenCalledTimes(5);

		const blocked = await actions.default(makeEvent({ email: 'f@test.com' }, ip));
		await new Promise((r) => setImmediate(r));
		expect(blocked).toEqual({ sent: true });
		expect(signInMagicLink).toHaveBeenCalledTimes(5);
	});
});
