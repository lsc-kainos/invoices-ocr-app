import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWorkspaceChat } from '../use-workspace-chat';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

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

  it('reaproveita fetch em voo e hidrata a sessão ativa ao voltar antes da resposta', async () => {
    const s1Messages = deferred<Response>();
    fetchSpy.mockImplementation((url: string) => {
      if (url === '/api/chat/sessions') {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url === '/api/chat/sessions/s1/messages') {
        return s1Messages.promise;
      }
      if (url === '/api/chat/sessions/s2/messages') {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 's2-m1', role: 'USER', content: 'sessão 2' }],
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    const { result, rerender } = renderHook(({ id }) => useWorkspaceChat(id), {
      initialProps: { id: 's1' as string | undefined },
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/chat/sessions/s1/messages'));

    rerender({ id: 's2' });
    await waitFor(() => expect(result.current.messages[0]?.content).toBe('sessão 2'));

    rerender({ id: 's1' });
    await act(async () => {
      s1Messages.resolve({
        ok: true,
        json: async () => [{ id: 's1-m1', role: 'ASSISTANT', content: 'histórico s1' }],
      } as Response);
      await s1Messages.promise;
    });

    await waitFor(() => expect(result.current.messages[0]?.content).toBe('histórico s1'));
    expect(
      fetchSpy.mock.calls.filter(([url]) => url === '/api/chat/sessions/s1/messages'),
    ).toHaveLength(1);
  });

  it('combina histórico tardio com mensagens otimistas sem perder conversas antigas', async () => {
    const getResponse = deferred<Response>();
    const postResponse = deferred<Response>();
    fetchSpy.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === '/api/chat/sessions') {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url === '/api/chat/sessions/s1/messages' && opts?.method === 'POST') {
        return postResponse.promise;
      }
      if (url === '/api/chat/sessions/s1/messages') {
        return getResponse.promise;
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    const { result } = renderHook(() => useWorkspaceChat('s1'));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/chat/sessions/s1/messages'));

    let sendPromise!: Promise<void>;
    await act(async () => {
      sendPromise = result.current.send('mensagem nova');
    });
    await waitFor(() =>
      expect(result.current.messages.map((m) => m.content)).toEqual(['mensagem nova']),
    );

    await act(async () => {
      getResponse.resolve({
        ok: true,
        json: async () => [{ id: 'old-1', role: 'USER', content: 'mensagem antiga' }],
      } as Response);
      await getResponse.promise;
    });

    await waitFor(() =>
      expect(result.current.messages.map((m) => m.content)).toEqual([
        'mensagem antiga',
        'mensagem nova',
      ]),
    );

    await act(async () => {
      postResponse.resolve({
        ok: true,
        json: async () => ({ content: 'resposta nova' }),
      } as Response);
      await sendPromise;
    });

    await waitFor(() =>
      expect(result.current.messages.map((m) => m.content)).toEqual([
        'mensagem antiga',
        'mensagem nova',
        'resposta nova',
      ]),
    );
  });

  it('mantém respostas tardias na cache da sessão correta após trocar de chat', async () => {
    const postResponse = deferred<Response>();
    fetchSpy.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === '/api/chat/sessions') {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url === '/api/chat/sessions/s1/messages' && opts?.method === 'POST') {
        return postResponse.promise;
      }
      if (url === '/api/chat/sessions/s1/messages') {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url === '/api/chat/sessions/s2/messages') {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 's2-m1', role: 'USER', content: 'sessão 2' }],
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    const { result, rerender } = renderHook(({ id }) => useWorkspaceChat(id), {
      initialProps: { id: 's1' as string | undefined },
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/chat/sessions/s1/messages'));

    let sendPromise!: Promise<void>;
    await act(async () => {
      sendPromise = result.current.send('pergunta s1');
    });
    await waitFor(() => expect(result.current.messages[0]?.content).toBe('pergunta s1'));

    rerender({ id: 's2' });
    await waitFor(() => expect(result.current.messages[0]?.content).toBe('sessão 2'));

    await act(async () => {
      postResponse.resolve({
        ok: true,
        json: async () => ({ content: 'resposta s1' }),
      } as Response);
      await sendPromise;
    });

    expect(result.current.messages.map((m) => m.content)).toEqual(['sessão 2']);

    rerender({ id: 's1' });
    await waitFor(() =>
      expect(result.current.messages.map((m) => m.content)).toEqual(['pergunta s1', 'resposta s1']),
    );
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
