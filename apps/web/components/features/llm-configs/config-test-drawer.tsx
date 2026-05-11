'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { TestLlmConfigResult } from '@invoices-ocr/shared-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ConfigTestDrawerProps {
  configId: string | null;
  onClose: () => void;
  onTest: (id: string, sampleFilename: string) => Promise<TestLlmConfigResult>;
}

/**
 * Test modal — refined editorial dark.
 *
 * - max-w-2xl + max-h-[85vh] + overflow-y-auto.
 * - Result pre block dentro de caixa bg-muted/40 rounded.
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

  return (
    <Dialog open={configId !== null} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className={cn(
          'bg-card text-card-foreground gap-0 p-0',
          'flex max-h-[85vh] w-full flex-col overflow-hidden sm:max-w-2xl',
        )}
        showCloseButton
      >
        <DialogHeader className="border-border/60 shrink-0 border-b px-6 py-4">
          <DialogTitle className="text-foreground text-base font-semibold tracking-tight">
            {t('test.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={sample}
              onChange={(e) => setSample(e.target.value)}
              placeholder={t('test.sample')}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => void handleRun()}
              disabled={running || !sample.trim()}
              data-testid="test-run"
              variant="default"
            >
              {t('test.run')}
            </Button>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          {result && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="eyebrow">{t('test.result')}</span>
                <span className="text-muted-foreground text-xs">
                  {t('test.duration', { ms: result.durationMs })}
                </span>
              </div>
              <pre className="bg-muted/40 text-foreground max-h-80 overflow-auto rounded-md p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
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
