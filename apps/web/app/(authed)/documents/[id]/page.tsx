import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import type { DocumentDetail } from '@invoices-ocr/shared-types';
import { DocumentDetailView } from '@/components/features/document-detail/document-detail';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // SSR → BFF: usa origem canônica de NEXTAUTH_URL (validada por env) em
  // vez de derivar de Host/X-Forwarded-Proto. Defesa contra Host header
  // injection sob proxies reversos permissivos (P1 codex review).
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const res = await fetch(`${env.NEXTAUTH_URL}/api/documents/${id}`, {
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
