'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DocumentDetail } from '@invoices-ocr/shared-types';

const POLL_MS = 1500;

export function useDocumentDetail(initial: DocumentDetail) {
  // Mantém o último doc obtido pelo polling. O `doc` retornado é sempre
  // o mais recente entre (initial do RSC, polledDoc) — comparando por
  // updatedAt. Assim, quando router.refresh() faz o RSC re-render com
  // novo `initial` (e.g. status FAILED), a UI sincroniza imediatamente
  // sem precisar de useEffect+setState (anti-padrão "sync prop to state").
  const [polledDoc, setPolledDoc] = useState<DocumentDetail | null>(null);
  const router = useRouter();

  const doc =
    polledDoc && polledDoc.id === initial.id && polledDoc.updatedAt >= initial.updatedAt
      ? polledDoc
      : initial;

  useEffect(() => {
    if (initial.status === 'READY' || initial.status === 'FAILED') {
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
        setPolledDoc(next);
        if (next.status === 'READY' || next.status === 'FAILED') {
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
