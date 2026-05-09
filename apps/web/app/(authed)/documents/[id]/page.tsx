import { notFound } from 'next/navigation';
import type { DocumentDetail } from '@invoices-ocr/shared-types';
import { apiFetch } from '@/lib/api';
import { DocumentDetailView } from '@/components/features/document-detail/document-detail';

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await apiFetch(`/api/v1/documents/${id}`);
  if (res.status === 404) notFound();
  if (!res.ok) {
    throw new Error(`Falha ao carregar documento (${res.status})`);
  }
  const doc = (await res.json()) as DocumentDetail;
  return <DocumentDetailView initialDoc={doc} />;
}
