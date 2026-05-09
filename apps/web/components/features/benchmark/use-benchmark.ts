'use client';
import { useState, useCallback } from 'react';

export type FieldResult = { extracted: string | null; expected: string | null; match: boolean };
export type ImageResult = {
  index: number;
  total: number;
  filename: string;
  score?: { correct: number; presentInGT: number; score: number };
  fieldResults?: Record<string, FieldResult>;
  narrative?: string;
  error?: string;
};
export type Aggregate = {
  avgScore: number;
  perField: Record<string, { correct: number; total: number; accuracy: number }>;
};

export function useBenchmark() {
  const [results, setResults] = useState<ImageResult[]>([]);
  const [aggregate, setAggregate] = useState<Aggregate | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setRunning(true);
    setResults([]);
    setAggregate(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/benchmark', { method: 'POST' });
      if (!res.ok || !res.body) {
        setError(`HTTP ${res.status}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') {
            reader.cancel();
            return;
          }
          try {
            const event = JSON.parse(payload);
            if (event.type === 'progress') {
              setProgress({ current: event.index, total: event.total });
              setResults((prev) => [...prev, event as ImageResult]);
            } else if (event.type === 'complete') {
              setAggregate(event.aggregate as Aggregate);
            }
          } catch {
            /* ignore malformed */
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setRunning(false);
    }
  }, []);

  return { run, running, progress, results, aggregate, error };
}
