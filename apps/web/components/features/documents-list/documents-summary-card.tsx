'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { DocumentSummary } from '@invoices-ocr/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type MonthBucket = {
  key: string;
  label: string;
  accessibleLabel: string;
  total: number;
  count: number;
};

const MONTHS_TO_RENDER = 12;
const MOBILE_VISIBLE_MONTHS = 6;

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const monthLabelFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
const accessibleMonthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
});

function parseInvoiceAmount(value: string | null | undefined): number | null {
  if (!value) return null;

  const normalized = value.replace(/[^\d,.-]/g, '').trim();
  if (!normalized) return null;

  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');
  const decimalSeparator = lastComma > lastDot ? ',' : lastDot > lastComma ? '.' : null;
  const hasSingleSeparator =
    decimalSeparator &&
    normalized.indexOf(decimalSeparator) === normalized.lastIndexOf(decimalSeparator) &&
    (decimalSeparator === ',' ? lastDot === -1 : lastComma === -1);
  const separatorLooksLikeThousands =
    hasSingleSeparator &&
    normalized.slice(normalized.lastIndexOf(decimalSeparator) + 1).length === 3;

  let numeric = normalized;
  if (decimalSeparator && !separatorLooksLikeThousands) {
    const decimalIndex = normalized.lastIndexOf(decimalSeparator);
    const integerPart = normalized.slice(0, decimalIndex).replace(/[,.]/g, '');
    const decimalPart = normalized.slice(decimalIndex + 1).replace(/\D/g, '');
    numeric = `${integerPart}.${decimalPart}`;
  } else {
    numeric = normalized.replace(/[^\d-]/g, '');
  }

  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDocumentDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const brDate = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brDate) {
    const [, day, month, year] = brDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDocumentMonth(doc: DocumentSummary): Date | null {
  const parsed =
    parseDocumentDate(doc.summary?.core.invoiceDate) ?? parseDocumentDate(doc.createdAt);
  if (!parsed) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function buildDocumentsSummary(docs: DocumentSummary[]): MonthBucket[] {
  const datedDocs = docs
    .map((doc) => ({ doc, month: parseDocumentMonth(doc) }))
    .filter((entry): entry is { doc: DocumentSummary; month: Date } => Boolean(entry.month));

  const anchor = datedDocs.reduce<Date | null>((latest, entry) => {
    if (!latest || entry.month > latest) return entry.month;
    return latest;
  }, null);

  const endMonth = anchor ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const startMonth = addMonths(endMonth, -(MONTHS_TO_RENDER - 1));

  const buckets = Array.from({ length: MONTHS_TO_RENDER }, (_, idx) => {
    const date = addMonths(startMonth, idx);
    return {
      key: monthKey(date),
      label: monthLabelFormatter.format(date).replace('.', ''),
      accessibleLabel: accessibleMonthFormatter.format(date),
      total: 0,
      count: 0,
    };
  });

  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  for (const { doc, month } of datedDocs) {
    const bucket = bucketByKey.get(monthKey(month));
    const amount = parseInvoiceAmount(doc.summary?.core.total);
    if (!bucket || amount === null) continue;
    bucket.total += amount;
    bucket.count += 1;
  }

  return buckets;
}

export function DocumentsSummaryCard({ docs }: { docs: DocumentSummary[] }) {
  const t = useTranslations('documents.list.summary');
  const buckets = useMemo(() => buildDocumentsSummary(docs), [docs]);
  const maxValue = Math.max(...buckets.map((bucket) => bucket.total), 0);
  const total = buckets.reduce((sum, bucket) => sum + bucket.total, 0);
  const invoicesWithAmount = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const activeMonths = buckets.filter((bucket) => bucket.total > 0).length;

  return (
    <Card className="bg-card/80 mx-4 mb-4 sm:mx-6 sm:mb-6">
      <CardHeader className="gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <p className="eyebrow">{t('eyebrow')}</p>
          <CardTitle className="mt-1 text-lg sm:text-xl">{t('title')}</CardTitle>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">{t('subtitle')}</p>
        </div>
        <div className="border-primary/15 bg-primary/5 rounded-lg border px-3 py-2 text-left sm:text-right">
          <p className="text-muted-foreground text-[11px]">{t('totalLabel')}</p>
          <p className="text-primary text-xl font-semibold tabular-nums sm:text-2xl">
            {currencyFormatter.format(total)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="grid min-h-40 grid-cols-6 items-end gap-2 sm:grid-cols-12 sm:gap-3"
          role="img"
          aria-label={t('chartAria')}
        >
          {buckets.map((bucket, idx) => {
            const height = maxValue > 0 ? Math.max((bucket.total / maxValue) * 100, 4) : 4;
            const isMobileHidden = idx < MONTHS_TO_RENDER - MOBILE_VISIBLE_MONTHS;
            return (
              <div
                key={bucket.key}
                className={cn(
                  'flex h-40 flex-col justify-end gap-2',
                  isMobileHidden && 'hidden sm:flex',
                )}
              >
                <div className="flex flex-1 items-end">
                  <div
                    className={cn(
                      'bg-primary/20 ring-primary/25 relative w-full overflow-hidden rounded-t-md ring-1 transition-colors',
                      bucket.total > 0 && 'bg-primary/80 ring-primary/40',
                    )}
                    style={{ height: `${height}%` }}
                    title={`${bucket.accessibleLabel}: ${currencyFormatter.format(bucket.total)}`}
                    aria-label={`${bucket.accessibleLabel}: ${currencyFormatter.format(bucket.total)}`}
                  >
                    <span className="sr-only">
                      {bucket.accessibleLabel}: {currencyFormatter.format(bucket.total)}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-[10px] font-medium capitalize">
                    {bucket.label}
                  </p>
                  <p className="text-foreground text-[10px] font-semibold tabular-nums">
                    {bucket.total > 0 ? compactCurrencyFormatter.format(bucket.total) : '—'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-border/60 grid grid-cols-2 gap-3 border-t pt-3 sm:grid-cols-3">
          <SummaryMetric label={t('metrics.months')} value={String(activeMonths)} />
          <SummaryMetric label={t('metrics.invoices')} value={String(invoicesWithAmount)} />
          <SummaryMetric
            className="col-span-2 sm:col-span-1"
            label={t('metrics.average')}
            value={currencyFormatter.format(activeMonths > 0 ? total / activeMonths : 0)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryMetric({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('bg-muted/30 rounded-lg px-3 py-2', className)}>
      <p className="text-muted-foreground text-[11px]">{label}</p>
      <p className="text-foreground text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
