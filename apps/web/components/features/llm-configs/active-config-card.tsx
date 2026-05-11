'use client';
import { useTranslations } from 'next-intl';
import type { LlmConfigDto, LlmConfigKey } from '@invoices-ocr/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function tempFrom(params: Record<string, unknown>): string {
  const v = params?.temperature;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'string' && v.trim() !== '') return v;
  return '—';
}

interface ActiveConfigCardProps {
  config: LlmConfigDto | undefined;
  configKey: LlmConfigKey;
  onCloneFromActive: (cfg: LlmConfigDto) => void;
  onTest: (cfg: LlmConfigDto) => void;
  onCreateFirst: (key: LlmConfigKey) => void;
}

/**
 * Active config card — refined editorial dark.
 *
 * - Card com border 1px + shadow-sm + border-l-2 cobre como accent vertical.
 * - Versão grande em serif italic light (var(--font-serif)).
 * - Eyebrows sobre metadata. Prompt em mono dentro de caixa muted.
 * - Botões shadcn (Button) — case normal pt-BR.
 */
export function ActiveConfigCard({
  config,
  configKey,
  onCloneFromActive,
  onTest,
  onCreateFirst,
}: ActiveConfigCardProps) {
  const t = useTranslations('admin.llmConfigs');

  if (!config) {
    return (
      <section
        className="border-border bg-card animate-config-reveal flex flex-col items-start gap-4 rounded-lg border p-6 shadow-sm sm:p-8"
        style={{ animationDelay: '120ms' }}
        data-testid="active-config-empty"
      >
        <p className="text-muted-foreground text-sm">{t('active.empty', { key: configKey })}</p>
        <Button
          type="button"
          onClick={() => onCreateFirst(configKey)}
          data-testid="active-create-first"
          variant="default"
        >
          {t('active.createFirst')}
        </Button>
      </section>
    );
  }

  const creator = config.createdByEmail ?? config.createdBy;
  const temp = tempFrom(config.params);
  const date = formatDate(config.createdAt);

  return (
    <section
      data-testid="active-config-card"
      className="border-border bg-card border-l-primary animate-config-reveal relative flex flex-col gap-6 rounded-lg border border-l-2 p-6 shadow-sm sm:p-8"
      style={{ animationDelay: '120ms' }}
    >
      {/* Top row: badge + version */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Badge
            variant="default"
            className="rounded-md px-2 text-[10px] font-semibold tracking-wider uppercase"
          >
            {t('active.label')}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {configKey === 'EXTRACTOR' ? 'Extractor' : 'Chat'}
          </span>
        </div>

        <span
          data-testid="active-version"
          className="font-serif-italic text-primary text-[44px] leading-none font-light tracking-tight sm:text-[56px]"
        >
          v{config.version}
        </span>
      </div>

      {/* Metadata strip */}
      <header className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="text-foreground font-medium">{config.model}</span>
        <span aria-hidden>·</span>
        <span>
          {t('active.metaTemp')} {temp}
        </span>
        <span aria-hidden>·</span>
        <span className="break-all">{t('active.by', { who: creator })}</span>
        <span aria-hidden>·</span>
        <span>{date}</span>
      </header>

      {/* Prompt block */}
      <div className="flex flex-col gap-2">
        <span className="eyebrow">{t('active.promptLabel')}</span>
        <pre
          data-testid="active-prompt"
          className="bg-muted/40 text-foreground max-h-[280px] overflow-y-auto rounded-md p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap"
        >
          {config.prompt}
        </pre>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1">
        <span className="eyebrow">{t('active.notesLabel')}</span>
        <p className="text-foreground text-sm">
          {config.notes && config.notes.trim() !== '' ? config.notes : '—'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          onClick={() => onCloneFromActive(config)}
          data-testid="active-fork"
          variant="default"
        >
          {t('active.newFromThis')}
        </Button>
        <Button
          type="button"
          onClick={() => onTest(config)}
          data-testid="active-test"
          variant="outline"
        >
          {t('actions.test')}
        </Button>
      </div>
    </section>
  );
}
