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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
 * Editor modal — refined editorial dark.
 *
 * - shadcn Dialog default (rounded, ring, sem sombras decorativas).
 * - max-w-2xl + max-h-[85vh] + overflow-y-auto: conteúdo cabe em viewport
 *   pequena (375x667) com scroll interno.
 */
export function ConfigEditorDrawer({ mode, onClose, models, onSubmit }: ConfigEditorDrawerProps) {
  const open = mode.kind !== 'closed';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          'bg-card text-card-foreground gap-0 p-0',
          'flex max-h-[85vh] w-full flex-col overflow-hidden sm:max-w-2xl',
        )}
        showCloseButton
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

  const labelBase = 'eyebrow';

  return (
    <div className="flex max-h-[85vh] flex-col">
      <DialogHeader className="border-border/60 shrink-0 border-b px-6 py-4">
        <DialogTitle className="text-foreground text-base font-semibold tracking-tight">
          {t('editor.title')}
        </DialogTitle>
        {subtitle && (
          <span className="text-muted-foreground text-xs">{subtitle}</span>
        )}
      </DialogHeader>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
          {/* Key select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cfg-editor-key" className={labelBase}>
              {t('editor.key')}
            </label>
            <select
              id="cfg-editor-key"
              value={key}
              onChange={(e) => setKey(e.target.value as LlmConfigKey)}
              disabled={readOnly || mode.kind === 'clone'}
              className={cn(
                'border-input bg-background text-foreground h-9 w-full rounded-md border px-3 text-sm outline-none',
                'focus-visible:ring-ring/50 focus-visible:ring-3',
                'disabled:cursor-not-allowed disabled:opacity-70',
              )}
            >
              <option value="EXTRACTOR">Extractor</option>
              <option value="CHAT">Chat</option>
            </select>
          </div>

          {/* Model select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cfg-editor-model" className={labelBase}>
              {t('editor.model')}
            </label>
            {readOnly ? (
              <Input id="cfg-editor-model" value={model} disabled readOnly />
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
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cfg-editor-prompt" className={labelBase}>
              {t('editor.prompt')}
            </label>
            <Textarea
              id="cfg-editor-prompt"
              aria-label="Prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={readOnly ? 12 : 10}
              required={!readOnly}
              disabled={readOnly}
              className="min-h-[200px] resize-y font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Temperature */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cfg-editor-temperature" className={labelBase}>
              {t('editor.temperature')}
            </label>
            <Input
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
              className="max-w-[140px]"
            />
            {!readOnly && temperatureInvalid && (
              <p className="text-destructive text-xs">{t('validation.temperatureRequired')}</p>
            )}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cfg-editor-notes" className={labelBase}>
              {t('editor.notes')}
            </label>
            <Textarea
              id="cfg-editor-notes"
              aria-label="Notas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              disabled={readOnly}
              className="resize-y"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        {!readOnly && (
          <div className="border-border/60 bg-muted/30 shrink-0 border-t px-6 py-3.5">
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                {t('editor.cancel')}
              </Button>
              <Button
                type="submit"
                name="Criar"
                aria-label="Criar"
                disabled={submitDisabled}
                data-testid="editor-submit"
                variant="default"
              >
                {t('editor.submit')}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
