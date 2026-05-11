'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Loader2,
  Check,
  X,
  Dot,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
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

type StepState = 'done' | 'active' | 'pending' | 'failed' | 'warn';

const LADDER: Record<
  DocumentStatus,
  Record<'upload' | 'ocr' | 'structure' | 'ready', StepState>
> = {
  QUEUED: { upload: 'done', ocr: 'pending', structure: 'pending', ready: 'pending' },
  OCR_RUNNING: { upload: 'done', ocr: 'active', structure: 'pending', ready: 'pending' },
  READY: { upload: 'done', ocr: 'done', structure: 'done', ready: 'done' },
  FAILED: { upload: 'done', ocr: 'failed', structure: 'pending', ready: 'pending' },
  REJECTED: { upload: 'done', ocr: 'done', structure: 'warn', ready: 'pending' },
};

const STUCK_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

function isOlderThan(isoDate: string, thresholdMs: number): boolean {
  return Date.now() - new Date(isoDate).getTime() > thresholdMs;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
};

interface UploadCardProps {
  doc: DocumentSummary;
}

// Known document type keys whose translation is available under
// `document.documentTypes.*`. Anything else (or empty/null) falls back to the
// "unknown" variant of the rejection message.
const KNOWN_DOC_TYPES = new Set([
  'receipt',
  'id_card',
  'letter',
  'contract',
  'screenshot',
  'other',
]);

export function UploadCard({ doc }: UploadCardProps) {
  const t = useTranslations('upload');
  const tErrors = useTranslations('errors.ocr');
  const tRetry = useTranslations('upload.retry');
  const tRejection = useTranslations('document.rejection');
  const tDocTypes = useTranslations('document.documentTypes');
  const { retry, isPending } = useDocumentRetry();

  // TODO(f2.5): rebuild upload-card chip without `tipo` (universal schema)
  const tipo = 'Doc';
  const ladder = LADDER[doc.status];
  const isReady = doc.status === 'READY';
  const isFailed = doc.status === 'FAILED';
  const isRejected = doc.status === 'REJECTED';
  const isRunning = doc.status === 'OCR_RUNNING';
  const isAutoRetrying = isRunning && doc.retryCount > 0;
  const retryPending = isPending(doc.id);

  // Stuck: OCR_RUNNING for more than threshold (computed outside render via module-level helper)
  const isStuck = isRunning && isOlderThan(doc.updatedAt, STUCK_THRESHOLD_MS);

  // Status-keyed toggle: user override only applies to the status it was set for.
  // When status changes (e.g. QUEUED→OCR_RUNNING) the previous override is ignored
  // and the status-derived default takes over — no useEffect needed.
  const [userToggle, setUserToggle] = useState<{ status: string; expanded: boolean } | null>(null);

  const defaultExpanded = isRunning || isFailed || isRejected;
  const isExpanded = userToggle?.status === doc.status ? userToggle.expanded : defaultExpanded;

  const toggleExpanded = () => setUserToggle({ status: doc.status, expanded: !isExpanded });

  // failure/rejected/ready states always expanded; clickable states have no toggle (they're a Link)
  const isClickable = isReady || isFailed || isRejected;
  const canToggle = !isFailed && !isRejected && !isReady;
  const forceExpanded = isFailed || isRejected;

  const showLadder = forceExpanded || isExpanded;

  const wrapperClass = cn(
    'group relative block rounded-md transition-colors',
    isClickable && 'cursor-pointer hover:bg-muted/40',
  );

  const StepIcon = ({ state }: { state: StepState }) => {
    if (state === 'done') return <Check className="h-3 w-3" />;
    if (state === 'failed') return <X className="h-3 w-3" />;
    if (state === 'warn') return <span className="text-[10px]">!</span>;
    if (state === 'active') return <Loader2 className="h-3 w-3 animate-spin" />;
    return <Dot className="h-3 w-3" />;
  };

  const Inner = (
    <Card
      className={cn(
        'border-border/60 bg-card relative p-3 sm:p-4',
        // Disable pointer events on the Card so clicks pass through to the overlay
        // Link (stretched-link pattern). Interactive descendants (retry, toggle)
        // re-enable pointer events via `pointer-events-auto`.
        isClickable && 'pointer-events-none',
        isRunning && !isStuck && 'animate-pulse-glow border-primary/20',
        isStuck && 'border-warning/40',
      )}
    >
      {/* Header row — always visible */}
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
        {canToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleExpanded();
            }}
            aria-label={isExpanded ? 'Recolher' : 'Expandir'}
            className="text-muted-foreground hover:text-foreground pointer-events-auto ml-1 transition-colors"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
        {isClickable && (
          <ChevronRight size={14} aria-hidden className="text-muted-foreground/60 ml-1 shrink-0" />
        )}
      </div>

      {/* Expanded content */}
      {showLadder && (
        <>
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

          {/* Stuck warning — informational only; retry requires FAILED status at backend */}
          {isStuck && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] sm:mt-3">
              <AlertTriangle size={12} className="text-warning" />
              <span className="text-warning-foreground">{t('stuck_hint')}</span>
            </div>
          )}

          {/* Failed reason + retry */}
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
                className="pointer-events-auto h-9 w-full text-[11px] sm:h-7 sm:w-auto"
              >
                {retryPending ? tRetry('in_progress') : tRetry('button')}
              </Button>
            </div>
          ) : null}

          {isRejected && doc.rejectionReason ? (
            <div className="mt-2 sm:mt-3">
              <p className="text-[11px] text-amber-500">
                {doc.rejectionReason === 'unsupported_type'
                  ? doc.documentType && KNOWN_DOC_TYPES.has(doc.documentType)
                    ? tRejection('unsupportedTypeWithLabel', {
                        type: tDocTypes(doc.documentType),
                      })
                    : tRejection('unsupportedTypeUnknown')
                  : doc.rejectionReason === 'low_confidence'
                    ? tRejection('lowConfidence')
                    : tErrors(doc.rejectionReason)}
              </p>
              {doc.rejectionReason === 'low_confidence' && doc.confidence != null ? (
                <p className="text-muted-foreground mt-1 text-[10px]">
                  {tRejection('confidenceLabel', {
                    percent: Math.round(doc.confidence * 100),
                  })}
                </p>
              ) : null}
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
                      state === 'warn' && 'bg-warning-muted text-warning-foreground',
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
        </>
      )}

      {/* Collapsed summary for non-expanded QUEUED */}
      {!showLadder && !isReady && (
        <div className="mt-2">
          <Progress value={PROGRESS[doc.status]} className="h-1 sm:mt-0" />
        </div>
      )}
    </Card>
  );

  // Stretched-link pattern: instead of wrapping `<Card>` (with buttons) in `<a>` —
  // which produces invalid nested interactive content — we render the Link as an
  // absolutely-positioned overlay sibling. Interactive children (retry, toggle)
  // sit on top via `relative z-10` and remain independently clickable.
  return (
    <article className={wrapperClass}>
      {isClickable && (
        <Link
          href={`/documents/${doc.id}`}
          aria-label={t('card.view')}
          className="focus-visible:ring-ring absolute inset-0 z-0 rounded-md focus-visible:ring-2 focus-visible:outline-none"
        />
      )}
      {Inner}
    </article>
  );
}
