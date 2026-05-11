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
      <section className="border-border bg-card flex flex-col items-start gap-3 rounded-lg border p-6">
        <p className="text-muted-foreground text-sm">{t('active.empty', { key: configKey })}</p>
        <Button onClick={() => onCreateFirst(configKey)}>{t('active.createFirst')}</Button>
      </section>
    );
  }

  const creator = config.createdByEmail ?? config.createdBy;

  return (
    <section
      data-testid="active-config-card"
      className="bg-card border-l-primary relative flex flex-col gap-4 rounded-lg border border-l-4 p-6 shadow-sm"
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
        <Badge variant="default" className="tracking-wide uppercase">
          {t('active.label')}
        </Badge>
        <span className="text-foreground font-mono">v{config.version}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground font-mono text-xs">{config.model}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground text-xs">{t('active.by', { who: creator })}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground text-xs">{formatDate(config.createdAt)}</span>
      </header>

      <div className="flex flex-col gap-1.5">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {t('editor.prompt')}
        </span>
        <pre
          data-testid="active-prompt"
          className="bg-muted/40 border-border text-foreground max-h-[280px] overflow-y-auto rounded-md border p-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap"
        >
          {config.prompt}
        </pre>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-xs">
          <span className="text-foreground font-medium">{t('editor.temperature')}:</span>{' '}
          <span className="font-mono">{tempFrom(config.params)}</span>
        </p>
        <p className="text-muted-foreground text-xs">
          <span className="text-foreground font-medium">{t('editor.notes')}:</span>{' '}
          {config.notes && config.notes.trim() !== '' ? config.notes : '—'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button onClick={() => onCloneFromActive(config)}>{t('active.newFromThis')}</Button>
        <Button variant="outline" onClick={() => onTest(config)}>
          {t('actions.test')}
        </Button>
      </div>
    </section>
  );
}
