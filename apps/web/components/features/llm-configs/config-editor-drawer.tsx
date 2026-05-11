'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  AvailableModel,
  CreateLlmConfigInput,
  LlmConfigDto,
  LlmConfigKey,
} from '@invoices-ocr/shared-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModelSelect } from './model-select';
import { cn } from '@/lib/utils';

export type EditorMode =
  | { kind: 'closed' }
  | { kind: 'create-blank'; targetKey?: LlmConfigKey }
  | { kind: 'clone'; baseConfig: LlmConfigDto }
  | { kind: 'view'; baseConfig: LlmConfigDto };

interface ConfigEditorDrawerProps {
  mode: EditorMode;
  onClose: () => void;
  models: AvailableModel[];
  onSubmit: (input: CreateLlmConfigInput) => Promise<unknown>;
}

const DEFAULT_KEY: LlmConfigKey = 'EXTRACTOR';

function readTemperature(params: Record<string, unknown> | undefined): string {
  if (!params) return '0.2';
  const t = params.temperature;
  if (typeof t === 'number' && Number.isFinite(t)) return String(t);
  if (typeof t === 'string' && t.trim() !== '' && !Number.isNaN(Number(t))) return t;
  return '0.2';
}

function modeId(mode: EditorMode): string {
  if (mode.kind === 'clone' || mode.kind === 'view') return `${mode.kind}-${mode.baseConfig.id}`;
  if (mode.kind === 'create-blank') return `create-blank-${mode.targetKey ?? DEFAULT_KEY}`;
  return 'closed';
}

/**
 * Brutalist editor — Dialog shadcn estilizado pra raw.
 * - Container border-2 foreground + shadow-brutal-primary (sombra cobre).
 * - Header com EDITOR. eyebrow + subtítulo FROM V{n}. quando clonando.
 * - Inputs/textarea com border-2, rounded-none, mono font.
 * - Read-only: container vira bg-muted, inputs disabled com cursor:not-allowed.
 */
