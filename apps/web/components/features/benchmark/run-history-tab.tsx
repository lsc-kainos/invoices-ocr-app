'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRunHistory } from './use-run-history';
import { RunHistoryTable } from './run-history-table';
import { RunDetailDialog } from './run-detail-dialog';
import { Button } from '@/components/ui/button';

interface RunHistoryTabProps {
  highlightRunId: string | null;
}

export function RunHistoryTab({ highlightRunId }: RunHistoryTabProps) {
  const t = useTranslations('benchmark');
  const { runs, isLoading, error, refresh } = useRunHistory();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div
        className="animate-config-reveal flex items-center justify-between gap-3"
        style={{ animationDelay: '120ms' }}
      >
        <div className="flex flex-col gap-0.5">
          <span className="eyebrow">{t('tabs.history')}</span>
          <h2 className="text-foreground text-sm font-medium tracking-tight">
            {t('history.title')}
          </h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
          data-testid="history-refresh"
        >
          {t('history.refresh')}
        </Button>
      </div>

      {isLoading && (
        <p className="text-muted-foreground text-sm" data-testid="history-loading">
          {t('history.loading')}
        </p>
      )}

      {error && (
        <div
          className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm"
          data-testid="history-error"
        >
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div className="animate-config-reveal" style={{ animationDelay: '180ms' }}>
          <RunHistoryTable
            runs={runs}
            highlightRunId={highlightRunId}
            onSelect={setSelectedRunId}
          />
        </div>
      )}

      <RunDetailDialog runId={selectedRunId} onClose={() => setSelectedRunId(null)} />
    </div>
  );
}
