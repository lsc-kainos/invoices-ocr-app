'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { cn } from '@/lib/utils';
import type { DocumentSummary, DocumentStatus } from '@invoices-ocr/shared-types';
import { useDocumentRetry } from './use-document-retry';

const PROGRESS: Record<DocumentStatus, number> = {
  QUEUED: 25,
  OCR_RUNNING: 65,
  READY: 100,
  FAILED: 100,
};

type StepState = 'done' | 'active' | 'pending' | 'failed';

const LADDER: Record<
  DocumentStatus,
  Record<'upload' | 'ocr' | 'structure' | 'ready', StepState>
> = {
  QUEUED: { upload: 'done', ocr: 'pending', structure: 'pending', ready: 'pending' },
  OCR_RUNNING: { upload: 'done', ocr: 'active', structure: 'pending', ready: 'pending' },
  READY: { upload: 'done', ocr: 'done', structure: 'done', ready: 'done' },
  FAILED: { upload: 'done', ocr: 'failed', structure: 'pending', ready: 'pending' },
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
};

interface UploadCardProps {
  doc: DocumentSummary;
}

export function UploadCard({ doc }: UploadCardProps) {
  const t = useTranslations('upload');
  const tErrors = useTranslations('errors.ocr');
  const tRetry = useTranslations('upload.retry');
  const { retry, isPending } = useDocumentRetry();

  const tipo = doc.summary?.core.tipo ?? 'Doc';
  const ladder = LADDER[doc.status];
  const isReady = doc.status === 'READY';
  const isFailed = doc.status === 'FAILED';
  const isRunning = doc.status === 'OCR_RUNNING';
  const isAutoRetrying = isRunning && doc.retryCount > 0;
  const retryPending = isPending(doc.id);

  const wrapperClass = cn(
    'block rounded-md transition-colors',
    isReady && 'cursor-pointer hover:bg-muted/40',
  );

  const Inner = (
    <Card className="border-border/60 bg-card p-3.5">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="font-mono text-[10px] tracking-wide uppercase">
          {tipo}
        </Badge>
        <div className="min-w-0 flex-1">
          <div className="text-foreground truncate text-[13px] font-medium">{doc.filename}</div>
          <div className="text-muted-foreground mt-0.5 font-mono text-[11px]">
            {formatSize(doc.size)}
            {!isRunning && ` · ${PROGRESS[doc.status]}%`}
          </div>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      {isRunning ? (
        <div
          data-testid="ocr-spinner"
          className="text-muted-foreground mt-3 flex items-center gap-2 text-[12px]"
        >
          <Loader2 size={13} className="animate-spin" />
          <span>{isAutoRetrying ? t('retrying') : t('progress.ocr')}</span>
        </div>
      ) : (
        <Progress value={PROGRESS[doc.status]} className="mt-3 h-1" />
      )}

      {isFailed && doc.failureReason ? (
        <div className="mt-3 flex items-start justify-between gap-3">
          <p className="text-destructive text-[11px]">{tErrors(doc.failureReason)}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void retry(doc.id, doc.filename);
            }}
            disabled={retryPending}
            className="h-7 text-[11px]"
          >
            {retryPending ? tRetry('in_progress') : tRetry('button')}
          </Button>
        </div>
      ) : null}

      <div className="mt-3.5 flex items-center text-[11px]">
        {(['upload', 'ocr', 'structure', 'ready'] as const).map((key, idx, arr) => {
          const state = ladder[key];
          return (
            <div key={key} className="inline-flex items-center gap-1.5 [&:not(:last-child)]:flex-1">
              <div
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold',
                  state === 'done' && 'bg-foreground text-background',
                  state === 'active' && 'border-border bg-muted/50 border',
                  state === 'pending' && 'border-border text-muted-foreground/70 border',
                  state === 'failed' && 'bg-destructive/15 text-destructive',
                )}
                aria-hidden
              >
                {state === 'done'
                  ? '✓'
                  : state === 'failed'
                    ? '×'
                    : state === 'active'
                      ? '·'
                      : idx + 1}
              </div>
              <span
                className={cn(
                  state === 'pending' ? 'text-muted-foreground/70' : 'text-foreground',
                  state === 'active' && 'font-medium',
                )}
              >
                {t(`ladder.${key}`)}
              </span>
              {idx < arr.length - 1 && (
                <span className="bg-border mr-2 ml-2 hidden h-px flex-1 sm:block" />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );

  if (isReady) {
    return (
      <Link href={`/documents/${doc.id}`} className={wrapperClass} aria-label={t('card.view')}>
        {Inner}
      </Link>
    );
  }

  return <article className={wrapperClass}>{Inner}</article>;
}
