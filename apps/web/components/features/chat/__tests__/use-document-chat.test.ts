import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDocumentChat } from '../use-document-chat';

describe('useDocumentChat', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('hidrata mensagens ao mount', async () => {
    fetchSpy.mockImplementation((url: string, opts?: RequestInit) => {
      if (!opts || opts.method === undefined || opts.method === 'GET') {
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => [{ id: '1', role: 'USER', content: 'oi', createdAt: '2026' }],
        });
      }
      return Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({}),
      });
    });

    const { result } = renderHook(() => useDocumentChat('d1'));
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
  });

  it('clear chama DELETE e zera state', async () => {
    fetchSpy.mockImplementation((url: string, opts?: RequestInit) => {
      if (opts?.method === 'DELETE') {
        return Promise.resolve({ ok: true, headers: { get: () => 'application/json' } });
      }
      return Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => [],
      });
    });
    const { result } = renderHook(() => useDocumentChat('d1'));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    await act(async () => {
      await result.current.clear();
    });
    expect(fetchSpy).toHaveBeenCalledWith('/api/chat/documents/d1/messages', { method: 'DELETE' });
    expect(result.current.messages).toEqual([]);
  });
});
