'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MetricsResponseDto } from '@invoices-ocr/shared-types';

const POLL_INTERVAL_MS = 30_000;

// Module-level fetch — accepts state setters so useEffect never calls setState directly
async function doFetch(
  signal: AbortSignal | undefined,
  setData: (d: MetricsResponseDto) => void,
  setError: (e: string | null) => void,
  setIsLoading: (v: boolean) => void,
  setLastRefreshed: (d: Date) => void,
) {
  setIsLoading(true);
  try {
    const res = await fetch('/api/admin/usage', { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as MetricsResponseDto;
    setData(json);
    setError(null);
    setLastRefreshed(new Date());
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return;
    setError(err instanceof Error ? err.message : 'Erro desconhecido');
  } finally {
    setIsLoading(false);
  }
}

export function useUsage() {
  const [data, setData] = useState<MetricsResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Initial fetch with AbortController cleanup
  useEffect(() => {
    const controller = new AbortController();
    doFetch(controller.signal, setData, setError, setIsLoading, setLastRefreshed).catch(
      () => undefined,
    );
    return () => controller.abort();
  }, []);

  // 30s polling — skips when tab is hidden to avoid unnecessary requests
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        doFetch(undefined, setData, setError, setIsLoading, setLastRefreshed).catch(
          () => undefined,
        );
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(() => {
    doFetch(undefined, setData, setError, setIsLoading, setLastRefreshed).catch(() => undefined);
  }, []);

  return { data, isLoading, error, lastRefreshed, refresh };
}
