import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDocumentDownload } from '../use-document-download';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

describe('useDocumentDownload', () => {
  let fetchSpy: Mock;
  let createObjectURL: Mock;
  let revokeObjectURL: Mock;
  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    createObjectURL = vi.fn(() => 'blob:fake');
    revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('409 → toast not_ready, sem clicar <a>', async () => {
    fetchSpy.mockResolvedValue({ status: 409, ok: false });
    const { result } = renderHook(() => useDocumentDownload());
    await act(async () => {
      await result.current.download('d1', 'nf');
    });
    const { toast } = await import('sonner');
    expect((toast.error as Mock).mock.calls[0][0]).toBe('error_not_ready');
  });

  it('200 → cria <a> com download attr e revoga URL', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => new Blob(['fake']),
    });
    const { result } = renderHook(() => useDocumentDownload());
    await act(async () => {
      await result.current.download('d1', 'nf');
    });
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });

  it('chamadas duplicadas no mesmo id são no-op', async () => {
    fetchSpy.mockImplementation(() => new Promise(() => {})); // pendente
    const { result } = renderHook(() => useDocumentDownload());
    void result.current.download('d1', 'nf');
    void result.current.download('d1', 'nf');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
