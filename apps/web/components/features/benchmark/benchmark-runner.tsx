'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBenchmark } from './use-benchmark';
import { BenchmarkTable } from './benchmark-table';
import { BenchmarkAggregate } from './benchmark-aggregate';

interface BenchmarkRunnerProps {
  onViewHistory?: (runId: string) => void;
}

export function BenchmarkRunner({ onViewHistory }: BenchmarkRunnerProps) {
  const t = useTranslations('benchmark');
  const { run, running, progress, results, aggregate, error, savedRunId } = useBenchmark();
  const [dismissed, setDismissed] = useState(false);

  const showProgress = running || progress.current > 0;
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const showBanner = savedRunId !== null && !dismissed;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold sm:text-2xl">OCR Benchmark</h1>
        <button
          type="button"
          onClick={() => {
            setDismissed(false);
            void run();
          }}
          disabled={running}
          className="bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/40 h-11 w-full rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100 sm:h-9 sm:w-auto"
        >
          {running ? t('runner.running') : t('runner.button')}
        </button>
      </div>

      {showBanner && (
        <div className="border-primary/30 bg-primary/10 text-primary flex items-center justify-between rounded-md border p-3 text-sm">
          <span>
            ✓ {t('runner.saved')} —{' '}
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => {
                if (savedRunId) onViewHistory?.(savedRunId);
              }}
            >
              {t('runner.viewHistory')}
            </button>
          </span>
          <button
            type="button"
            aria-label="Fechar"
            className="ml-4 opacity-60 hover:opacity-100"
            onClick={() => setDismissed(true)}
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
          {error}
        </div>
      )}

      {showProgress && (
        <div className="flex flex-col gap-1">
          <div className="text-muted-foreground flex justify-between font-mono text-xs">
            <span>
              {progress.current} / {progress.total}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="from-primary/60 via-primary to-primary/80 h-full rounded-full bg-gradient-to-r transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <BenchmarkAggregate aggregate={aggregate} />
      <BenchmarkTable results={results} />
    </div>
  );
}
