'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DocumentStatus } from '@invoices-ocr/shared-types';

const TONE: Record<DocumentStatus, string> = {
  QUEUED: 'bg-muted text-muted-foreground dark:bg-muted/40 dark:text-muted-foreground',
  OCR_RUNNING: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  READY: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  FAILED: 'bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-destructive',
};

interface StatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = useTranslations('upload.status');
  return (
    <Badge variant="outline" className={cn(TONE[status], className)}>
      {t(status)}
    </Badge>
  );
}
