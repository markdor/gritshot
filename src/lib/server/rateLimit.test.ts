import { describe, it, expect, beforeEach } from 'vitest';
import { checkAndIncrement, _resetForTests } from './rateLimit';

describe('rateLimit', () => {
	beforeEach(() => {
		_resetForTests();
	});

	it('allows requests up to the limit and blocks the next one', () => {
		const key = 'test-key';
		expect(checkAndIncrement(key, 60, 3).allowed).toBe(true);
		expect(checkAndIncrement(key, 60, 3).allowed).toBe(true);
		expect(checkAndIncrement(key, 60, 3).allowed).toBe(true);
		const blocked = checkAndIncrement(key, 60, 3);
		expect(blocked.allowed).toBe(false);
		expect(blocked.retryAfter).toBeGreaterThan(0);
		expect(blocked.retryAfter).toBeLessThanOrEqual(60);
	});

	it('tracks independent keys separately', () => {
		expect(checkAndIncrement('a', 60, 1).allowed).toBe(true);
		expect(checkAndIncrement('a', 60, 1).allowed).toBe(false);
		expect(checkAndIncrement('b', 60, 1).allowed).toBe(true);
	});

	it('resets after the window expires', async () => {
		expect(checkAndIncrement('expiring', 0.05, 1).allowed).toBe(true);
		expect(checkAndIncrement('expiring', 0.05, 1).allowed).toBe(false);
		await new Promise((r) => setTimeout(r, 80));
		expect(checkAndIncrement('expiring', 0.05, 1).allowed).toBe(true);
	});
});
