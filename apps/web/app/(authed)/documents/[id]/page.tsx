import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import type { DocumentDetail } from '@invoices-ocr/shared-types';
import { DocumentDetailView } from '@/components/features/document-detail/document-detail';

export const dynamic = 'force-dynamic';

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // RSC chama o route handler local (que já injeta Bearer via apiFetch).
  // Encaminha cookie atual + monta URL absoluta a partir do host.
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const proto = headerStore.get('x-forwarded-proto') ?? 'http';
  const host = headerStore.get('host') ?? 'localhost:3000';
  const res = await fetch(`${proto}://${host}/api/documents/${id}`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (res.status === 404) notFound();
  if (!res.ok) {
    throw new Error(`Falha ao carregar documento (${res.status})`);
  }
  const doc = (await res.json()) as DocumentDetail;
  return <DocumentDetailView initialDoc={doc} />;
}
