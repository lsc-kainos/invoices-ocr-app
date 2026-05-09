import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth/jwt', () => ({ getToken: vi.fn() }));
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({ get: () => undefined })),
}));
vi.mock('@/lib/env', () => ({
  env: { API_URL: 'http://api', NEXTAUTH_SECRET: 'x'.repeat(32) },
}));

import { getToken } from 'next-auth/jwt';
import { apiFetch, apiUpload } from '../api';

describe('apiFetch', () => {
  beforeEach(() => {
    (getToken as ReturnType<typeof vi.fn>).mockReset();
    global.fetch = vi.fn(() => Promise.resolve(new Response('{}'))) as unknown as typeof fetch;
  });

  it('inclui Bearer quando token presente', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue('jwt-raw');
    await apiFetch('/me');
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((call[1] as RequestInit).headers as Record<string, string>).toMatchObject({
      Authorization: 'Bearer jwt-raw',
    });
  });

  it('omite Authorization quando sem token', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await apiFetch('/me');
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const hdrs = (call[1] as RequestInit).headers as Record<string, string>;
    expect(hdrs.Authorization).toBeUndefined();
  });
});

describe('apiUpload', () => {
  beforeEach(() => {
    (getToken as ReturnType<typeof vi.fn>).mockReset();
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response('{}', { status: 201 })),
    ) as unknown as typeof fetch;
  });

  it('proxia FormData com Bearer e SEM Content-Type', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue('tok');
    const fd = new FormData();
    fd.append('file', new Blob(['x']), 'a.jpg');
    await apiUpload('/api/v1/documents', fd);
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('http://api/api/v1/documents');
    const init = call[1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(init.body).toBe(fd);
    const hdrs = init.headers as Record<string, string>;
    expect(hdrs.Authorization).toBe('Bearer tok');
    expect(hdrs['Content-Type']).toBeUndefined();
  });
});
