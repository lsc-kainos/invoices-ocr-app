import { NextRequest } from 'next/server';
import { apiFetch, apiJSON } from '@/lib/api';

async function proxy(req: NextRequest, documentId: string, init: RequestInit) {
  const res = await apiFetch(`/api/v1/chat/documents/${documentId}/messages`, init, req);
  return new Response(res.body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  return proxy(req, documentId, {});
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  return proxy(req, documentId, {
    method: 'POST',
    body: await req.text(),
    headers: {
      Accept: req.headers.get('accept') ?? 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  return proxy(req, documentId, { method: 'DELETE' });
}
