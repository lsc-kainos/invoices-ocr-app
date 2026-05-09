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
      <header className="border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>
      <div className="flex-1 overflow-y-auto">
        {docs.map((d) => (
          <DocumentRow key={d.id} doc={d} />
        ))}
      </div>
    </div>
  );
}
