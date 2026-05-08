import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));
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

import { prisma } from '@/lib/prisma';
import { jwtCallback } from '../auth';

describe('jwtCallback', () => {
  beforeEach(() => (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockReset());

  it('enriquece token na primeira chamada com user', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'u1',
      email: 'e@x',
      role: 'USER',
    });
    const token = await jwtCallback({
      token: {},
      user: { email: 'e@x' },
    } as never);
    expect(token).toMatchObject({ sub: 'u1', email: 'e@x', role: 'USER' });
  });

  it('mantém token quando refresh sem user', async () => {
    const token = await jwtCallback({
      token: { sub: 'u1', role: 'USER' },
    } as never);
    expect(token).toMatchObject({ sub: 'u1', role: 'USER' });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('re-busca role quando trigger=update', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'u1',
      email: 'e@x',
      role: 'ADMIN',
    });
    const token = await jwtCallback({
      token: { sub: 'u1', email: 'e@x', role: 'USER' },
      trigger: 'update',
    } as never);
    expect(token.role).toBe('ADMIN');
  });
});
