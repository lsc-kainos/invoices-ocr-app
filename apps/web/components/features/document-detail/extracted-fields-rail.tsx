'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { InvoiceCore, InvoiceSummary } from '@invoices-ocr/shared-types';

const FIELD_KEYS = [
  'invoiceNumber',
  'invoiceDate',
  'dueDate',
  'sellerName',
  'sellerAddress',
  'clientName',
  'clientAddress',
  'tax',
  'discount',
  'total',
  'paymentMethod',
] as const satisfies ReadonlyArray<keyof InvoiceCore>;

const MONO_KEYS = new Set<keyof InvoiceCore>(['invoiceNumber']);

interface ExtractedFieldsRailProps {
  summary: InvoiceSummary | null;
}

export function ExtractedFieldsRail({ summary }: ExtractedFieldsRailProps) {
  const t = useTranslations('document');
  const tFields = useTranslations('document.fields');
  const empty = tFields('empty');

  return (
    <aside className="border-border bg-card flex flex-col gap-4 rounded-md border p-4">
      <header>
        <h2 className="text-foreground text-[12px] font-semibold tracking-wide uppercase">
          {tFields('title')}
        </h2>
        <p className="text-muted-foreground mt-1 text-[11px]">{tFields('hint')}</p>
      </header>

      {summary?.narrative ? (
        <section className="flex flex-col gap-1">
          <h3 className="text-muted-foreground text-[10px] tracking-wide uppercase">
            {t('narrative')}
          </h3>
          <blockquote className="border-primary/40 bg-muted/40 text-foreground rounded-sm border-l-2 px-3 py-2 text-[12px] leading-relaxed">
            {summary.narrative}
          </blockquote>
        </section>
      ) : null}

      <dl className="flex flex-col gap-3">
        {FIELD_KEYS.map((key) => {
          const value = summary?.core[key] ?? null;
          return (
            <div key={key} className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-[10px] tracking-wide uppercase">
                {tFields(key)}
              </dt>
              <dd
                className={cn(
                  'text-foreground text-[12px]',
                  MONO_KEYS.has(key) && 'font-mono',
                  !value && 'text-muted-foreground/60',
                )}
              >
                {value ?? empty}
              </dd>
            </div>
          );
        })}
      </dl>

      <section className="flex flex-col gap-2">
        <h3 className="text-muted-foreground text-[10px] tracking-wide uppercase">
          {t('items.title')}
        </h3>
        {/* TODO(human): render items[] table here */}
      </section>

      {summary?.extras?.length ? (
        <dl className="flex flex-col gap-3">
          <hr className="border-border" />
          {summary.extras.map((extra, idx) => (
            <div key={`${extra.label}-${idx}`} className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-[10px] tracking-wide uppercase">
                {extra.label}
              </dt>
              <dd className={cn('text-foreground text-[12px]', extra.mono && 'font-mono')}>
                {extra.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </aside>
  );
}
