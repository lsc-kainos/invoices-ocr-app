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

const DOT: Record<DocumentStatus, string> = {
  QUEUED: 'bg-muted-foreground/40',
  OCR_RUNNING: 'bg-amber-400',
  READY: 'bg-emerald-400',
  FAILED: 'bg-red-400',
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
