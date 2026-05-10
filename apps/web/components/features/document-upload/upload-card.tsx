'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Loader2, Check, X, Dot } from 'lucide-react';
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
  REJECTED: 100,
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
  REJECTED: { upload: 'done', ocr: 'done', structure: 'failed', ready: 'pending' },
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

  // TODO(f2.5): rebuild upload-card chip without `tipo` (universal schema)
  const tipo = 'Doc';
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

  const StepIcon = ({ state }: { state: StepState }) => {
    if (state === 'done') return <Check className="h-3 w-3" />;
    if (state === 'failed') return <X className="h-3 w-3" />;
    if (state === 'active') return <Loader2 className="h-3 w-3 animate-spin" />;
    return <Dot className="h-3 w-3" />;
  };

  const Inner = (
    <Card
      className={cn(
        'border-border/60 bg-card p-3 sm:p-4',
        isRunning && 'animate-pulse-glow border-primary/20',
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3">
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
          className="text-muted-foreground mt-2 flex items-center gap-2 text-[12px] sm:mt-3"
        >
          <Loader2 size={13} className="animate-spin" aria-hidden />
          <span>{isAutoRetrying ? t('retrying') : t('progress.ocr')}</span>
        </div>
      ) : (
        <Progress value={PROGRESS[doc.status]} className="mt-2 h-1.5 sm:mt-3" />
      )}

      {isFailed && doc.failureReason ? (
        <div className="mt-2 flex flex-col gap-2 sm:mt-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
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
            className="h-9 w-full text-[11px] sm:h-7 sm:w-auto"
          >
            {retryPending ? tRetry('in_progress') : tRetry('button')}
          </Button>
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-1 sm:space-y-2.5">
        {(['upload', 'ocr', 'structure', 'ready'] as const).map((key) => {
          const state = ladder[key];
          return (
            <div key={key} className="flex items-center gap-2 text-[11px] sm:gap-2.5">
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold',
                  state === 'done' && 'bg-foreground text-background',
                  state === 'active' && 'border-border bg-muted/50 text-foreground border',
                  state === 'pending' && 'border-border text-muted-foreground/50 border',
                  state === 'failed' && 'bg-destructive/15 text-destructive',
                )}
                aria-hidden
              >
                <StepIcon state={state} />
              </div>
              <span
                className={cn(
                  state === 'pending' ? 'text-muted-foreground/50' : 'text-foreground/80',
                  state === 'active' && 'text-foreground font-medium',
                  state === 'failed' && 'text-destructive',
                )}
              >
                {t(`ladder.${key}`)}
              </span>
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
