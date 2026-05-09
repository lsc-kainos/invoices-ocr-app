'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { InvoiceCore, InvoiceSummary } from '@invoices-ocr/shared-types';

const FIELD_KEYS = [
  'tipo',
  'numero',
  'dataEmissao',
  'chaveAcesso',
  'cnpjEmitente',
  'razaoSocial',
  'cnpjDestinatario',
  'razaoSocialDestinatario',
  'valorTotal',
  'cfop',
] as const satisfies ReadonlyArray<keyof InvoiceCore>;

const MONO_KEYS = new Set(['chaveAcesso', 'cnpjEmitente', 'cnpjDestinatario', 'cfop', 'numero']);

interface ExtractedFieldsRailProps {
  summary: InvoiceSummary | null;
}

export function ExtractedFieldsRail({ summary }: ExtractedFieldsRailProps) {
  const t = useTranslations('document.fields');
  const empty = t('empty');

  return (
    <aside className="border-border bg-card flex flex-col gap-4 rounded-md border p-4">
      <header>
        <h2 className="text-foreground text-[12px] font-semibold tracking-wide uppercase">
          {t('title')}
        </h2>
        <p className="text-muted-foreground mt-1 text-[11px]">{t('hint')}</p>
      </header>

      <dl className="flex flex-col gap-3">
        {FIELD_KEYS.map((key) => {
          const value = summary?.core[key] ?? null;
          return (
            <div key={key} className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-[10px] tracking-wide uppercase">
                {t(key)}
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

        {summary?.extras?.length ? (
          <>
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
          </>
        ) : null}
      </dl>
    </aside>
  );
}
