'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  AvailableModel,
  CreateLlmConfigInput,
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

interface ConfigEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  models: AvailableModel[];
  onSubmit: (input: CreateLlmConfigInput) => Promise<unknown>;
}

const DEFAULT_KEY: LlmConfigKey = 'EXTRACTOR';

export function ConfigEditorDrawer({ open, onClose, models, onSubmit }: ConfigEditorDrawerProps) {
  const t = useTranslations('admin.llmConfigs');

  const [key, setKey] = useState<LlmConfigKey>(DEFAULT_KEY);
  const [model, setModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [temperature, setTemperature] = useState('0.2');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        key,
        model,
        prompt,
        params: { temperature: parseFloat(temperature) },
        notes: notes || undefined,
      });
      // reset form
      setKey(DEFAULT_KEY);
      setModel('');
      setPrompt('');
      setTemperature('0.2');
      setNotes('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('editor.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          {/* Key select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">{t('editor.key')}</label>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value as LlmConfigKey)}
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 py-1 text-sm transition-colors outline-none focus-visible:ring-3"
            >
              <option value="EXTRACTOR">EXTRACTOR</option>
              <option value="CHAT">CHAT</option>
            </select>
          </div>

          {/* Model select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">{t('editor.model')}</label>
            <ModelSelect
              models={models}
              value={model}
              onChange={setModel}
              visionOnly={key === 'EXTRACTOR'}
            />
          </div>

          {/* Prompt */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">{t('editor.prompt')}</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              required
              className="font-mono text-xs"
            />
          </div>

          {/* Temperature */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">{t('editor.temperature')}</label>
            <Input
              type="number"
              min={0}
              max={2}
              step={0.05}
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">{t('editor.notes')}</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={submitting || !model || !prompt}>
              {t('editor.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
