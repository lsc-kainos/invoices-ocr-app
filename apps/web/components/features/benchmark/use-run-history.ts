'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { BenchmarkRunDto } from '@invoices-ocr/shared-types';

async function doFetch(
  limit: number | undefined,
  signal: AbortSignal,
  setRuns: (r: BenchmarkRunDto[]) => void,
  setError: (e: string | null) => void,
  setIsLoading: (v: boolean) => void,
) {
  setIsLoading(true);
  setError(null);
  try {
    const url = limit ? `/api/admin/benchmark/runs?limit=${limit}` : `/api/admin/benchmark/runs`;
    const res = await fetch(url, { signal });
    if (!res.ok) {
      setError(`HTTP ${res.status}`);
      return;
    }
    const data = (await res.json()) as BenchmarkRunDto[];
    setRuns(data);
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return;
    setError(e instanceof Error ? e.message : 'Unknown error');
  } finally {
    setIsLoading(false);
  }
}

export function useRunHistory() {
  const [runs, setRuns] = useState<BenchmarkRunDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limitRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    const limit = limitRef.current;
    doFetch(limit, controller.signal, setRuns, setError, setIsLoading).catch(() => undefined);
    return () => {
      controller.abort();
    };
  }, []);

  const refresh = useCallback(() => {
    const controller = new AbortController();
    doFetch(limitRef.current, controller.signal, setRuns, setError, setIsLoading).catch(
      () => undefined,
    );
  }, []);

  const loadMore = useCallback(() => {
    limitRef.current = 100;
    const controller = new AbortController();
    doFetch(100, controller.signal, setRuns, setError, setIsLoading).catch(() => undefined);
  }, []);

  return { runs, isLoading, error, refresh, loadMore };
}
