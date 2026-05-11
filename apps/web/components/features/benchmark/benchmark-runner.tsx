'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBenchmark } from './use-benchmark';
import { BenchmarkTable } from './benchmark-table';
import { BenchmarkAggregate } from './benchmark-aggregate';
import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';

interface BenchmarkRunnerProps {
  onViewHistory?: (runId: string) => void;
}

/**
 * Benchmark runner — refined editorial dark.
 *
 * - Card de run em andamento com border-l-2 cobre.
 * - Barra de progresso fina (h-1) com tom primary, sem gradiente brutalist.
 * - Métricas e tabelas em sans + mono só nos dados técnicos.
 */
export function BenchmarkRunner({ onViewHistory }: BenchmarkRunnerProps) {
  const t = useTranslations('benchmark');
  const { run, running, progress, results, aggregate, error, savedRunId } = useBenchmark();
  const [dismissed, setDismissed] = useState(false);

  const showProgress = running || progress.current > 0;
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const showBanner = savedRunId !== null && !dismissed;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Run trigger row */}
      <div
        className="animate-config-reveal flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        style={{ animationDelay: '120ms' }}
      >
        <div className="flex flex-col gap-1">
          <span className="eyebrow">{t('runner.progressLabel')}</span>
          <p className="text-foreground text-sm">
            {running
              ? t('runner.running')
              : progress.current > 0
                ? `${progress.current} / ${progress.total}`
                : '—'}
          </p>
        </div>
        <Button
          type="button"
          variant="default"
          onClick={() => {
            setDismissed(false);
            void run();
          }}
          disabled={running}
          data-testid="benchmark-run-button"
          className="w-full sm:w-auto"
        >
          {running ? t('runner.running') : t('runner.button')}
        </Button>
      </div>

      {/* Saved banner */}
      {showBanner && (
        <div
          className="border-border bg-card border-l-primary animate-config-reveal flex items-center justify-between gap-3 rounded-lg border border-l-2 px-4 py-3 text-sm shadow-sm"
          style={{ animationDelay: '160ms' }}
          data-testid="benchmark-saved-banner"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-foreground font-medium">{t('runner.saved')}</span>
            <button
              type="button"
              className="text-primary text-xs underline-offset-2 hover:underline"
              onClick={() => {
                if (savedRunId) onViewHistory?.(savedRunId);
              }}
            >
              {t('runner.viewHistory')}
            </button>
          </div>
          <button
            type="button"
            aria-label={t('runner.dismiss')}
            className="text-muted-foreground hover:text-foreground -mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-150 ease-out"
            onClick={() => setDismissed(true)}
          >
            <XIcon className="size-4" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm"
          data-testid="benchmark-error"
        >
          {error}
        </div>
      )}

      {/* Progress card */}
      {showProgress && (
        <section
          className="border-border bg-card border-l-primary animate-config-reveal flex flex-col gap-4 rounded-lg border border-l-2 p-5 shadow-sm sm:p-6"
          style={{ animationDelay: '180ms' }}
          data-testid="benchmark-progress-card"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="eyebrow">{t('runner.progressLabel')}</span>
            <span className="text-muted-foreground font-mono text-xs tabular-nums">
              {progress.current} / {progress.total} · {pct}%
            </span>
          </div>
          <div
            className="bg-muted h-1 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="bg-primary h-full rounded-full transition-[width] duration-200 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </section>
      )}

      {/* Aggregate */}
      {aggregate && (
        <div
          className="animate-config-reveal"
          style={{ animationDelay: '220ms' }}
          data-testid="benchmark-aggregate-wrapper"
        >
          <BenchmarkAggregate aggregate={aggregate} />
        </div>
      )}

      {/* Results table */}
      <div
        className="animate-config-reveal"
        style={{ animationDelay: '260ms' }}
        data-testid="benchmark-table-wrapper"
      >
        <BenchmarkTable results={results} />
      </div>
    </div>
  );
}
