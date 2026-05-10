'use client';
import { useState, useEffect, useRef } from 'react';
import type { BenchmarkRunDetailDto } from '@invoices-ocr/shared-types';

export function useRunDetail(id: string | null) {
  const [detail, setDetail] = useState<BenchmarkRunDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    if (!id) {
      return () => {
        cancelledRef.current = true;
      };
    }

    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/benchmark/runs/${id}`);
        if (cancelledRef.current) return;
        if (!res.ok) {
          setError(`HTTP ${res.status}`);
          return;
        }
        const data = (await res.json()) as BenchmarkRunDetailDto;
        if (!cancelledRef.current) setDetail(data);
      } catch (e) {
        if (!cancelledRef.current) setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelledRef.current) setIsLoading(false);
      }
    };

    void fetchDetail();

    return () => {
      cancelledRef.current = true;
    };
  }, [id]);

  const resolvedDetail = id ? detail : null;

  return { detail: resolvedDetail, isLoading, error };
}
