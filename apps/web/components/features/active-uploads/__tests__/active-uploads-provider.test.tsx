import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/pt-BR.json';
import type { DocumentSummary } from '@invoices-ocr/shared-types';
import { ActiveUploadsProvider } from '../active-uploads-provider';
import { UPLOAD_QUEUED_EVENT } from '../events';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function makeDoc(id: string, status: DocumentSummary['status']): DocumentSummary {
  return {
    id,
    status,
    filename: `${id}.pdf`,
    mime: 'application/pdf',
    size: 100,
    summary: null,
    failureReason: null,
    retryCount: 0,
    createdAt: '2026-05-09T00:00:00Z',
    updatedAt: '2026-05-09T00:00:00Z',
  };
}

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: async () => body,
  } as unknown as Response;
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

function activeFetchCount(spy: ReturnType<typeof vi.fn>) {
  return spy.mock.calls.filter(([url]) => String(url).includes('/api/documents?status=QUEUED'))
    .length;
}

function renderProvider() {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      <ActiveUploadsProvider>
        <div />
      </ActiveUploadsProvider>
    </NextIntlClientProvider>,
  );
}

describe('<ActiveUploadsProvider />', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    setVisibility('visible');
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('para de pollar quando a lista ativa volta vazia', async () => {
    fetchSpy.mockImplementation((url: string) => {
      if (url.includes('status=QUEUED')) return Promise.resolve(jsonResponse([]));
      return Promise.resolve(jsonResponse([]));
    });

    renderProvider();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const initial = activeFetchCount(fetchSpy);
    expect(initial).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });
    expect(activeFetchCount(fetchSpy)).toBe(initial);
  });

  it('aplica backoff exponencial enquanto o trabalho não muda', async () => {
    const doc = makeDoc('a', 'QUEUED');
    fetchSpy.mockImplementation((url: string) => {
      if (url.includes('status=QUEUED')) return Promise.resolve(jsonResponse([doc]));
      return Promise.resolve(jsonResponse([]));
    });

    renderProvider();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(activeFetchCount(fetchSpy)).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(activeFetchCount(fetchSpy)).toBe(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(activeFetchCount(fetchSpy)).toBe(3);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });
    expect(activeFetchCount(fetchSpy)).toBe(4);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });
    expect(activeFetchCount(fetchSpy)).toBe(5);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });
    expect(activeFetchCount(fetchSpy)).toBe(6);
  });

  it('reseta o backoff quando a composição da lista muda', async () => {
    const responses: DocumentSummary[][] = [
      [makeDoc('a', 'QUEUED')],
      [makeDoc('a', 'QUEUED')],
      [makeDoc('a', 'OCR_RUNNING')],
      [makeDoc('a', 'OCR_RUNNING')],
    ];
    let i = 0;
    fetchSpy.mockImplementation((url: string) => {
      if (url.includes('status=QUEUED')) {
        const body = responses[Math.min(i++, responses.length - 1)];
        return Promise.resolve(jsonResponse(body));
      }
      return Promise.resolve(jsonResponse([]));
    });

    renderProvider();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(activeFetchCount(fetchSpy)).toBe(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(activeFetchCount(fetchSpy)).toBe(3);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(activeFetchCount(fetchSpy)).toBe(4);
  });

  it('pausa polling quando a aba fica oculta e retoma ao voltar visível', async () => {
    const doc = makeDoc('a', 'QUEUED');
    fetchSpy.mockImplementation((url: string) => {
      if (url.includes('status=QUEUED')) return Promise.resolve(jsonResponse([doc]));
      return Promise.resolve(jsonResponse([]));
    });

    renderProvider();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(activeFetchCount(fetchSpy)).toBe(1);

    await act(async () => {
      setVisibility('hidden');
      await vi.advanceTimersByTimeAsync(20_000);
    });
    expect(activeFetchCount(fetchSpy)).toBe(1);

    await act(async () => {
      setVisibility('visible');
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(activeFetchCount(fetchSpy)).toBe(2);
  });

  it('acorda do estado idle quando recebe upload-queued event', async () => {
    fetchSpy.mockImplementation((url: string) => {
      if (url.includes('status=QUEUED')) return Promise.resolve(jsonResponse([]));
      return Promise.resolve(jsonResponse([]));
    });

    renderProvider();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(activeFetchCount(fetchSpy)).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(activeFetchCount(fetchSpy)).toBe(1);

    await act(async () => {
      window.dispatchEvent(new CustomEvent(UPLOAD_QUEUED_EVENT));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(activeFetchCount(fetchSpy)).toBe(2);
  });
});
