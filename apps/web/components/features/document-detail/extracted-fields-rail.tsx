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
const CRITICAL_KEYS = new Set<keyof InvoiceCore>(['total', 'invoiceNumber', 'sellerName']);

interface ExtractedFieldsRailProps {
  summary: InvoiceSummary | null;
}

export function ExtractedFieldsRail({ summary }: ExtractedFieldsRailProps) {
  const t = useTranslations('document');
  const tFields = useTranslations('document.fields');
  const empty = tFields('empty');

  return (
    <aside className="border-border/40 bg-card flex flex-col gap-4 rounded-lg border p-3 shadow-sm sm:p-4">
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
          <blockquote className="border-primary/40 bg-muted/40 text-foreground rounded-sm border-l-2 px-3 py-2.5 font-serif text-[13px] leading-relaxed italic">
            {summary.narrative}
          </blockquote>
        </section>
      ) : null}

      <dl className="flex flex-col gap-2">
        {FIELD_KEYS.map((key) => {
          const value = summary?.core[key] ?? null;
          const isCritical = CRITICAL_KEYS.has(key);
          return (
            <div
              key={key}
              className={cn(
                'flex flex-col gap-1 rounded-lg p-2.5 transition-colors',
                isCritical && 'bg-primary/5 border-primary/10 border',
                !isCritical && 'hover:bg-muted/20',
              )}
            >
              <dt className="text-muted-foreground/80 text-[11px] font-medium">{tFields(key)}</dt>
              <dd
                className={cn(
                  'text-foreground text-[13px] font-medium',
                  MONO_KEYS.has(key) && 'font-mono tabular-nums',
                  !value && 'text-muted-foreground/40 italic',
                  isCritical && 'text-primary/90',
                )}
              >
                {value ?? empty}
              </dd>
            </div>
          );
        })}
      </dl>

      {summary?.items?.length ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-[10px] tracking-wide uppercase">
            {t('items.title')}
          </h3>
          <div className="flex flex-col gap-2">
            {summary.items.map((item, idx) => (
              <div key={idx} className="bg-muted/40 flex flex-col gap-1 rounded-sm px-3 py-2">
                <span className="text-foreground text-[12px]">{item.description}</span>
                <div className="text-muted-foreground flex gap-3 text-[11px]">
                  {item.quantity != null && <span>{item.quantity}</span>}
                  {item.unitPrice != null && <span>{item.unitPrice}</span>}
                  {item.totalPrice != null && (
                    <span className="text-foreground ml-auto font-medium tabular-nums">
                      {item.totalPrice}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {summary?.extras?.length ? (
        <dl className="flex flex-col gap-3">
          <hr className="border-border/40" />
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
