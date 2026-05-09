import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDocumentUpload } from '../use-document-upload';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

class FakeXHR {
  static instances: FakeXHR[] = [];
  upload = { onprogress: null as ((e: ProgressEvent) => void) | null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  status = 0;
  responseText = '';
  open = vi.fn();
  setRequestHeader = vi.fn();
  send = vi.fn();
  constructor() {
    FakeXHR.instances.push(this);
  }
}

describe('useDocumentUpload', () => {
  beforeEach(() => {
    FakeXHR.instances = [];
    (globalThis as { XMLHttpRequest: unknown }).XMLHttpRequest = FakeXHR;
  });

  it('expõe progress 0..1 por arquivo durante upload', async () => {
    const { result } = renderHook(() => useDocumentUpload());
    const file = new File(['hello'], 'a.png', { type: 'image/png' });

    let promise: Promise<void>;
    act(() => {
      promise = result.current.uploadFiles([file]);
    });

    await waitFor(() => expect(FakeXHR.instances).toHaveLength(1));
    const xhr = FakeXHR.instances[0]!;
    act(() =>
      xhr.upload.onprogress?.(
        new ProgressEvent('progress', { loaded: 50, total: 100, lengthComputable: true }),
      ),
    );
    expect(result.current.activeUploads[0]?.progress).toBeCloseTo(0.5);

    act(() => {
      xhr.status = 201;
      xhr.responseText = '{"id":"d1"}';
      xhr.onload?.();
    });
    await act(async () => {
      await promise!;
    });
    expect(result.current.activeUploads).toHaveLength(0);
  });
});
