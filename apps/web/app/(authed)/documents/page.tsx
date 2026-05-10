import { cookies } from 'next/headers';
import type { DocumentSummary } from '@invoices-ocr/shared-types';
import { DocumentsList } from '@/components/features/documents-list/documents-list';
import { EmptyListState } from '@/components/features/documents-list/empty-list-state';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function DocumentsIndex() {
  // SSR → BFF: usa origem canônica de NEXTAUTH_URL (validada por env) em
  // vez de derivar de Host/X-Forwarded-Proto. Sem isso, um Host forjado
  // sob proxy reverso permissivo poderia direcionar a request (com cookies
  // de sessão) para origem controlada por atacante (Host header injection).
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const res = await fetch(`${env.NEXTAUTH_URL}/api/documents?limit=100`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  const docs = res.ok ? ((await res.json()) as DocumentSummary[]) : [];
  if (docs.length === 0) return <EmptyListState />;
  return <DocumentsList initialDocs={docs} />;
}
