import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/env', () => ({
  env: {
    ADMIN_EMAILS: '',
    GOOGLE_CLIENT_ID: 'g-id',
    GOOGLE_CLIENT_SECRET: 'g-secret',
    GITHUB_CLIENT_ID: 'gh-id',
    GITHUB_CLIENT_SECRET: 'gh-secret',
    NEXTAUTH_SECRET: 'a'.repeat(32),
    NEXTAUTH_URL: 'http://localhost:3000',
    API_URL: 'http://localhost:3001',
    DATABASE_URL: 'postgresql://x:x@localhost:5432/x',
  },
}));

import { sessionCallback } from '../auth';

describe('sessionCallback', () => {
  it('reflete id e role do token na session', async () => {
    const out = await sessionCallback({
      session: { user: { email: 'e@x', name: 'X' }, expires: '2030-01-01' },
      token: { sub: 'u1', role: 'ADMIN', email: 'e@x' },
    } as never);
    expect(out.user).toMatchObject({ id: 'u1', role: 'ADMIN' });
  });

  it('passa session inalterada quando token.sub ausente', async () => {
    const out = await sessionCallback({
      session: { user: { email: 'e@x', name: 'X' }, expires: '2030-01-01' },
      token: { email: 'e@x' },
    } as never);
    expect(out.user).toEqual({ email: 'e@x', name: 'X' });
  });
});
