'use client';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export function useDocumentDownload() {
  // useRef for synchronous in-flight guard (state updates are async in React)
  const inflightRef = useRef<Set<string>>(new Set());
  // useState for UI reactivity (isPending)
  const [pendingState, setPendingState] = useState<Set<string>>(new Set());
  const t = useTranslations('documents.download');

  const download = useCallback(
    async (documentId: string, suggestedFilename: string) => {
      if (inflightRef.current.has(documentId)) return;
      inflightRef.current.add(documentId);
      setPendingState((prev) => new Set(prev).add(documentId));

      try {
        const res = await fetch(`/api/documents/${documentId}/download`);
        if (res.status === 409) {
          toast.error(t('error_not_ready'));
          return;
        }
        if (!res.ok) {
          toast.error(t('error_generic'));
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${suggestedFilename}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        toast.error(t('error_generic'));
      } finally {
        inflightRef.current.delete(documentId);
        setPendingState((prev) => {
          const next = new Set(prev);
          next.delete(documentId);
          return next;
        });
      }
    },
    [t],
  );

  return { download, isPending: (id: string) => pendingState.has(id) };
}
