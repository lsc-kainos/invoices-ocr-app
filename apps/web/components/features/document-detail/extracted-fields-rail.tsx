'use client';

import { useTranslations } from 'next-intl';
import { Pencil, Save, X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { InvoiceCore, InvoiceItem, InvoiceSummary } from '@invoices-ocr/shared-types';

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
  // edit mode
  canEdit?: boolean;
  isEditing?: boolean;
  draft?: InvoiceSummary | null;
  isSaving?: boolean;
  saveError?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onFieldChange?: (field: keyof InvoiceCore, value: string) => void;
  onNarrativeChange?: (value: string) => void;
  onItemChange?: (idx: number, field: keyof InvoiceItem, value: string) => void;
  onItemAdd?: () => void;
  onItemRemove?: (idx: number) => void;
}

export function ExtractedFieldsRail({
  summary,
  canEdit,
  isEditing,
  draft,
  isSaving,
  saveError,
  onEdit,
  onSave,
  onCancel,
  onFieldChange,
  onNarrativeChange,
  onItemChange,
  onItemAdd,
  onItemRemove,
}: ExtractedFieldsRailProps) {
  const t = useTranslations('document');
  const tFields = useTranslations('document.fields');
  const tEdit = useTranslations('document.edit');
  const empty = tFields('empty');

  return (
    <aside className="border-border/40 bg-card flex flex-col gap-4 rounded-lg border p-3 shadow-sm sm:p-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-foreground text-[12px] font-semibold tracking-wide uppercase">
            {tFields('title')}
          </h2>
          {!isEditing && (
            <p className="text-muted-foreground mt-1 text-[11px]">{tFields('hint')}</p>
          )}
          {isEditing && <p className="text-muted-foreground mt-1 text-[11px]">{tEdit('hint')}</p>}
        </div>
        {canEdit && !isEditing && (
          <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={onEdit}>
            <Pencil size={11} /> {tEdit('button')}
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px]"
              onClick={onCancel}
              disabled={isSaving}
            >
              <X size={11} /> {tEdit('cancel')}
            </Button>
            <Button size="sm" className="h-6 text-[11px]" onClick={onSave} disabled={isSaving}>
              <Save size={11} /> {isSaving ? tEdit('saving') : tEdit('save')}
            </Button>
          </div>
        )}
      </header>

      {saveError && <p className="text-destructive text-[11px]">{tEdit('error')}</p>}

      <section className="flex flex-col gap-1">
        <h3 className="text-muted-foreground text-[10px] tracking-wide uppercase">
          {t('narrative')}
        </h3>
        {isEditing ? (
          <textarea
            className="border-border bg-muted/40 text-foreground w-full resize-none rounded-sm border px-3 py-2 text-[12px] leading-relaxed"
            rows={3}
            value={draft?.narrative ?? ''}
            onChange={(e) => onNarrativeChange?.(e.target.value)}
          />
        ) : summary?.narrative ? (
          <blockquote className="border-primary/40 bg-muted/40 text-foreground rounded-sm border-l-2 px-3 py-2.5 font-serif text-[13px] leading-relaxed italic">
            {summary.narrative}
          </blockquote>
        ) : null}
      </section>

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
              <dd>
                {isEditing ? (
                  <input
                    className="border-border bg-muted/30 text-foreground w-full rounded-sm border px-2 py-0.5 font-mono text-[12px]"
                    value={(draft?.core[key] ?? '') as string}
                    onChange={(e) => onFieldChange?.(key, e.target.value)}
                  />
                ) : (
                  <span
                    className={cn(
                      'text-foreground text-[13px] font-medium',
                      MONO_KEYS.has(key) && 'font-mono tabular-nums',
                      !value && 'text-muted-foreground/40 italic',
                      isCritical && 'text-primary/90',
                    )}
                  >
                    {value ?? empty}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {isEditing ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-[10px] tracking-wide uppercase">
            {t('items.title')}
          </h3>
          <div className="flex flex-col gap-2">
            {(draft?.items ?? []).map((item, idx) => (
              <div key={idx} className="bg-muted/40 flex flex-col gap-1.5 rounded-sm px-3 py-2">
                <div className="flex items-center gap-1">
                  <input
                    className="border-border bg-muted/30 text-foreground min-w-0 flex-1 rounded-sm border px-2 py-0.5 text-[12px]"
                    placeholder={t('items.description')}
                    value={item.description}
                    onChange={(e) => onItemChange?.(idx, 'description', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => onItemRemove?.(idx)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    aria-label="Remover item"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    className="border-border bg-muted/30 text-foreground min-w-0 flex-1 rounded-sm border px-2 py-0.5 text-[11px]"
                    placeholder={t('items.quantity')}
                    value={item.quantity ?? ''}
                    onChange={(e) => onItemChange?.(idx, 'quantity', e.target.value)}
                  />
                  <input
                    className="border-border bg-muted/30 text-foreground min-w-0 flex-1 rounded-sm border px-2 py-0.5 text-[11px]"
                    placeholder={t('items.unitPrice')}
                    value={item.unitPrice ?? ''}
                    onChange={(e) => onItemChange?.(idx, 'unitPrice', e.target.value)}
                  />
                  <input
                    className="border-border bg-muted/30 text-foreground min-w-0 flex-1 rounded-sm border px-2 py-0.5 text-[11px]"
                    placeholder={t('items.totalPrice')}
                    value={item.totalPrice ?? ''}
                    onChange={(e) => onItemChange?.(idx, 'totalPrice', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={onItemAdd}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[11px]"
            >
              <Plus size={11} /> {tEdit('addItem')}
            </button>
          </div>
        </section>
      ) : summary?.items?.length ? (
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
