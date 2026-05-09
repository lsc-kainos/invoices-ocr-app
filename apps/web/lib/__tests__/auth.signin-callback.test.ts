import { describe, it, expect, vi } from 'vitest';

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

import { signInCallback } from '../auth';

describe('signInCallback', () => {
  it('rejeita quando email ausente', async () => {
    expect(await signInCallback({ user: { email: null } } as never)).toBe(false);
  });

  it('aceita quando email presente', async () => {
    expect(await signInCallback({ user: { email: 'user@x.com', name: 'U' } } as never)).toBe(true);
  });
});
