'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
  const formattedDate = new Date(doc.updatedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="group border-border/30 hover:bg-muted/40 grid min-h-[60px] grid-cols-[28px_minmax(0,1fr)_auto_auto] items-center gap-4 border-b px-4 transition-colors duration-150 ease-out sm:grid-cols-[28px_minmax(0,1fr)_140px_auto] sm:gap-5 sm:px-6">
      <div className="flex h-7 w-7 items-center justify-center">
        <span
          className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT[doc.status])}
          aria-hidden="true"
        />
      </div>
      <Link
        href={`/documents/${doc.id}`}
        className="flex min-w-0 flex-col justify-center gap-0.5 py-3.5"
        aria-label={doc.filename}
      >
        <span className="text-foreground truncate text-sm font-medium tracking-tight">
          {doc.filename}
        </span>
        <span className="text-muted-foreground/70 truncate text-[11px]">{formattedDate}</span>
      </Link>
      <Badge variant="outline" className={cn(STATUS_TONE[doc.status], 'text-[10px]')}>
        <span className="hidden sm:inline">{t(`status.${doc.status}`)}</span>
        <span className="sm:hidden">{STATUS_SHORT[doc.status]}</span>
      </Badge>
      <DownloadButton
        documentId={doc.id}
        filename={doc.filename}
        status={doc.status}
        variant="icon"
      />
    </div>
  );
}
