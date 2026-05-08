import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { __resetForTests } from '@/lib/rate-limit';
import middleware from '../middleware';

function makeReq(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe('middleware', () => {
  beforeEach(() => __resetForTests());

  it('retorna 429 ao 6º hit em /api/auth/*', async () => {
    for (let i = 0; i < 5; i++) {
      const r = await middleware(makeReq('/api/auth/csrf', { 'x-forwarded-for': '9.9.9.9' }));
      expect(r.status).not.toBe(429);
    }
    const r = await middleware(makeReq('/api/auth/csrf', { 'x-forwarded-for': '9.9.9.9' }));
    expect(r.status).toBe(429);
    expect(r.headers.get('Retry-After')).toBeTruthy();
  });
});
