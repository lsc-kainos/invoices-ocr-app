'use client';
import { useTranslations } from 'next-intl';
import type { LlmConfigDto } from '@invoices-ocr/shared-types';
import { Button } from '@/components/ui/button';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

interface ConfigHistoryListProps {
  /** Non-active versions (active is rendered in ActiveConfigCard). */
  rows: LlmConfigDto[];
  onView: (cfg: LlmConfigDto) => void;
  onActivate: (cfg: LlmConfigDto) => void;
  onTest: (cfg: LlmConfigDto) => void;
}

/**
 * History list — refined editorial dark.
 *
 * - Linhas com divisor sutil, hover bg-muted/40, transição rápida ease-out.
 * - Versão em serif italic light (continuidade com o active card).
 * - Botões shadcn Button compactos.
 */
export function ConfigHistoryList({ rows, onView, onActivate, onTest }: ConfigHistoryListProps) {
  const t = useTranslations('admin.llmConfigs');

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground py-3 text-sm" data-testid="history-empty">
        {t('history.empty')}
      </p>
    );
  }

  return (
    <ul
      className="border-border bg-card divide-border/60 overflow-hidden rounded-lg border shadow-sm"
      data-testid="history-list"
    >
      {rows.map((cfg, idx) => {
        const creator = cfg.createdByEmail ?? cfg.createdBy;
        return (
          <li
            key={cfg.id}
            className="group/row animate-config-reveal hover:bg-muted/40 border-border/60 not-first:border-t transition-colors duration-150 ease-out"
            style={{ animationDelay: `${180 + idx * 60}ms` }}
            data-testid={`history-row-${cfg.id}`}
          >
            <div className="grid grid-cols-1 items-center gap-x-6 gap-y-2 px-4 py-3 sm:grid-cols-[72px_1fr_auto] sm:px-5 sm:py-3.5">
              {/* Version display */}
              <span className="font-serif-italic text-primary text-2xl leading-none font-light">
                v{cfg.version}
              </span>

              {/* Model + metadata */}
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-foreground truncate text-sm font-medium">{cfg.model}</span>
                <span className="text-muted-foreground/80 truncate text-xs">
                  {formatDate(cfg.createdAt)} · {t('active.by', { who: creator })}
                </span>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onView(cfg)}
                  data-testid={`history-view-${cfg.id}`}
                >
                  {t('actions.view')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onTest(cfg)}
                  data-testid={`history-test-${cfg.id}`}
                >
                  {t('actions.test')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={() => onActivate(cfg)}
                  data-testid={`history-activate-${cfg.id}`}
                >
                  {t('actions.activate')}
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
