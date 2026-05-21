type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

setInterval(() => {
	const now = Date.now();
	for (const [key, bucket] of buckets) {
		if (bucket.resetAt <= now) buckets.delete(key);
	}
}, 60_000).unref?.();

export function checkAndIncrement(
	key: string,
	windowSeconds: number,
	max: number
): { allowed: boolean; retryAfter: number } {
	const now = Date.now();
	const bucket = buckets.get(key);

	if (!bucket || bucket.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
		return { allowed: true, retryAfter: 0 };
	}

	if (bucket.count >= max) {
		return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
	}

	bucket.count += 1;
	return { allowed: true, retryAfter: 0 };
}

export function _resetForTests() {
	buckets.clear();
}
