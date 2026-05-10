'use client';
import { useState, useEffect } from 'react';
import type { BenchmarkRunDetailDto } from '@invoices-ocr/shared-types';

export function useRunDetail(id: string | null) {
  const [detail, setDetail] = useState<BenchmarkRunDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setDetail(null);
      return;
    }

    let cancelled = false;

    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/benchmark/runs/${id}`);
        if (cancelled) return;
        if (!res.ok) {
          setError(`HTTP ${res.status}`);
          return;
        }
        const data = (await res.json()) as BenchmarkRunDetailDto;
        if (!cancelled) setDetail(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { detail, isLoading, error };
}
