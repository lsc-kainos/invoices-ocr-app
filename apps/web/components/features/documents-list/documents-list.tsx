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
      <header className="border-border/40 border-b px-4 py-3 sm:px-6 sm:py-4">
        <h1 className="text-xl font-semibold sm:text-2xl">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>
      <div className="divide-border/20 flex-1 divide-y overflow-y-auto">
        {docs.map((d) => (
          <DocumentRow key={d.id} doc={d} />
        ))}
      </div>
    </div>
  );
}
