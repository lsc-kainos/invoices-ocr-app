import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWorkspaceChat } from '../use-workspace-chat';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('useWorkspaceChat', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('hidrata sessões ao mount', async () => {
    fetchSpy.mockImplementation((url: string) => {
      if (url.includes('/sessions') && !url.includes('messages')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 's1', title: 'A', updatedAt: '2026' }],
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    const { result } = renderHook(() => useWorkspaceChat());
    await waitFor(() => expect(result.current.sessions).toHaveLength(1));
  });

  it('send POSTa para /api/chat/sessions/<id>/messages e adiciona mensagem ao state', async () => {
    fetchSpy.mockImplementation((url: string, opts?: RequestInit) => {
      if (url.endsWith('/sessions')) return Promise.resolve({ ok: true, json: async () => [] });
      if (url.includes('/messages') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({ content: 'resposta' }),
        });
      }
      // GET /messages — return empty array so state is an array
      if (url.includes('/messages')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    const { result } = renderHook(() => useWorkspaceChat('s1'));
    // Wait for the initial hydration fetch to complete
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    await act(async () => {
      await result.current.send('pergunta');
    });
    await waitFor(() =>
      expect(
        result.current.messages.some((m) => m.role === 'ASSISTANT' && m.content === 'resposta'),
      ).toBe(true),
    );
    expect(result.current.messages.some((m) => m.role === 'USER' && m.content === 'pergunta')).toBe(
      true,
    );
  });
});
