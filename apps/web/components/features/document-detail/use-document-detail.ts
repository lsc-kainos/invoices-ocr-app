'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DocumentDetail } from '@invoices-ocr/shared-types';

const POLL_MS = 1500;

export function useDocumentDetail(initial: DocumentDetail) {
  const [doc, setDoc] = useState<DocumentDetail>(initial);
  const router = useRouter();

  useEffect(() => {
    if (
      initial.status === 'READY' ||
      initial.status === 'FAILED' ||
      initial.status === 'REJECTED'
    ) {
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const res = await fetch(`/api/documents/${initial.id}`);
        if (!res.ok) {
          if (alive) timer = setTimeout(tick, POLL_MS);
          return;
        }
        const next = (await res.json()) as DocumentDetail;
        if (!alive) return;
        setDoc(next);
        if (next.status === 'READY' || next.status === 'FAILED' || next.status === 'REJECTED') {
          // re-roda o RSC para repopular initial e cache server-side
          router.refresh();
          return;
        }
        timer = setTimeout(tick, POLL_MS);
      } catch {
        if (alive) timer = setTimeout(tick, POLL_MS);
      }
    };

    void tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id]);

  return doc;
}
