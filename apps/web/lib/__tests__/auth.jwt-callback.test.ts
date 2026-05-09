import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/internal-api', () => ({ internalFetch: vi.fn() }));
vi.mock('@/lib/env', () => ({
  env: {
    GOOGLE_CLIENT_ID: 'g-id',
    GOOGLE_CLIENT_SECRET: 'g-secret',
    GITHUB_CLIENT_ID: 'gh-id',
    GITHUB_CLIENT_SECRET: 'gh-secret',
    NEXTAUTH_SECRET: 'a'.repeat(32),
    NEXTAUTH_URL: 'http://localhost:3000',
    API_URL: 'http://localhost:3001',
    INTERNAL_SERVICE_TOKEN: 'x'.repeat(32),
  },
}));

import { internalFetch } from '@/lib/internal-api';
import { jwtCallback } from '../auth';

const mockInternalFetch = vi.mocked(internalFetch);

describe('jwtCallback', () => {
  beforeEach(() => mockInternalFetch.mockReset());

  it('enriquece token na primeira chamada com user e define token.sub com id da resposta', async () => {
    mockInternalFetch.mockResolvedValue(
      new Response(JSON.stringify({ id: 'u1', email: 'e@x', role: 'USER' }), {
        status: 200,
      }),
    );
    const token = await jwtCallback({
      token: {},
      user: { email: 'e@x', name: 'E' },
    } as never);
    expect(mockInternalFetch).toHaveBeenCalledWith(
      '/api/v1/internal/users/sync',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(token).toMatchObject({ sub: 'u1', email: 'e@x', role: 'USER' });
  });

  it('mantém token quando não há user nem trigger update', async () => {
    const token = await jwtCallback({
      token: { sub: 'u1', role: 'USER' },
    } as never);
    expect(token).toMatchObject({ sub: 'u1', role: 'USER' });
    expect(mockInternalFetch).not.toHaveBeenCalled();
  });

  it('re-sincroniza quando trigger=update e atualiza role', async () => {
    mockInternalFetch.mockResolvedValue(
      new Response(JSON.stringify({ id: 'u1', email: 'e@x', role: 'ADMIN' }), {
        status: 200,
      }),
    );
    const token = await jwtCallback({
      token: { sub: 'u1', email: 'e@x', role: 'USER' },
      trigger: 'update',
    } as never);
    expect(token.role).toBe('ADMIN');
    expect(token.sub).toBe('u1');
  });

  // Regressão: antes deste fix, !res.ok era engolido silenciosamente e o
  // token mantinha o sub do provedor OAuth (Google) em vez do CUID do User
  // do banco. Resultado: 401 cascata em todas as chamadas à API porque o
  // JwtStrategy procurava por id que não existe.
  it('lança quando internalFetch retorna não-ok (impede token-fantasma)', async () => {
    mockInternalFetch.mockResolvedValue(new Response('Unauthorized', { status: 401 }));
    await expect(
      jwtCallback({
        token: { sub: 'google-sub-123' },
        user: { email: 'e@x', name: 'E' },
      } as never),
    ).rejects.toThrow(/sync/i);
  });

  it('lança quando internalFetch retorna 5xx', async () => {
    mockInternalFetch.mockResolvedValue(new Response('boom', { status: 500 }));
    await expect(
      jwtCallback({
        token: {},
        user: { email: 'e@x' },
      } as never),
    ).rejects.toThrow(/sync/i);
  });
});