export function ConfigEditorDrawer({ mode, onClose, models, onSubmit }: ConfigEditorDrawerProps) {
  const open = mode.kind !== 'closed';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          // override defaults: no rounded, no ring, brutal shadow
          'border-foreground bg-card text-card-foreground rounded-none border-2 sm:max-w-2xl',
          'shadow-[6px_6px_0_0_var(--primary)] ring-0',
          'gap-0 p-0',
        )}
        showCloseButton={false}
      >
        {open && (
          <ConfigEditorForm
            // key forces state reset whenever the mode meaningfully changes
            key={modeId(mode)}
            mode={mode}
            models={models}
            onSubmit={onSubmit}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ConfigEditorFormProps {
  mode: Exclude<EditorMode, { kind: 'closed' }>;
  models: AvailableModel[];
  onSubmit: (input: CreateLlmConfigInput) => Promise<unknown>;
  onClose: () => void;
}

function ConfigEditorForm({ mode, models, onSubmit, onClose }: ConfigEditorFormProps) {
  const t = useTranslations('admin.llmConfigs');
  const readOnly = mode.kind === 'view';
  const base = mode.kind === 'clone' || mode.kind === 'view' ? mode.baseConfig : undefined;
  const initialKey: LlmConfigKey = base
    ? base.key
    : mode.kind === 'create-blank' && mode.targetKey
      ? mode.targetKey
      : DEFAULT_KEY;

  const [key, setKey] = useState<LlmConfigKey>(initialKey);
  const [model, setModel] = useState(base?.model ?? '');
  const [prompt, setPrompt] = useState(base?.prompt ?? '');
  const [temperature, setTemperature] = useState(readTemperature(base?.params));
  const [notes, setNotes] = useState(base?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedTemp = parseFloat(temperature);
  const temperatureInvalid =
    temperature.trim() === '' || Number.isNaN(parsedTemp) || parsedTemp < 0 || parsedTemp > 2;

  const submitDisabled = submitting || !model || !prompt || temperatureInvalid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        key,
        model,
        prompt,
        params: { temperature: parsedTemp },
        notes: notes || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  let subtitle: string | null = null;
  if (mode.kind === 'view' && base) {
    subtitle = t('editor.viewMode', { n: base.version });
  } else if (mode.kind === 'clone' && base) {
    subtitle = t('editor.fromBase', { n: base.version });
  }

  const inputBase =
    'border-foreground bg-background text-foreground rounded-none border-2 px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-none disabled:cursor-not-allowed disabled:opacity-70';
  const labelBase =
    'font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground';

  return (
    <div className={cn('flex flex-col', readOnly && 'bg-muted')}>
      <DialogHeader
        className={cn(
          'border-foreground flex flex-row items-start justify-between gap-3 border-b-2 px-6 py-5',
        )}
      >
        <div className="flex flex-col gap-1">
          <DialogTitle className="text-foreground font-mono text-base font-semibold tracking-[0.14em] uppercase">
            {t('editor.title')}
          </DialogTitle>
          {subtitle && (
            <span className="text-primary font-mono text-[11px] tracking-wider uppercase">
              {readOnly ? '↳ ' : ''}
              {subtitle}
              {!readOnly ? ' →' : ''}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="border-foreground bg-background text-foreground hover:bg-foreground hover:text-background rounded-none border-2 px-2 py-1 font-mono text-[11px] font-semibold tracking-wider uppercase transition-none"
        >
          X
        </button>
      </DialogHeader>

      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5 px-6 py-6">
        {/* Key select */}
        <div className="flex flex-col gap-2">
          <label htmlFor="cfg-editor-key" className={labelBase}>
            {t('editor.key')}
          </label>
          <select
            id="cfg-editor-key"
            value={key}
            onChange={(e) => setKey(e.target.value as LlmConfigKey)}
            disabled={readOnly || mode.kind === 'clone'}
            className={cn(inputBase, 'h-10 w-full tracking-wider uppercase')}
          >
            <option value="EXTRACTOR">EXTRACTOR</option>
            <option value="CHAT">CHAT</option>
          </select>
        </div>

        {/* Model select */}
        <div className="flex flex-col gap-2">
          <label htmlFor="cfg-editor-model" className={labelBase}>
            {t('editor.model')}
          </label>
          {readOnly ? (
            <input
              id="cfg-editor-model"
              value={model}
              disabled
              readOnly
              className={cn(inputBase, 'h-10 w-full')}
            />
          ) : (
            <ModelSelect
              id="cfg-editor-model"
              models={models}
              value={model}
              onChange={setModel}
              visionOnly={key === 'EXTRACTOR'}
            />
          )}
        </div>

        {/* Prompt */}
        <div className="flex flex-col gap-2">
          <label htmlFor="cfg-editor-prompt" className={labelBase}>
            {t('editor.prompt')}
          </label>
          <textarea
            id="cfg-editor-prompt"
            aria-label="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={readOnly ? 14 : 12}
            required={!readOnly}
            disabled={readOnly}
            className={cn(inputBase, 'min-h-[260px] w-full resize-y leading-relaxed')}
          />
        </div>

        {/* Temperature */}
        <div className="flex flex-col gap-2">
          <label htmlFor="cfg-editor-temperature" className={labelBase}>
            {t('editor.temperature')}
          </label>
          <input
            id="cfg-editor-temperature"
            aria-label="Temperature"
            type="number"
            min={0}
            max={2}
            step={0.05}
            value={temperature}
            disabled={readOnly}
            onChange={(e) => setTemperature(e.target.value)}
            aria-invalid={!readOnly && temperatureInvalid ? true : undefined}
            className={cn(inputBase, 'h-10 w-full max-w-[140px]')}
          />
          {!readOnly && temperatureInvalid && (
            <p className="text-destructive font-mono text-[11px] tracking-wider uppercase">
              {t('validation.temperatureRequired')}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-2">
          <label htmlFor="cfg-editor-notes" className={labelBase}>
            {t('editor.notes')}
          </label>
          <textarea
            id="cfg-editor-notes"
            aria-label="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            disabled={readOnly}
            className={cn(inputBase, 'w-full resize-y')}
          />
        </div>

        {error && (
          <p className="text-destructive font-mono text-xs tracking-wider uppercase">{error}</p>
        )}

        {!readOnly && (
          <div className="border-foreground bg-card -mx-6 mt-2 -mb-6 flex justify-end gap-3 border-t-2 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="border-foreground bg-background text-foreground shadow-brutal rounded-none border-2 px-5 py-2 font-mono text-xs font-semibold tracking-wider uppercase"
            >
              [ CANCEL ]
            </button>
            <button
              type="submit"
              name="Criar"
              aria-label="Criar"
              disabled={submitDisabled}
              data-testid="editor-submit"
              className="border-foreground bg-foreground text-background shadow-brutal-primary rounded-none border-2 px-5 py-2 font-mono text-xs font-semibold tracking-wider uppercase disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('editor.submit')}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
