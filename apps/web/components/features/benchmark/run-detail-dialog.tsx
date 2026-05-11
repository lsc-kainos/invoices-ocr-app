'use client';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useRunDetail } from './use-run-detail';

interface RunDetailDialogProps {
  runId: string | null;
  onClose: () => void;
}

export function RunDetailDialog({ runId, onClose }: RunDetailDialogProps) {
  const t = useTranslations('benchmark');
  const { detail, isLoading, error } = useRunDetail(runId);

  return (
    <Dialog
      open={runId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('detail.title')}</DialogTitle>
        </DialogHeader>

        {isLoading && <p className="text-muted-foreground text-sm">{t('history.loading')}</p>}

        {error && <p className="text-destructive text-sm">{error}</p>}

        {detail && (
          <div className="flex flex-col gap-6">
            {/* Metadata */}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">{t('detail.model')}</dt>
                <dd className="font-mono text-xs">{detail.modelSnapshot}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t('detail.dataset')}</dt>
                <dd>{detail.datasetVersion}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t('detail.duration')}</dt>
                <dd className="tabular-nums">{detail.durationMs}ms</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t('detail.createdAt')}</dt>
                <dd className="tabular-nums">
                  {new Date(detail.createdAt).toLocaleString('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground text-xs">{t('detail.runner')}</dt>
                <dd>{detail.runByEmail}</dd>
              </div>
            </dl>

            {/* Aggregate */}
            <div className="bg-card rounded-md border p-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-semibold tabular-nums">
                  {Math.round(detail.aggregate.avgScore * 100)}%
                </span>
                <span className="text-muted-foreground text-sm">{t('detail.score')}</span>
              </div>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-green-600 dark:text-green-400">
                  {t('detail.passed')}: {detail.aggregate.passedCount}
                </span>
                <span className="text-destructive">
                  {t('detail.failed')}: {detail.aggregate.failedCount}
                </span>
              </div>
            </div>

            {/* Prompt snapshot */}
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                {t('detail.promptSnapshot')}
              </p>
              <pre className="bg-muted max-h-32 overflow-y-auto rounded-md p-3 text-xs whitespace-pre-wrap">
                {detail.promptSnapshot}
              </pre>
            </div>

            {/* Per-sample results */}
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                {t('detail.results')}
              </p>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
                    <tr>
                      <th className="px-3 py-2">Arquivo</th>
                      <th className="px-3 py-2">Score</th>
                      <th className="px-3 py-2">Erro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.results.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-1 font-mono text-xs">{r.filename}</td>
                        <td className="px-3 py-1 tabular-nums">
                          {r.score !== undefined ? `${Math.round(r.score * 100)}%` : '—'}
                        </td>
                        <td className="text-destructive px-3 py-1 text-xs">{r.error ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="bg-muted text-foreground rounded-md px-4 py-2 text-sm font-medium"
          >
            {t('detail.close')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
