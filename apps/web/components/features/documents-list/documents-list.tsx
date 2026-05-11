'use client';
import { useTranslations } from 'next-intl';
import type { DocumentSummary } from '@invoices-ocr/shared-types';
import { DocumentRow } from './document-row';
import { useDocumentsList } from './use-documents-list';

export function DocumentsList({ initialDocs }: { initialDocs: DocumentSummary[] }) {
  const t = useTranslations('documents.list');
  const { docs } = useDocumentsList(initialDocs);

  return (
    <div className="flex h-full flex-col">
      <header className="border-border/40 border-b px-4 py-6 sm:px-6 sm:py-8">
        <p className="eyebrow">{t('eyebrow')}</p>
        <div className="mt-2 flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
          <span className="font-serif-italic text-primary text-2xl leading-none font-light sm:text-3xl">
            {docs.length}
          </span>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">{t('subtitle')}</p>
      </header>
      <div className="divide-border/20 flex-1 divide-y overflow-y-auto">
        {docs.map((d, idx) => (
          <div
            key={d.id}
            className="animate-config-reveal"
            style={{ animationDelay: `${Math.min(idx * 30, 240)}ms` }}
          >
            <DocumentRow doc={d} />
          </div>
        ))}
      </div>
    </div>
  );
}
