'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { TestLlmConfigResult } from '@invoices-ocr/shared-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ConfigTestDrawerProps {
  configId: string | null;
  onClose: () => void;
  onTest: (id: string, sampleFilename: string) => Promise<TestLlmConfigResult>;
}

/**
 * Brutalist test drawer — mesmo tratamento que o editor.
 * - Sample input + RUN button alinhados.
 * - Result pre block com border top/bottom, mono.
 * - Duration ALL CAPS no header do resultado.
 */
export function ConfigTestDrawer({ configId, onClose, onTest }: ConfigTestDrawerProps) {
  const t = useTranslations('admin.llmConfigs');

  const [sample, setSample] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TestLlmConfigResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    if (!configId || !sample.trim()) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await onTest(configId, sample.trim());
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  function handleClose() {
    setSample('');
    setResult(null);
    setError(null);
    onClose();
  }

  const inputBase =
    'border-foreground bg-background text-foreground rounded-none border-2 px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-none disabled:cursor-not-allowed disabled:opacity-70';

  return (
    <Dialog open={configId !== null} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className={cn(
          'border-foreground bg-card text-card-foreground rounded-none border-2 sm:max-w-2xl',
          'gap-0 p-0 shadow-[6px_6px_0_0_var(--primary)] ring-0',
        )}
        showCloseButton={false}
      >
        <DialogHeader className="border-foreground flex flex-row items-start justify-between gap-3 border-b-2 px-6 py-5">
          <DialogTitle className="text-foreground font-mono text-base font-semibold tracking-[0.14em] uppercase">
            {t('test.title')}
          </DialogTitle>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="border-foreground bg-background text-foreground hover:bg-foreground hover:text-background rounded-none border-2 px-2 py-1 font-mono text-[11px] font-semibold tracking-wider uppercase transition-none"
          >
            X
          </button>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              value={sample}
              onChange={(e) => setSample(e.target.value)}
              placeholder={t('test.sample')}
              className={cn(inputBase, 'h-10 w-full flex-1')}
            />
            <button
              type="button"
              onClick={() => void handleRun()}
              disabled={running || !sample.trim()}
              data-testid="test-run"
              className="border-foreground bg-foreground text-background shadow-brutal-primary rounded-none border-2 px-5 py-2 font-mono text-xs font-semibold tracking-wider uppercase disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('test.run')}
            </button>
          </div>

          {error && (
            <p className="text-destructive font-mono text-xs tracking-wider uppercase">{error}</p>
          )}

          {result && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between font-mono text-[11px] tracking-wider uppercase">
                <span className="text-foreground font-semibold">{t('test.result')}</span>
                <span className="text-muted-foreground">
                  {t('test.duration', { ms: result.durationMs })}
                </span>
              </div>
              <pre className="border-foreground text-foreground max-h-80 overflow-auto border-y-2 py-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
                {JSON.stringify(
                  result.ok
                    ? result.result
                    : { error: result.error, errorClass: result.errorClass },
                  null,
                  2,
                )}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
