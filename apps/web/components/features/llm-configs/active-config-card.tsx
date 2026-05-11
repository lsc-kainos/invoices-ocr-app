'use client';
import { useTranslations } from 'next-intl';
import type { LlmConfigDto, LlmConfigKey } from '@invoices-ocr/shared-types';

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
 * Brutalist active config card — the manifesto block.
 *
 * - Border 2px foreground, sombra dura offset 4px 4px 0 0.
 * - V{n}. em serif Times 80px weight 900 (NÃO Instrument Serif italic).
 * - Eyebrows mono ALL CAPS terminando com ponto ou dois-pontos.
 * - Prompt em <pre> com border só top/bottom (caixa aberta, não fechada).
 * - Botões: sombra cobre, hover empurra 2px.
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
        className="border-foreground bg-card shadow-brutal animate-brutal-reveal flex flex-col items-start gap-4 rounded-none border-2 p-8"
        style={{ animationDelay: '160ms' }}
        data-testid="active-config-empty"
      >
        <p className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
          {t('active.empty', { key: configKey })}
        </p>
        <button
          type="button"
          onClick={() => onCreateFirst(configKey)}
          data-testid="active-create-first"
          className="border-foreground bg-foreground text-background shadow-brutal-primary rounded-none border-2 px-5 py-2 font-mono text-xs font-semibold tracking-wider uppercase"
        >
          {t('active.createFirst')}
        </button>
      </section>
    );
  }

  const creator = config.createdByEmail ?? config.createdBy;
  const temp = tempFrom(config.params);
  const date = formatDate(config.createdAt);

  return (
    <section
      data-testid="active-config-card"
      className="border-foreground bg-card shadow-brutal animate-brutal-reveal relative flex flex-col gap-6 rounded-none border-2 p-6 sm:p-8"
      style={{ animationDelay: '160ms' }}
    >
      {/* Manchete: V{n}. enorme, chapado, cobre */}
      <div className="flex flex-col gap-2">
        <span
          data-testid="active-version"
          className="font-brutal-display text-primary text-[64px] sm:text-[80px]"
        >
          V{config.version}.
        </span>
        <span aria-hidden className="brutal-double-rule w-12" />
      </div>

      {/* Metadata strip — mono ALL CAPS, separadores · */}
      <header className="text-foreground flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-wider uppercase">
        <span className="border-foreground bg-foreground text-background border-2 px-2 py-0.5 font-semibold">
          {t('active.label')}
        </span>
        <span className="text-muted-foreground">·</span>
        <span>v{config.version}</span>
        <span className="text-muted-foreground">·</span>
        <span>{config.model}</span>
        <span className="text-muted-foreground">·</span>
        <span>
          {t('active.metaTemp')} {temp}
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="break-all">{t('active.by', { who: creator })}</span>
        <span className="text-muted-foreground">·</span>
        <span>{date}</span>
      </header>

      {/* Prompt block — caixa aberta, só border top/bottom */}
      <div className="flex flex-col gap-3">
        <span className="text-foreground font-mono text-[11px] font-semibold tracking-[0.14em] uppercase">
          {t('active.promptLabel')}
        </span>
        <pre
          data-testid="active-prompt"
          className="border-foreground text-foreground max-h-[280px] overflow-y-auto border-y-2 py-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap"
        >
          {config.prompt}
        </pre>
      </div>

      {/* Notes — sempre presente, mono, com em-dash quando vazio */}
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground font-mono text-[11px] tracking-wider uppercase">
          {t('active.notesLabel')}{' '}
          <span className="text-foreground">
            {config.notes && config.notes.trim() !== '' ? config.notes : '—'}
          </span>
        </span>
      </div>

      {/* Actions — primary tem sombra cobre, secondary tem sombra foreground */}
      <div className="flex flex-wrap gap-4 pt-1">
        <button
          type="button"
          onClick={() => onCloneFromActive(config)}
          data-testid="active-fork"
          className="border-foreground bg-foreground text-background shadow-brutal-primary rounded-none border-2 px-5 py-2 font-mono text-xs font-semibold tracking-wider uppercase"
        >
          {t('active.newFromThis')}
        </button>
        <button
          type="button"
          onClick={() => onTest(config)}
          data-testid="active-test"
          className="border-foreground bg-background text-foreground shadow-brutal rounded-none border-2 px-5 py-2 font-mono text-xs font-semibold tracking-wider uppercase"
        >
          {t('actions.test')}
        </button>
      </div>
    </section>
  );
}
