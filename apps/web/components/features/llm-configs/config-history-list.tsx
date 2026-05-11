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
    <div className="border-border overflow-hidden rounded-lg border">
      <ul className="divide-border divide-y">
        {rows.map((cfg) => {
          const creator = cfg.createdByEmail ?? cfg.createdBy;
          return (
            <li
              key={cfg.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm"
              data-testid={`history-row-${cfg.id}`}
            >
              <span className="text-muted-foreground w-10 font-mono">v{cfg.version}</span>
              <span className="flex-1 truncate font-mono text-xs">{cfg.model}</span>
              <span className="text-muted-foreground text-xs">{formatDate(cfg.createdAt)}</span>
              <span className="text-muted-foreground hidden text-xs sm:inline">
                {t('active.by', { who: creator })}
              </span>
              <div className="flex shrink-0 gap-1">
                <Button size="xs" variant="ghost" onClick={() => onView(cfg)}>
                  {t('actions.view')}
                </Button>
                <Button size="xs" variant="outline" onClick={() => onActivate(cfg)}>
                  {t('actions.activate')}
                </Button>
                <Button size="xs" variant="ghost" onClick={() => onTest(cfg)}>
                  {t('actions.test')}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
