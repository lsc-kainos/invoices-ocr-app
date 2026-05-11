'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRunDetail } from './use-run-detail';
import type { BenchmarkRunDetailDto } from '@invoices-ocr/shared-types';
import { cn } from '@/lib/utils';

interface RunDetailDialogProps {
  runId: string | null;
  onClose: () => void;
}

type DetailTab = 'aggregate' | 'samples' | 'prompt';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.round((ms % 60000) / 1000);
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

/**
 * Run detail modal — refined editorial dark.
 *
 * - Fix de viewport: max-h-[85vh] + flex flex-col + overflow-hidden no
 *   DialogContent, header/footer shrink-0 e body com overflow-y-auto.
 *   Mesmo padrão do config-editor-drawer.
 * - Tabs internas (Resumo / Amostras / Prompt) com underline cobre.
 * - Prompt em <pre> mono dentro de caixa bg-muted/40.
 */
export function RunDetailDialog({ runId, onClose }: RunDetailDialogProps) {
  const t = useTranslations('benchmark');

  return (
    <Dialog
      open={runId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={cn(
          'bg-card text-card-foreground gap-0 p-0',
          'flex max-h-[85vh] w-full flex-col overflow-hidden sm:max-w-3xl',
        )}
        showCloseButton
      >
        {runId !== null ? (
          // key={runId} forces state (active tab) to reset between runs.
          <RunDetailBody key={runId} runId={runId} onClose={onClose} />
        ) : (
          <DialogHeader className="border-border/60 shrink-0 border-b px-6 py-4">
            <DialogTitle className="text-foreground text-base font-semibold tracking-tight">
              {t('detail.title')}
            </DialogTitle>
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RunDetailBody({ runId, onClose }: { runId: string; onClose: () => void }) {
  const t = useTranslations('benchmark');
  const { detail, isLoading, error } = useRunDetail(runId);
  const [tab, setTab] = useState<DetailTab>('aggregate');

  return (
    <>
      <DialogHeader className="border-border/60 shrink-0 border-b px-6 py-4">
        <span className="eyebrow">{t('tabs.history')}</span>
        <DialogTitle className="text-foreground text-base font-semibold tracking-tight">
          {t('detail.title')}
        </DialogTitle>
      </DialogHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isLoading && (
          <p className="text-muted-foreground px-6 py-5 text-sm" data-testid="detail-loading">
            {t('history.loading')}
          </p>
        )}

        {error && (
          <p className="text-destructive px-6 py-5 text-sm" data-testid="detail-error">
            {error}
          </p>
        )}

        {detail && (
          <>
            {/* Tab bar */}
            <nav
              className="border-border/40 shrink-0 border-b px-6"
              role="tablist"
              aria-label={t('detail.title')}
            >
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    { key: 'aggregate', label: t('detail.tabAggregate') },
                    { key: 'samples', label: t('detail.tabSamples') },
                    { key: 'prompt', label: t('detail.tabPrompt') },
                  ] as { key: DetailTab; label: string }[]
                ).map((tabItem) => {
                  const isActive = tab === tabItem.key;
                  return (
                    <button
                      key={tabItem.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      data-testid={`detail-tab-${tabItem.key}`}
                      onClick={() => setTab(tabItem.key)}
                      className={cn(
                        'relative -mb-px px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-out',
                        isActive
                          ? 'text-foreground border-primary border-b-2'
                          : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent',
                      )}
                    >
                      {tabItem.label}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Body — scroll interno */}
            <div className="flex-1 overflow-y-auto px-6 py-5" role="tabpanel">
              {tab === 'aggregate' && <AggregateTab detail={detail} t={t} />}
              {tab === 'samples' && <SamplesTab detail={detail} t={t} />}
              {tab === 'prompt' && <PromptTab detail={detail} t={t} />}
            </div>
          </>
        )}
      </div>

      <div className="border-border/60 bg-muted/30 flex shrink-0 justify-end gap-2 border-t px-6 py-3.5">
        <Button type="button" variant="default" onClick={onClose} data-testid="detail-close">
          {t('detail.close')}
        </Button>
      </div>
    </>
  );
}

type TFn = (key: string) => string;

function AggregateTab({ detail, t }: { detail: BenchmarkRunDetailDto; t: TFn }) {
  const score = Math.round(detail.aggregate.avgScore * 100);
  const lowScore = score < 50;

  return (
    <div className="flex flex-col gap-6">
      {/* Metadata grid */}
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <Meta label={t('detail.model')} value={detail.modelSnapshot} mono />
        <Meta label={t('detail.dataset')} value={detail.datasetVersion} />
        <Meta label={t('detail.duration')} value={formatDuration(detail.durationMs)} mono />
        <Meta label={t('detail.createdAt')} value={formatDate(detail.createdAt)} mono />
        <div className="sm:col-span-2">
          <Meta label={t('detail.runner')} value={detail.runByEmail} />
        </div>
      </dl>

      {/* Score card */}
      <div className="border-border bg-card border-l-primary flex flex-col gap-3 rounded-lg border border-l-2 p-5 shadow-sm">
        <span className="eyebrow">{t('detail.score')}</span>
        <span
          className={`font-serif-italic text-[44px] leading-none font-light tracking-tight tabular-nums ${
            lowScore ? 'text-destructive' : 'text-primary'
          }`}
          data-testid="detail-score"
        >
          {score}%
        </span>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="font-mono text-green-600 tabular-nums dark:text-green-400">
            {t('detail.passed')}: {detail.aggregate.passedCount}
          </span>
          <span className="text-destructive font-mono tabular-nums">
            {t('detail.failed')}: {detail.aggregate.failedCount}
          </span>
        </div>
      </div>
    </div>
  );
}

function SamplesTab({ detail, t }: { detail: BenchmarkRunDetailDto; t: TFn }) {
  return (
    <div className="border-border overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground text-left text-xs">
          <tr>
            <th className="px-3 py-2 font-medium">{t('detail.columnFile')}</th>
            <th className="w-24 px-3 py-2 font-medium">{t('detail.columnScore')}</th>
            <th className="px-3 py-2 font-medium">{t('detail.columnError')}</th>
          </tr>
        </thead>
        <tbody>
          {detail.results.map((r, i) => (
            <tr
              key={`${r.filename}-${i}`}
              className="border-border/60 hover:bg-muted/40 border-t transition-colors duration-150 ease-out"
            >
              <td className="text-foreground px-3 py-1.5 font-mono text-xs break-all">
                {r.filename}
              </td>
              <td className="px-3 py-1.5 font-mono text-xs tabular-nums">
                {r.score !== undefined ? `${Math.round(r.score * 100)}%` : '—'}
              </td>
              <td className="text-destructive px-3 py-1.5 font-mono text-xs break-all">
                {r.error ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PromptTab({ detail, t }: { detail: BenchmarkRunDetailDto; t: TFn }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="eyebrow">{t('detail.promptSnapshot')}</span>
      <pre className="bg-muted/40 text-foreground max-h-[280px] overflow-y-auto rounded-md p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
        {detail.promptSnapshot}
      </pre>
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <span
        className={cn(
          'text-foreground text-sm break-all',
          mono && 'font-mono text-xs tabular-nums',
        )}
      >
        {value}
      </span>
    </div>
  );
}
