import { apiFetch } from '@/lib/api';
import type { DocumentSummary } from '@invoices-ocr/shared-types';
import { DocumentsList } from '@/components/features/documents-list/documents-list';
import { EmptyListState } from '@/components/features/documents-list/empty-list-state';

export const dynamic = 'force-dynamic';

export default async function DocumentsIndex() {
  const res = await apiFetch('/api/v1/documents?limit=100');
  const docs = (res.ok ? await res.json() : []) as DocumentSummary[];
  if (docs.length === 0) return <EmptyListState />;
  return <DocumentsList initialDocs={docs} />;
}
