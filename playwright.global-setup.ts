import { rmSync } from 'node:fs';

const E2E_DB_FILES = ['./e2e.db', './e2e.db-shm', './e2e.db-wal', './e2e.db-journal'];

export default async function globalSetup() {
	for (const f of E2E_DB_FILES) {
		try {
			rmSync(f, { force: true });
		} catch {
			// ignore — file did not exist or could not be removed
		}
	}
}
