'use client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DownloadButton } from '../document-download/download-button';
import type { DocumentSummary } from '@invoices-ocr/shared-types';

export function DocumentRow({ doc }: { doc: DocumentSummary }) {
  const router = useRouter();
  const t = useTranslations('documents.list');

  return (
    <div
      className="hover:bg-muted/40 flex cursor-pointer items-center gap-4 border-b px-4 py-3"
      onClick={() => router.push(`/documents/${doc.id}`)}
      role="row"
    >
      <FileText className="text-muted-foreground h-5 w-5 flex-shrink-0" />
      <span className="flex-1 truncate font-medium">{doc.filename}</span>
      <Badge variant="outline">{t(`status.${doc.status}`)}</Badge>
      <span className="text-muted-foreground text-xs">
        {new Date(doc.updatedAt).toLocaleDateString('pt-BR')}
      </span>
      <DownloadButton
        documentId={doc.id}
        filename={doc.filename}
        status={doc.status}
        variant="icon"
      />
    </div>
  );
}
