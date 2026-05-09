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

  describe('rate-limit em production', () => {
    beforeEach(() => vi.stubEnv('NODE_ENV', 'production'));

    it('limita /api/auth/signin/* a 10 hits e retorna 429 no 11º (production)', async () => {
      for (let i = 0; i < 10; i++) {
        const r = await middleware(
          makeReq('/api/auth/signin/google', { 'x-forwarded-for': '9.9.9.9' }),
        );
        expect(r.status).not.toBe(429);
      }
      const r = await middleware(
        makeReq('/api/auth/signin/google', { 'x-forwarded-for': '9.9.9.9' }),
      );
      expect(r.status).toBe(429);
      expect(r.headers.get('Retry-After')).toBeTruthy();
    });

    it('limita /api/auth/callback/* (mesma chave de signin)', async () => {
      // Compartilham bucket por IP — fluxo OAuth inteiro conta como uma
      // sequência. 10 mistos signin+callback = OK; 11º = 429.
      for (let i = 0; i < 10; i++) {
        const r = await middleware(
          makeReq('/api/auth/callback/google', { 'x-forwarded-for': '7.7.7.7' }),
        );
        expect(r.status).not.toBe(429);
      }
      const r = await middleware(
        makeReq('/api/auth/callback/google', { 'x-forwarded-for': '7.7.7.7' }),
      );
      expect(r.status).toBe(429);
    });

    // Antes do fix, csrf/session/signout/providers/_log eram limitados a
    // 5/min no mesmo bucket, queimando o orçamento durante uso normal e
    // travando logout. Estes endpoints não são vetor de brute-force.
    it.each([
      '/api/auth/csrf',
      '/api/auth/session',
      '/api/auth/signout',
      '/api/auth/providers',
      '/api/auth/_log',
    ])('NÃO limita %s mesmo com 50 hits', async (path) => {
      for (let i = 0; i < 50; i++) {
        const r = await middleware(makeReq(path, { 'x-forwarded-for': '5.5.5.5' }));
        expect(r.status).not.toBe(429);
      }
    });

    it('logout (POST /api/auth/signout) sobrevive mesmo após estourar signin', async () => {
      // Cenário do bug: usuário tenta logar várias vezes, estoura signin,
      // depois tenta sair. Logout PRECISA passar — não compartilha bucket.
      for (let i = 0; i < 11; i++) {
        await middleware(makeReq('/api/auth/signin/google', { 'x-forwarded-for': '4.4.4.4' }));
      }
      const r = await middleware(makeReq('/api/auth/signout', { 'x-forwarded-for': '4.4.4.4' }));
      expect(r.status).not.toBe(429);
    });
  });

  it('bypass do rate-limit fora de production (dev/test)', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    for (let i = 0; i < 50; i++) {
      const r = await middleware(
        makeReq('/api/auth/signin/google', { 'x-forwarded-for': '8.8.8.8' }),
      );
      expect(r.status).not.toBe(429);
    }
  });

  it('passa /api/v1/* sem auth check (route handler decide)', async () => {
    const r = await middleware(makeReq('/api/v1/me'));
    expect(r.status).toBe(200);
    expect(r.headers.get('Location')).toBeNull();
  });
});
