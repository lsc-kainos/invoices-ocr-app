'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DownloadButton } from '../document-download/download-button';
import type { DocumentSummary } from '@invoices-ocr/shared-types';
import { cn } from '@/lib/utils';

const STATUS_DOT: Record<DocumentSummary['status'], string> = {
  QUEUED: 'bg-muted-foreground/40',
  OCR_RUNNING: 'bg-warning',
  READY: 'bg-success',
  FAILED: 'bg-destructive',
  REJECTED: 'bg-warning',
};

const STATUS_TONE: Record<DocumentSummary['status'], string> = {
  QUEUED: 'bg-muted text-muted-foreground',
  OCR_RUNNING: 'bg-warning-muted text-warning-foreground',
  READY: 'bg-success-muted text-success-foreground',
  FAILED: 'bg-destructive/15 text-destructive',
  REJECTED: 'bg-warning-muted text-warning-foreground',
};

// Mobile short labels — full labels ("Documento incompatível", "Erro no
// processamento") do not slice cleanly with a character count.
const STATUS_SHORT: Record<DocumentSummary['status'], string> = {
  QUEUED: 'Fila',
  OCR_RUNNING: 'Proc.',
  READY: 'OK',
  FAILED: 'Erro',
  REJECTED: 'Incomp.',
};

export function DocumentRow({ doc }: { doc: DocumentSummary }) {
  const t = useTranslations('documents.list');
  const isImage = doc.mime?.startsWith('image/');

  return (
    <div className="group border-border/30 hover:bg-muted/40 flex min-h-[52px] items-center gap-3 border-b px-3 transition-all duration-200 sm:gap-4 sm:px-4">
      <Link
        href={`/documents/${doc.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 py-3 sm:gap-4 sm:py-3.5"
        aria-label={doc.filename}
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
            <span className="sm:hidden">{STATUS_SHORT[doc.status]}</span>
          </Badge>
        </div>
      </Link>
      <DownloadButton
        documentId={doc.id}
        filename={doc.filename}
        status={doc.status}
        variant="icon"
      />
    </div>
  );
}
