'use client';
import { useState, useCallback, useEffect } from 'react';
import type { BenchmarkRunDto } from '@invoices-ocr/shared-types';

export function useRunHistory() {
  const [runs, setRuns] = useState<BenchmarkRunDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async (limit?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = limit ? `/api/admin/benchmark/runs?limit=${limit}` : `/api/admin/benchmark/runs`;
      const res = await fetch(url);
      if (!res.ok) {
        setError(`HTTP ${res.status}`);
        return;
      }
      const data = (await res.json()) as BenchmarkRunDto[];
      setRuns(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    void fetchRuns();
  }, [fetchRuns]);

  const loadMore = useCallback(() => {
    void fetchRuns(100);
  }, [fetchRuns]);

  useEffect(() => {
    void fetchRuns();
  }, [fetchRuns]);

  return { runs, isLoading, error, refresh, loadMore };
}
