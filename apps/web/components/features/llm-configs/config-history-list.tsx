'use client';
import { useTranslations } from 'next-intl';
import type { LlmConfigDto } from '@invoices-ocr/shared-types';

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
 * Brutalist history list.
 *
 * - Sem caixa fechada — só divisores horizontais grossos entre rows.
 * - Hover na row inteira: bg-primary text-primary-foreground (sem easing).
 * - Versão como manchete pequena V{n}. em serif Times weight 900.
 * - Actions inline, mono ALL CAPS, sem ícones.
 */
export function ConfigHistoryList({ rows, onView, onActivate, onTest }: ConfigHistoryListProps) {
  const t = useTranslations('admin.llmConfigs');

  if (rows.length === 0) {
    return (
      <p
        className="text-muted-foreground py-3 font-mono text-xs tracking-wider uppercase"
        data-testid="history-empty"
      >
        {t('history.empty')}
      </p>
    );
  }

  return (
    <ul
      className="border-foreground divide-foreground divide-y-2 rounded-none border-y-2"
      data-testid="history-list"
    >
      {rows.map((cfg, idx) => {
        const creator = cfg.createdByEmail ?? cfg.createdBy;
        return (
          <li
            key={cfg.id}
            className="group/row hover:bg-primary hover:text-primary-foreground animate-brutal-reveal transition-none"
            style={{ animationDelay: `${240 + idx * 80}ms` }}
            data-testid={`history-row-${cfg.id}`}
          >
            <div className="grid grid-cols-1 items-center gap-x-6 gap-y-2 px-4 py-4 sm:grid-cols-[88px_1fr_auto] sm:px-6">
              {/* Version manchete */}
              <span className="font-brutal-display text-primary group-hover/row:text-primary-foreground text-3xl">
                V{cfg.version}.
              </span>

              {/* Model + metadata */}
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate font-mono text-xs font-semibold tracking-wider uppercase">
                  {cfg.model}
                </span>
                <span className="text-muted-foreground group-hover/row:text-primary-foreground/80 font-mono text-[11px] tracking-wider uppercase">
                  {formatDate(cfg.createdAt)} · v{cfg.version} · {t('active.by', { who: creator })}
                </span>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onView(cfg)}
                  data-testid={`history-view-${cfg.id}`}
                  className="border-foreground bg-background text-foreground group-hover/row:bg-primary-foreground group-hover/row:text-primary rounded-none border-2 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wider uppercase transition-none"
                >
                  {t('actions.view')}
                </button>
                <button
                  type="button"
                  onClick={() => onActivate(cfg)}
                  data-testid={`history-activate-${cfg.id}`}
                  className="border-foreground bg-foreground text-background group-hover/row:bg-primary-foreground group-hover/row:text-primary group-hover/row:border-primary-foreground rounded-none border-2 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wider uppercase transition-none"
                >
                  {t('actions.activate')}
                </button>
                <button
                  type="button"
                  onClick={() => onTest(cfg)}
                  data-testid={`history-test-${cfg.id}`}
                  className="border-foreground bg-background text-foreground group-hover/row:bg-primary-foreground group-hover/row:text-primary rounded-none border-2 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wider uppercase transition-none"
                >
                  {t('actions.test')}
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
