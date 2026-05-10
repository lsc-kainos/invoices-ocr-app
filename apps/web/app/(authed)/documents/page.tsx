import { cookies, headers } from 'next/headers';
import type { DocumentSummary } from '@invoices-ocr/shared-types';
import { DocumentsList } from '@/components/features/documents-list/documents-list';
import { EmptyListState } from '@/components/features/documents-list/empty-list-state';

export const dynamic = 'force-dynamic';

export default async function DocumentsIndex() {
  // Mesma abordagem da página de detalhe: chama o BFF route handler local
  // forwardando o cookie original. Evita o fakeReq do apiFetch SSR, que
  // não extrai o JWT corretamente em produção (cookie __Secure-* não é
  // resolvido pelo getToken via fakeReq).
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const proto = headerStore.get('x-forwarded-proto') ?? 'http';
  const host = headerStore.get('host') ?? 'localhost:3000';
  const res = await fetch(`${proto}://${host}/api/documents?limit=100`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  const docs = res.ok ? ((await res.json()) as DocumentSummary[]) : [];
  if (docs.length === 0) return <EmptyListState />;
  return <DocumentsList initialDocs={docs} />;
}
