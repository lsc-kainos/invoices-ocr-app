'use client';

import { useEffect, useState } from 'react';
import type { DocumentEditDto } from '@invoices-ocr/shared-types';

interface UseEditHistoryState {
  edits: DocumentEditDto[];
  isLoading: boolean;
  error: string | null;
  // chave da resposta atual — se docId/verifiedAt mudar, descartamos respostas
  // antigas e mostramos loading derivado.
  key: string;
}

function makeKey(documentId: string, verifiedAt: string | null): string {
  return `${documentId}:${verifiedAt ?? ''}`;
}

export function useEditHistory(
  documentId: string,
  verifiedAt: string | null,
): { edits: DocumentEditDto[]; isLoading: boolean; error: string | null } {
  const currentKey = makeKey(documentId, verifiedAt);
  const [state, setState] = useState<UseEditHistoryState>({
    edits: [],
    isLoading: true,
    error: null,
    key: currentKey,
  });

  useEffect(() => {
    let alive = true;

    fetch(`/api/documents/${encodeURIComponent(documentId)}/edits`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`http_${res.status}`);
        }
        return (await res.json()) as DocumentEditDto[];
      })
      .then((edits) => {
        if (!alive) return;
        setState({ edits, isLoading: false, error: null, key: currentKey });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        const msg = err instanceof Error ? err.message : 'unknown';
        setState({ edits: [], isLoading: false, error: msg, key: currentKey });
      });

    return () => {
      alive = false;
    };
    // Refetch quando uma nova edição é persistida (verifiedAt muda).
  }, [documentId, verifiedAt, currentKey]);

  // Loading derivado: se a key mudou (deps mudaram) mas o último state ainda
  // é da key anterior, considerar isLoading=true sem disparar setState dentro
  // do efeito (que dispararia render em cascata e o linter avisa).
  const isStaleKey = state.key !== currentKey;
  return {
    edits: isStaleKey ? [] : state.edits,
    isLoading: isStaleKey ? true : state.isLoading,
    error: isStaleKey ? null : state.error,
  };
}
