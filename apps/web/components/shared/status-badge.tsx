'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DocumentStatus } from '@invoices-ocr/shared-types';

const TONE: Record<DocumentStatus, string> = {
  QUEUED: 'bg-muted text-muted-foreground',
  OCR_RUNNING: 'bg-warning-muted text-warning-foreground',
  READY: 'bg-success-muted text-success-foreground',
  FAILED: 'bg-destructive/15 text-destructive',
  REJECTED: 'bg-warning-muted text-warning-foreground',
};

const DOT: Record<DocumentStatus, string> = {
  QUEUED: 'bg-muted-foreground/40',
  OCR_RUNNING: 'bg-warning',
  READY: 'bg-success',
  FAILED: 'bg-destructive',
  REJECTED: 'bg-warning',
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
      <span className="sm:hidden">{t(status).slice(0, 4)}</span>
    </Badge>
  );
}
