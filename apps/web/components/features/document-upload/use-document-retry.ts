'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { UPLOAD_QUEUED_EVENT } from '../active-uploads/events';

export function useDocumentRetry() {
  const t = useTranslations('upload.retry');
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const retry = useCallback(
    async (docId: string, filename: string) => {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.add(docId);
        return next;
      });
      try {
        const res = await fetch(`/api/documents/${docId}/retry`, {
          method: 'POST',
        });
        if (!res.ok) {
          let reason = 'unknown';
          try {
            const body = (await res.json()) as { code?: string };
            reason = body.code ?? `http_${res.status}`;
          } catch {
            reason = `http_${res.status}`;
          }
          toast.error(t('failed', { name: filename, reason }));
          return;
        }
        toast.success(t('success', { name: filename }));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(UPLOAD_QUEUED_EVENT));
        }
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(docId);
          return next;
        });
      }
    },
    [t],
  );

  const isPending = useCallback((id: string) => pendingIds.has(id), [pendingIds]);

  return { retry, isPending };
}
