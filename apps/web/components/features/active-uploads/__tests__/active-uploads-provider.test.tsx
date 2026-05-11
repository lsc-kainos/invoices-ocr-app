import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/pt-BR.json';
import type { DocumentSummary } from '@invoices-ocr/shared-types';
import { ActiveUploadsContext, ActiveUploadsProvider } from '../active-uploads-provider';
import { UPLOAD_QUEUED_EVENT } from '../events';
import { useContext } from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
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
    duplicateOfId: null,
    duplicateReason: null,
    possibleDuplicateOfId: null,
    duplicateMatchStrength: null,
    documentType: null,
    confidence: null,
    rejectionReason: null,
    verifiedAt: null,
    verifiedBy: null,
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

// Component to inspect completedUploads from context
function CompletedReader() {
  const ctx = useContext(ActiveUploadsContext);
  const completed = ctx?.completedUploads ?? [];
  return <div data-testid="completed">{completed.map((d) => d.id).join(',')}</div>;
}

function renderWithReader() {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      <ActiveUploadsProvider>
        <CompletedReader />
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

  it('quando OCR_RUNNING persiste (mesma signature), mantém delay em 1500ms', async () => {
    // Tick 1 (0ms): QUEUED — initial fetch
    // Tick 2 (1500ms): QUEUED again — no change, delay doubles to 3000ms
    // Tick 3 (3000ms): OCR_RUNNING — signature changed, delay resets to 1500ms
    // Tick 4 (1500ms): OCR_RUNNING again — same signature, but hasRunning=true → delay stays 1500ms
    // Tick 5 should fire after 1500ms, not 3000ms
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
    // Tick 1: QUEUED
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(activeFetchCount(fetchSpy)).toBe(1);

    // Tick 2: QUEUED (no change → delay doubles to 3000ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(activeFetchCount(fetchSpy)).toBe(2);

    // Tick 3: OCR_RUNNING (signature changes → delay resets to 1500ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(activeFetchCount(fetchSpy)).toBe(3);

    // Tick 4: OCR_RUNNING again (same signature, but hasRunning=true → delay stays 1500ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(activeFetchCount(fetchSpy)).toBe(4);

    // Tick 5: should fire after 1500ms (not 3000ms, because OCR_RUNNING keeps delay at minimum)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(activeFetchCount(fetchSpy)).toBe(5);
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

  it('catch-up ao montar popula completedUploads com docs finalizados', async () => {
    const readyDoc = makeDoc('r1', 'READY');
    const failedDoc = makeDoc('f1', 'FAILED');

    fetchSpy.mockImplementation((url: string) => {
      // catch-up: /api/documents?status=READY,FAILED
      if (url.includes('status=READY')) return Promise.resolve(jsonResponse([readyDoc, failedDoc]));
      // polling: /api/documents?status=QUEUED,OCR_RUNNING
      if (url.includes('status=QUEUED')) return Promise.resolve(jsonResponse([]));
      return Promise.resolve(jsonResponse([]));
    });

    const { getByTestId } = renderWithReader();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const ids = getByTestId('completed').textContent?.split(',').filter(Boolean) ?? [];
    expect(ids).toContain('r1');
    expect(ids).toContain('f1');
  });

  it('quando documento sai de OCR_RUNNING, aparece em completedUploads', async () => {
    const doc = makeDoc('ocr1', 'OCR_RUNNING');
    const readyDoc = makeDoc('ocr1', 'READY');

    let tick = 0;
    fetchSpy.mockImplementation((url: string) => {
      if (url.includes('status=READY')) return Promise.resolve(jsonResponse([])); // catch-up vazio
      if (url.includes('status=QUEUED')) {
        tick++;
        // Tick 1: doc is processing. Tick 2+: disappeared (transitioned to READY)
        return Promise.resolve(jsonResponse(tick === 1 ? [doc] : []));
      }
      // individual fetch after transition detected
      if (url.includes('/api/documents/ocr1')) return Promise.resolve(jsonResponse(readyDoc));
      return Promise.resolve(jsonResponse([]));
    });

    const { getByTestId } = renderWithReader();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0); // tick 1: doc in OCR_RUNNING enters previousRef
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500); // tick 2: doc gone → transition detected → fetch detail
    });

    expect(getByTestId('completed').textContent).toContain('ocr1');
  });

  it('completedUploads não ultrapassa 5 — o mais antigo é descartado (FIFO)', async () => {
    const docs = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'].map((id) => makeDoc(id, 'READY'));

    fetchSpy.mockImplementation((url: string) => {
      if (url.includes('status=READY')) return Promise.resolve(jsonResponse(docs));
      if (url.includes('status=QUEUED')) return Promise.resolve(jsonResponse([]));
      return Promise.resolve(jsonResponse([]));
    });

    const { getByTestId } = renderWithReader();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const ids = getByTestId('completed').textContent?.split(',').filter(Boolean) ?? [];
    expect(ids).toHaveLength(5);
    expect(ids).not.toContain('d6');
  });
});
