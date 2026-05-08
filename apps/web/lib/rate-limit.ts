const WINDOW_MS = 60_000;
const LIMIT = 5;
const buckets = new Map<string, { count: number; windowStart: number }>();

export function rateLimit(ip: string, limit = LIMIT, windowMs = WINDOW_MS) {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    buckets.set(ip, { count: 1, windowStart: now });
    return { limited: false, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      limited: true,
      retryAfter: Math.ceil((bucket.windowStart + windowMs - now) / 1000),
    };
  }
  return { limited: false, retryAfter: 0 };
}

export function __resetForTests() {
  buckets.clear();
}

// TODO(F-backlog): substituir por Upstash Ratelimit pra suportar múltiplas instâncias.
