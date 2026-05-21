import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/logger';
import * as schema from './schema';
import { bootstrapAdmin } from './bootstrap';

const dbPath = env.DB_PATH ?? './local.db';

if (dbPath !== ':memory:') {
	mkdirSync(dirname(dbPath), { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

migrate(db, { migrationsFolder: './drizzle' });
logger.info({ dbPath }, 'database migrations applied');

bootstrapAdmin(db, { email: env.ADMIN_EMAIL, username: env.ADMIN_USERNAME });

export { schema };
