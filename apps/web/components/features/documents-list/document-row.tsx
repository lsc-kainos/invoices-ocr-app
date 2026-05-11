'use client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DownloadButton } from '../document-download/download-button';
import type { DocumentSummary } from '@invoices-ocr/shared-types';
import { cn } from '@/lib/utils';

const STATUS_DOT: Record<DocumentSummary['status'], string> = {
  QUEUED: 'bg-muted-foreground/40',
  OCR_RUNNING: 'bg-amber-400',
  READY: 'bg-emerald-400',
  FAILED: 'bg-red-400',
  REJECTED: 'bg-amber-500',
};

const STATUS_TONE: Record<DocumentSummary['status'], string> = {
  QUEUED: 'bg-muted text-muted-foreground dark:bg-muted/40 dark:text-muted-foreground',
  OCR_RUNNING: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  READY: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  FAILED: 'bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-destructive',
  REJECTED: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
};

export function DocumentRow({ doc }: { doc: DocumentSummary }) {
  const router = useRouter();
  const t = useTranslations('documents.list');
  const isImage = doc.mime?.startsWith('image/');

  return (
    <div
      className="group border-border/30 hover:bg-muted/20 flex min-h-[52px] cursor-pointer items-center gap-3 border-b px-3 py-3 transition-all duration-200 sm:gap-4 sm:px-4 sm:py-3.5"
      onClick={() => router.push(`/documents/${doc.id}`)}
      role="row"
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors sm:h-9 sm:w-9',
          isImage ? 'bg-blue-500/10 text-blue-400' : 'bg-primary/10 text-primary/80',
        )}
      >
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-foreground group-hover:text-primary truncate text-[13px] font-medium transition-colors">
          {doc.filename}
        </div>
        <div className="text-muted-foreground/60 mt-0.5 hidden text-[11px] sm:block">
          {new Date(doc.updatedAt).toLocaleDateString('pt-BR')}
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT[doc.status])} />
        <Badge variant="outline" className={cn(STATUS_TONE[doc.status], 'text-[10px]')}>
          <span className="hidden sm:inline">{t(`status.${doc.status}`)}</span>
          <span className="sm:hidden">{t(`status.${doc.status}`).slice(0, 3)}</span>
        </Badge>
      </div>
      <DownloadButton
        documentId={doc.id}
        filename={doc.filename}
        status={doc.status}
        variant="icon"
      />
    </div>
  );
}
