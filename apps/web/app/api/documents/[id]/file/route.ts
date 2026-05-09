import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

// Stream binário do arquivo. A rota /file é @Public no Nest e valida o
// token HMAC server-side; aqui só reencaminhamos a query string como veio.
// Não usa apiFetch porque (1) não precisa de Bearer (token vai na URL),
// (2) não pode forçar Content-Type JSON, (3) precisa preservar headers
// binários (Content-Type real, Content-Disposition, Cache-Control).
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const search = req.nextUrl.search;
  const upstream = await fetch(`${env.API_URL}/api/v1/documents/${id}/file${search}`, {
    cache: 'no-store',
  });
  if (!upstream.ok || !upstream.body) {
    return new NextResponse(upstream.statusText, { status: upstream.status });
  }
  const headers = new Headers();
  for (const key of ['content-type', 'content-disposition', 'cache-control', 'content-length']) {
    const v = upstream.headers.get(key);
    if (v) headers.set(key, v);
  }
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
