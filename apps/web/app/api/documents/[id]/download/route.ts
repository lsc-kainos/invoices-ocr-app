import { NextRequest } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await apiFetch(`/api/v1/documents/${id}/download`, {}, req);

  if (!res.ok || !res.body) {
    return new Response(res.body, {
      status: res.status,
      headers: res.headers,
    });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'application/zip',
      'Content-Disposition': res.headers.get('content-disposition') ?? 'attachment',
      'Cache-Control': 'no-store',
    },
  });
}
