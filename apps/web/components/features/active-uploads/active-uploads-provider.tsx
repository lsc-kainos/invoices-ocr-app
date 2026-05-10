'use client';

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { DocumentSummary } from '@invoices-ocr/shared-types';
import { readLastSeen, writeLastSeen } from './last-seen-storage';
import { UPLOAD_QUEUED_EVENT } from './events';

export interface ActiveUploadsContextValue {
  activeUploads: DocumentSummary[];
  completedUploads: DocumentSummary[];
}

export const ActiveUploadsContext = createContext<ActiveUploadsContextValue | null>(null);

const INITIAL_DELAY_MS = 1500;
const MAX_DELAY_MS = 8000;
const ACTIVE_FILTER = 'QUEUED,OCR_RUNNING';
const FINISHED_FILTER = 'READY,FAILED';
const CATCHUP_LIMIT = 5;

type ToastFn = ReturnType<typeof useTranslations>;
type RouterPush = ReturnType<typeof useRouter>['push'];

function emitToast(doc: DocumentSummary, t: ToastFn, tErrors: ToastFn, push: RouterPush) {
  if (doc.status === 'READY') {
    toast.success(t('toasts.ready', { name: doc.filename }), {
      action: {
        label: t('toasts.view'),
        onClick: () => push(`/documents/${doc.id}`),
      },
    });
  } else if (doc.status === 'FAILED') {
    const reason = tErrors(doc.failureReason ?? 'unknown');
    toast.error(t('toasts.failed', { name: doc.filename, reason }));
  }
}

function listSignature(list: DocumentSummary[]): string {
  return list
    .map((d) => `${d.id}:${d.status}`)
    .sort()
    .join('|');
}

export function ActiveUploadsProvider({ children }: { children: ReactNode }) {
  const [activeUploads, setActiveUploads] = useState<DocumentSummary[]>([]);
  const [completedUploads, setCompletedUploads] = useState<DocumentSummary[]>([]);

  const addCompleted = useCallback((doc: DocumentSummary) => {
    setCompletedUploads((prev) => {
      const without = prev.filter((d) => d.id !== doc.id);
      return [doc, ...without].slice(0, 5);
    });
  }, []);

  const previousRef = useRef<Map<string, DocumentSummary>>(new Map());
  const router = useRouter();
  const t = useTranslations('upload');
  const tErrors = useTranslations('errors.ocr');

  useEffect(() => {
    let alive = true;
    const lastSeen = readLastSeen();
    const qs = new URLSearchParams({ status: FINISHED_FILTER });
    if (lastSeen) qs.set('updatedSince', lastSeen);

    fetch(`/api/documents?${qs}`)
      .then((r) => (r.ok ? (r.json() as Promise<DocumentSummary[]>) : []))
      .then((finished) => {
        if (!alive || !Array.isArray(finished)) return;
        const slice = finished.slice(0, CATCHUP_LIMIT);
        for (const d of slice) emitToast(d, t, tErrors, router.push);
        setCompletedUploads(slice);
      })
      .catch(() => undefined)
      .finally(() => writeLastSeen());
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;
    let delayMs = INITIAL_DELAY_MS;
    let lastSignature = '';

    const isHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

    const cancelTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const scheduleNext = () => {
      cancelTimer();
      if (!alive || isHidden()) return;
      const hasWork = previousRef.current.size > 0;
      if (!hasWork) return;
      timer = setTimeout(tick, delayMs);
    };

    const tick = async () => {
      if (!alive || inFlight) return;
      inFlight = true;
      try {
        const res = await fetch(`/api/documents?status=${ACTIVE_FILTER}`);
        const list = res.ok ? ((await res.json()) as DocumentSummary[]) : [];
        if (!alive) return;

        const newIds = new Set(list.map((d) => d.id));
        const transitions: Promise<void>[] = [];
        for (const [id, prev] of previousRef.current) {
          if (!newIds.has(id) && (prev.status === 'QUEUED' || prev.status === 'OCR_RUNNING')) {
            transitions.push(
              fetch(`/api/documents/${id}`)
                .then((r) => (r.ok ? (r.json() as Promise<DocumentSummary>) : Promise.reject()))
                .then((detail) => {
                  emitToast(detail, t, tErrors, router.push);
                  addCompleted(detail);
                })
                .catch(() => undefined),
            );
          }
        }
        await Promise.all(transitions);
        previousRef.current = new Map(list.map((d) => [d.id, d]));
        setActiveUploads(list);

        const signature = listSignature(list);
        const hasRunning = list.some((d) => d.status === 'OCR_RUNNING');
        if (signature !== lastSignature || hasRunning) {
          delayMs = INITIAL_DELAY_MS;
        } else {
          delayMs = Math.min(delayMs * 2, MAX_DELAY_MS);
        }
        lastSignature = signature;
      } catch {
        // erro de rede — silencioso, próximo tick tenta de novo
      } finally {
        inFlight = false;
        scheduleNext();
      }
    };

    const wake = () => {
      if (!alive || isHidden()) return;
      delayMs = INITIAL_DELAY_MS;
      cancelTimer();
      void tick();
    };

    const onVisibilityChange = () => {
      if (isHidden()) {
        cancelTimer();
      } else {
        wake();
      }
    };

    void tick();

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener(UPLOAD_QUEUED_EVENT, wake);
    }

    return () => {
      alive = false;
      cancelTimer();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener(UPLOAD_QUEUED_EVENT, wake);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const flush = () => writeLastSeen();
    const interval = setInterval(flush, 30_000);
    window.addEventListener('beforeunload', flush);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', flush);
    };
  }, []);

  return (
    <ActiveUploadsContext.Provider value={{ activeUploads, completedUploads }}>
      {children}
    </ActiveUploadsContext.Provider>
  );
}
