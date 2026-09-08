import { describe, it, expect } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { GET } from './+server';

describe('GET /health', () => {
	it('returns 200 with no body', async () => {
		const event = { request: new Request('http://localhost/health') } as unknown as RequestEvent;
		const res = await GET(event);
		expect(res.status).toBe(200);
		expect(await res.text()).toBe('');
	});
});
