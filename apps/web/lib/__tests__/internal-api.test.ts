import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('@/lib/env', () => ({
  env: {
    API_URL: 'http://api:3001',
    INTERNAL_SERVICE_TOKEN: 'test-token-32-chars-xxxxxxxxxxxx',
  },
}));

import { internalFetch } from '../internal-api';

describe('internalFetch', () => {
  beforeEach(() => mockFetch.mockReset());

  it('inclui x-internal-token e Content-Type', async () => {
    mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

    await internalFetch('/api/v1/internal/users/sync', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com' }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://api:3001/api/v1/internal/users/sync',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-internal-token': 'test-token-32-chars-xxxxxxxxxxxx',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('usa API_URL como base', async () => {
    mockFetch.mockResolvedValue(new Response('', { status: 200 }));

    await internalFetch('/api/v1/internal/users/by-email', { method: 'DELETE' });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe('http://api:3001/api/v1/internal/users/by-email');
  });

  it('propaga a Response para o caller', async () => {
    const fakeResponse = new Response('{"id":"u1"}', { status: 201 });
    mockFetch.mockResolvedValue(fakeResponse);

    const res = await internalFetch('/api/v1/internal/users/sync', {
      method: 'POST',
    });

    expect(res).toBe(fakeResponse);
  });
});
