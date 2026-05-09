import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDocumentRetry } from '../use-document-retry';
import { UPLOAD_QUEUED_EVENT } from '../../active-uploads/events';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('useDocumentRetry', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as never;
  });

  it('POSTa para /api/documents/:id/retry e dispara evento de wake', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }));
    const eventSpy = vi.fn();
    window.addEventListener(UPLOAD_QUEUED_EVENT, eventSpy);

    const { result } = renderHook(() => useDocumentRetry());
    await act(async () => {
      await result.current.retry('doc1', 'nf.pdf');
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/documents/doc1/retry',
      expect.objectContaining({ method: 'POST' }),
    );
    await waitFor(() => expect(eventSpy).toHaveBeenCalled());
    window.removeEventListener(UPLOAD_QUEUED_EVENT, eventSpy);
  });

  it('mostra toast de erro em 4xx/5xx', async () => {
    const { toast } = await import('sonner');
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 409 }));
    const { result } = renderHook(() => useDocumentRetry());
    await act(async () => {
      await result.current.retry('doc1', 'nf.pdf');
    });
    expect(toast.error).toHaveBeenCalled();
  });
});
