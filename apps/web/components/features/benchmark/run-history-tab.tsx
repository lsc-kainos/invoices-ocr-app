'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRunHistory } from './use-run-history';
import { RunHistoryTable } from './run-history-table';
import { RunDetailDialog } from './run-detail-dialog';

interface RunHistoryTabProps {
  highlightRunId: string | null;
}

export function RunHistoryTab({ highlightRunId }: RunHistoryTabProps) {
  const t = useTranslations('benchmark');
  const { runs, isLoading, error, refresh } = useRunHistory();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('history.title')}</h2>
        <button
          type="button"
          onClick={refresh}
          disabled={isLoading}
          className="bg-muted text-foreground rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {t('history.refresh')}
        </button>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">{t('history.loading')}</p>}

      {error && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <RunHistoryTable runs={runs} highlightRunId={highlightRunId} onSelect={setSelectedRunId} />
      )}

      <RunDetailDialog runId={selectedRunId} onClose={() => setSelectedRunId(null)} />
    </div>
  );
}
