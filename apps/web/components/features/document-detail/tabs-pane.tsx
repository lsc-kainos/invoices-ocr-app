'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DocumentDetail } from '@invoices-ocr/shared-types';

interface TabsPaneProps {
  doc: DocumentDetail;
}

function formatHistoryDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function TabsPane({ doc }: TabsPaneProps) {
  const t = useTranslations('document');
  const tDisabled = useTranslations('disabled');
  const tErrors = useTranslations('errors.ocr');

  const ocrSeconds =
    doc.ocrCompletedAt && doc.ocrStartedAt
      ? Math.max(
          1,
          Math.round(
            (new Date(doc.ocrCompletedAt).getTime() - new Date(doc.ocrStartedAt).getTime()) / 1000,
          ),
        )
      : null;

  return (
    <Tabs defaultValue="raw" className="flex h-full flex-col">
      <TabsList className="self-start">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <TabsTrigger value="chat" disabled aria-disabled>
                  {t('tabs.chat')}
                </TabsTrigger>
              </span>
            </TooltipTrigger>
            <TooltipContent>{tDisabled('f3')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TabsTrigger value="raw">{t('tabs.raw')}</TabsTrigger>
        <TabsTrigger value="history">{t('tabs.history')}</TabsTrigger>
      </TabsList>

      <TabsContent value="raw" className="mt-3 flex-1 overflow-auto">
        {doc.extractedText ? (
          <pre className="border-border bg-muted/30 text-foreground rounded-md border p-4 font-mono text-[12px] whitespace-pre-wrap">
            {doc.extractedText}
          </pre>
        ) : (
          <p className="text-muted-foreground text-[12px]">
            {doc.status === 'OCR_RUNNING' || doc.status === 'QUEUED'
              ? t('raw.extracting')
              : t('raw.empty')}
          </p>
        )}
      </TabsContent>

      <TabsContent value="history" className="mt-3 flex-1 overflow-auto">
        <ul className="flex flex-col gap-3">
          <li className="border-border bg-muted/20 rounded-md border p-3 text-[12px]">
            <div className="text-foreground font-medium">{t('history.upload')}</div>
            <div className="text-muted-foreground mt-0.5 text-[11px]">
              {formatHistoryDate(doc.createdAt)}
            </div>
          </li>
          {doc.ocrCompletedAt && doc.status === 'READY' ? (
            <li className="border-border bg-muted/20 rounded-md border p-3 text-[12px]">
              <div className="text-foreground font-medium">
                {ocrSeconds !== null
                  ? t('history.ocr_done', { seconds: ocrSeconds })
                  : t('history.system')}
              </div>
              <div className="text-muted-foreground mt-0.5 text-[11px]">
                {formatHistoryDate(doc.ocrCompletedAt)}
              </div>
            </li>
          ) : null}
          {doc.status === 'FAILED' ? (
            <li className="border-destructive/40 bg-destructive/5 rounded-md border p-3 text-[12px]">
              <div className="text-destructive font-medium">{t('history.ocr_failed')}</div>
              <div className="text-muted-foreground mt-0.5 text-[11px]">
                {tErrors(doc.failureReason ?? 'unknown')}
              </div>
            </li>
          ) : null}
        </ul>
      </TabsContent>
    </Tabs>
  );
}
