'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentChatTab } from './document-chat-tab';
import { EditHistoryTab } from './edit-history-tab';
import type { DocumentDetail } from '@invoices-ocr/shared-types';

interface TabsPaneProps {
  doc: DocumentDetail;
}

function formatHistoryDate(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  let relative: string;
  if (diffMin < 1) relative = 'agora mesmo';
  else if (diffMin < 60) relative = `há ${diffMin} min`;
  else if (diffH < 24) relative = `há ${diffH}h`;
  else if (diffD === 1) relative = 'ontem';
  else relative = `há ${diffD} dias`;

  const pad = (n: number) => String(n).padStart(2, '0');
  const absolute = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${relative} · ${absolute}`;
}

export function TabsPane({ doc }: TabsPaneProps) {
  const t = useTranslations('document');
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
    <Tabs defaultValue="chat" className="flex h-full flex-col">
      <TabsList className="self-start overflow-x-auto" variant="line">
        <TabsTrigger value="chat">{t('tabs.chat')}</TabsTrigger>
        <TabsTrigger value="raw">{t('tabs.raw')}</TabsTrigger>
        <TabsTrigger value="history">{t('tabs.history')}</TabsTrigger>
        <TabsTrigger value="edits">{t('tabs.edits')}</TabsTrigger>
      </TabsList>

      <TabsContent value="chat" className="mt-3 flex-1 overflow-hidden">
        <DocumentChatTab documentId={doc.id} />
      </TabsContent>

      <TabsContent value="raw" className="mt-3 flex-1 overflow-auto">
        {doc.extractedText ? (
          <pre className="border-border/40 bg-muted/30 text-foreground rounded-lg border p-3 font-mono text-[12px] whitespace-pre-wrap sm:p-4">
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
        <ol className="border-border/30 relative ml-2 flex flex-col gap-4 border-l pl-4">
          <li className="relative">
            <div className="bg-border/60 absolute top-1 -left-[1.3125rem] h-2 w-2 rounded-full" />
            <div className="border-border/40 bg-muted/20 rounded-lg border p-3 text-[12px]">
              <div className="text-foreground font-medium">{t('history.upload')}</div>
              <div className="text-muted-foreground mt-0.5 text-[11px]">
                {formatHistoryDate(doc.createdAt)}
              </div>
            </div>
          </li>
          {doc.ocrCompletedAt && doc.status === 'READY' ? (
            <li className="relative">
              <div className="absolute top-1 -left-[1.3125rem] h-2 w-2 rounded-full bg-emerald-500" />
              <div className="border-border/40 bg-muted/20 rounded-lg border p-3 text-[12px]">
                <div className="text-foreground font-medium">
                  {ocrSeconds !== null
                    ? t('history.ocr_done', { seconds: ocrSeconds })
                    : t('history.system')}
                </div>
                <div className="text-muted-foreground mt-0.5 text-[11px]">
                  {formatHistoryDate(doc.ocrCompletedAt)}
                </div>
              </div>
            </li>
          ) : null}
          {doc.status === 'FAILED' ? (
            <li className="relative">
              <div className="bg-destructive absolute top-1 -left-[1.3125rem] h-2 w-2 rounded-full" />
              <div className="border-destructive/40 bg-destructive/5 rounded-lg border p-3 text-[12px]">
                <div className="text-destructive font-medium">{t('history.ocr_failed')}</div>
                <div className="text-muted-foreground mt-0.5 text-[11px]">
                  {tErrors(doc.failureReason ?? 'unknown')}
                </div>
              </div>
            </li>
          ) : null}
        </ol>
      </TabsContent>

      <TabsContent value="edits" className="mt-3 flex-1 overflow-auto">
        <EditHistoryTab documentId={doc.id} verifiedAt={doc.verifiedAt} />
      </TabsContent>
    </Tabs>
  );
}
