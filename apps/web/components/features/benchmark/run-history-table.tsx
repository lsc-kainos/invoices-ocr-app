'use client';
import { useTranslations } from 'next-intl';
import type { BenchmarkRunDto } from '@invoices-ocr/shared-types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RunHistoryTableProps {
  runs: BenchmarkRunDto[];
  highlightRunId: string | null;
  onSelect: (id: string) => void;
}

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
 * Run history list — refined editorial dark.
 *
 * - Cada row é um card horizontal: score grande em serif italic light + metadata
 *   técnica em mono + botão "Ver" à direita.
 * - Run destacado (recém-salvo) usa border-l-2 cobre, não bg primary forte.
 * - Hover bg-muted/40, divisores sutis entre rows.
 */
export function RunHistoryTable({ runs, highlightRunId, onSelect }: RunHistoryTableProps) {
  const t = useTranslations('benchmark');

  if (runs.length === 0) {
    return (
      <p className="text-muted-foreground py-3 text-sm" data-testid="history-empty">
        {t('history.empty')}
      </p>
    );
  }

  return (
    <ul
      className="border-border bg-card overflow-hidden rounded-lg border shadow-sm"
      data-testid="history-list"
    >
      {runs.map((run, idx) => {
        const score = Math.round(run.aggregate.avgScore * 100);
        const isHighlighted = run.id === highlightRunId;
        const lowScore = score < 50;

        return (
          <li
            key={run.id}
            className={cn(
              'animate-config-reveal hover:bg-muted/40 border-border/60 transition-colors duration-150 ease-out not-first:border-t',
              isHighlighted && 'border-l-primary border-l-2',
            )}
            style={{ animationDelay: `${180 + idx * 60}ms` }}
            data-testid={`history-row-${run.id}`}
          >
            <div className="grid grid-cols-1 items-center gap-x-6 gap-y-2 px-4 py-3.5 sm:grid-cols-[80px_1fr_auto] sm:px-5">
              {/* Score display */}
              <span
                className={cn(
                  'font-serif-italic text-2xl leading-none font-light tabular-nums',
                  lowScore ? 'text-destructive' : 'text-primary',
                )}
              >
                {score}%
              </span>

              {/* Metadata */}
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-foreground truncate font-mono text-xs">
                  {run.modelSnapshot}
                </span>
                <span className="text-muted-foreground/80 truncate font-mono text-[11px] tabular-nums">
                  {formatDate(run.createdAt)} · {run.sampleCount}{' '}
                  {t('history.columnSamples').toLowerCase()} · {formatDuration(run.durationMs)}
                </span>
              </div>

              {/* Action */}
              <div className="flex shrink-0 justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelect(run.id)}
                  data-testid={`history-view-${run.id}`}
                >
                  {t('history.view')}
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
