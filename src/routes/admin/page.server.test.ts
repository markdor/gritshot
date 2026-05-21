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

vi.mock('$lib/server/logger', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

import { db } from '$lib/server/db';
import { user, session } from '$lib/server/db/schema';
import { actions, load } from './+page.server';
import { eq } from 'drizzle-orm';

type AdminUser = { id: string; isAdmin: boolean };

function makeEvent(form: Record<string, string>, locals: { user: AdminUser | null }): RequestEvent {
	const formData = new FormData();
	for (const [k, v] of Object.entries(form)) formData.append(k, v);
	const request = new Request('http://localhost/admin', { method: 'POST', body: formData });
	return { request, locals } as unknown as RequestEvent;
}

function insertUser(opts: { email: string; username: string; isAdmin?: boolean }) {
	const id = randomUUID();
	const now = new Date();
	db.insert(user)
		.values({
			id,
			name: opts.username,
			email: opts.email,
			emailVerified: true,
			username: opts.username,
			isAdmin: opts.isAdmin ?? false,
			createdAt: now,
			updatedAt: now
		})
		.run();
	return id;
}

function insertSession(userId: string) {
	const id = randomUUID();
	const now = new Date();
	const token = randomUUID();
	db.insert(session)
		.values({
			id,
			userId,
			token,
			expiresAt: new Date(Date.now() + 86400_000),
			createdAt: now,
			updatedAt: now
		})
		.run();
	return id;
}

let adminId: string;

beforeEach(() => {
	db.delete(session).run();
	db.delete(user).run();
	adminId = insertUser({ email: 'admin@test.com', username: 'admin', isAdmin: true });
});

describe('admin page guard', () => {
	it('throws 401 when there is no logged-in user', async () => {
		await expect(
			Promise.resolve().then(() =>
				load({ locals: { user: null } as unknown as App.Locals } as Parameters<typeof load>[0])
			)
		).rejects.toMatchObject({ status: 401 });
	});

	it('throws 403 when the logged-in user is not an admin', async () => {
		const nonAdminId = insertUser({ email: 'u@test.com', username: 'u', isAdmin: false });
		await expect(
			Promise.resolve().then(() =>
				load({
					locals: { user: { id: nonAdminId, isAdmin: false } } as unknown as App.Locals
				} as Parameters<typeof load>[0])
			)
		).rejects.toMatchObject({ status: 403 });
	});
});

describe('admin create action', () => {
	it('rejects invalid email', async () => {
		const result = await actions.create(
			makeEvent(
				{ email: 'not-an-email', username: 'bob' },
				{ user: { id: adminId, isAdmin: true } }
			)
		);
		expect(result).toMatchObject({ status: 400 });
	});

	it('rejects invalid username', async () => {
		const result = await actions.create(
			makeEvent({ email: 'bob@test.com', username: '@@' }, { user: { id: adminId, isAdmin: true } })
		);
		expect(result).toMatchObject({ status: 400 });
	});

	it('inserts a new user', async () => {
		const result = await actions.create(
			makeEvent(
				{ email: 'bob@test.com', username: 'bob' },
				{ user: { id: adminId, isAdmin: true } }
			)
		);
		expect(result).toEqual({ action: 'create', created: true });
		const bob = db.select().from(user).where(eq(user.email, 'bob@test.com')).get();
		expect(bob?.username).toBe('bob');
		expect(bob?.isAdmin).toBe(false);
	});

	it('rejects duplicate email with a 409', async () => {
		insertUser({ email: 'bob@test.com', username: 'bobby' });
		const result = await actions.create(
			makeEvent(
				{ email: 'bob@test.com', username: 'bob' },
				{ user: { id: adminId, isAdmin: true } }
			)
		);
		expect(result).toMatchObject({ status: 409 });
	});
});

describe('admin delete action', () => {
	it('refuses to delete the current admin', async () => {
		const result = await actions.delete(
			makeEvent({ id: adminId }, { user: { id: adminId, isAdmin: true } })
		);
		expect(result).toMatchObject({ status: 400, data: { error: 'self_delete' } });
		expect(db.select().from(user).where(eq(user.id, adminId)).get()).toBeDefined();
	});

	it('deletes another user and cascades their sessions', async () => {
		const victimId = insertUser({ email: 'victim@test.com', username: 'victim' });
		insertSession(victimId);
		insertSession(victimId);
		expect(db.select().from(session).where(eq(session.userId, victimId)).all().length).toBe(2);

		const result = await actions.delete(
			makeEvent({ id: victimId }, { user: { id: adminId, isAdmin: true } })
		);
		expect(result).toEqual({ action: 'delete', deleted: true });
		expect(db.select().from(user).where(eq(user.id, victimId)).get()).toBeUndefined();
		expect(db.select().from(session).where(eq(session.userId, victimId)).all()).toEqual([]);
	});
});

describe('admin update action', () => {
	it('prevents an admin from removing their own admin flag', async () => {
		const result = await actions.update(
			makeEvent(
				{ id: adminId, email: 'admin@test.com', username: 'admin' },
				{ user: { id: adminId, isAdmin: true } }
			)
		);
		expect(result).toEqual({ action: 'update', updated: true, selfDemoteBlocked: true });
		const fresh = db.select().from(user).where(eq(user.id, adminId)).get();
		expect(fresh?.isAdmin).toBe(true);
	});

	it('allows updating another user including the isAdmin flag', async () => {
		const otherId = insertUser({ email: 'a@test.com', username: 'a', isAdmin: false });
		const result = await actions.update(
			makeEvent(
				{ id: otherId, email: 'a@test.com', username: 'a-renamed', isAdmin: 'on' },
				{ user: { id: adminId, isAdmin: true } }
			)
		);
		expect(result).toMatchObject({ updated: true });
		const fresh = db.select().from(user).where(eq(user.id, otherId)).get();
		expect(fresh?.username).toBe('a-renamed');
		expect(fresh?.isAdmin).toBe(true);
	});
});
