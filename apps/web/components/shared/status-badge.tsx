'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DocumentStatus } from '@invoices-ocr/shared-types';

const TONE: Record<DocumentStatus, string> = {
  QUEUED: 'bg-muted text-muted-foreground',
  OCR_RUNNING: 'bg-warning-muted text-warning-muted-foreground',
  READY: 'bg-success-muted text-success-muted-foreground',
  FAILED: 'bg-destructive/15 text-destructive',
  REJECTED: 'bg-warning-muted text-warning-muted-foreground',
  DUPLICATE: 'bg-muted text-muted-foreground',
};

const DOT: Record<DocumentStatus, string> = {
  QUEUED: 'bg-muted-foreground/40',
  OCR_RUNNING: 'bg-warning',
  READY: 'bg-success',
  FAILED: 'bg-destructive',
  REJECTED: 'bg-warning',
  DUPLICATE: 'bg-muted-foreground/60',
};

// Short labels for mobile breakpoint — the full labels are descriptive
// ("Documento incompatível", "Erro no processamento") and don't truncate
// cleanly with a character slice. These mirror the long labels' intent.
const SHORT_LABEL: Record<DocumentStatus, string> = {
  QUEUED: 'Fila',
  OCR_RUNNING: 'Extr.',
  READY: 'Pronta',
  FAILED: 'Erro',
  REJECTED: 'Incomp.',
  DUPLICATE: 'Dupl.',
};

interface StatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = useTranslations('upload.status');
  return (
    <Badge variant="outline" className={cn('flex items-center gap-1.5', TONE[status], className)}>
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT[status])} />
      <span className="hidden sm:inline">{t(status)}</span>
      <span className="sm:hidden">{SHORT_LABEL[status]}</span>
    </Badge>
  );
}
