import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { upsert: vi.fn() } },
}));
vi.mock('@/lib/env', () => ({
  env: {
    ADMIN_EMAILS: 'admin@x.com,boss@y.com',
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
import { signInCallback } from '../auth';

describe('signInCallback', () => {
  beforeEach(() => (prisma.user.upsert as ReturnType<typeof vi.fn>).mockReset());

  it('rejeita quando email ausente', async () => {
    expect(await signInCallback({ user: { email: null } } as never)).toBe(false);
  });

  it('cria USER para email novo', async () => {
    (prisma.user.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({});
    await signInCallback({
      user: { email: 'new@x.com', name: 'N', image: 'img' },
    } as never);
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'new@x.com' },
        create: expect.objectContaining({ role: 'USER' }),
        update: expect.objectContaining({ role: 'USER' }),
      }),
    );
  });

  it('promove ADMIN se email em ADMIN_EMAILS (case-insensitive)', async () => {
    (prisma.user.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({});
    await signInCallback({
      user: { email: 'Admin@X.COM', name: 'A', image: null },
    } as never);
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ role: 'ADMIN' }),
      }),
    );
  });
});
