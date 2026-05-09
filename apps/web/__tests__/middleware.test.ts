import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { __resetForTests } from '@/lib/rate-limit';
import middleware from '../middleware';

function makeReq(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe('middleware', () => {
  beforeEach(() => __resetForTests());
  afterEach(() => vi.unstubAllEnvs());

  it('retorna 429 ao 6º hit em /api/auth/* (production)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    for (let i = 0; i < 5; i++) {
      const r = await middleware(makeReq('/api/auth/csrf', { 'x-forwarded-for': '9.9.9.9' }));
      expect(r.status).not.toBe(429);
    }
    const r = await middleware(makeReq('/api/auth/csrf', { 'x-forwarded-for': '9.9.9.9' }));
    expect(r.status).toBe(429);
    expect(r.headers.get('Retry-After')).toBeTruthy();
  });

  it('bypass do rate-limit fora de production (dev/test)', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    for (let i = 0; i < 20; i++) {
      const r = await middleware(makeReq('/api/auth/csrf', { 'x-forwarded-for': '8.8.8.8' }));
      expect(r.status).not.toBe(429);
    }
  });

  it('passa /api/v1/* sem auth check (route handler decide)', async () => {
    const r = await middleware(makeReq('/api/v1/me'));
    // NextResponse.next() sem header de redirect ou rewrite
    expect(r.status).toBe(200);
    expect(r.headers.get('Location')).toBeNull();
  });
});
