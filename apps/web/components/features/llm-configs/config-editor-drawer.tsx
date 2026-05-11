'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  AvailableModel,
  CreateLlmConfigInput,
  LlmConfigDto,
  LlmConfigKey,
} from '@invoices-ocr/shared-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ModelSelect } from './model-select';

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

export function ConfigEditorDrawer({ mode, onClose, models, onSubmit }: ConfigEditorDrawerProps) {
  const open = mode.kind !== 'closed';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
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

  let title: string;
  if (mode.kind === 'view' && base) {
    title = t('editor.viewMode', { n: base.version });
  } else if (mode.kind === 'clone' && base) {
    title = t('editor.fromBase', { n: base.version });
  } else {
    title = t('editor.title');
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>

      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        {/* Key select */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cfg-editor-key" className="text-sm font-medium">
            {t('editor.key')}
          </label>
          <select
            id="cfg-editor-key"
            value={key}
            onChange={(e) => setKey(e.target.value as LlmConfigKey)}
            disabled={readOnly || mode.kind === 'clone'}
            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 py-1 text-sm transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="EXTRACTOR">EXTRACTOR</option>
            <option value="CHAT">CHAT</option>
          </select>
        </div>

        {/* Model select */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cfg-editor-model" className="text-sm font-medium">
            {t('editor.model')}
          </label>
          {readOnly ? (
            <Input id="cfg-editor-model" value={model} disabled className="font-mono text-xs" />
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
          <label htmlFor="cfg-editor-prompt" className="text-sm font-medium">
            {t('editor.prompt')}
          </label>
          <Textarea
            id="cfg-editor-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={readOnly ? 12 : 8}
            required={!readOnly}
            disabled={readOnly}
            className="font-mono text-xs"
          />
        </div>

        {/* Temperature */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cfg-editor-temperature" className="text-sm font-medium">
            {t('editor.temperature')}
          </label>
          <Input
            id="cfg-editor-temperature"
            type="number"
            min={0}
            max={2}
            step={0.05}
            value={temperature}
            disabled={readOnly}
            onChange={(e) => setTemperature(e.target.value)}
            aria-invalid={!readOnly && temperatureInvalid ? true : undefined}
          />
          {!readOnly && temperatureInvalid && (
            <p className="text-destructive text-xs">{t('validation.temperatureRequired')}</p>
          )}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cfg-editor-notes" className="text-sm font-medium">
            {t('editor.notes')}
          </label>
          <Textarea
            id="cfg-editor-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            disabled={readOnly}
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        {!readOnly && (
          <DialogFooter>
            <Button type="submit" disabled={submitDisabled}>
              {t('editor.submit')}
            </Button>
          </DialogFooter>
        )}
      </form>
    </>
  );
}
