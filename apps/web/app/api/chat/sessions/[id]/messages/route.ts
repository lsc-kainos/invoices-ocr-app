import { NextRequest } from 'next/server';
import { apiFetch, apiJSON } from '@/lib/api';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const res = await apiFetch(
    `/api/v1/chat/sessions/${id}/messages?${url.searchParams.toString()}`,
    {},
    req,
  );
  return new Response(res.body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await apiJSON(
    `/api/v1/chat/sessions/${id}/messages`,
    {
      method: 'POST',
      body: await req.text(),
      headers: { Accept: req.headers.get('accept') ?? 'application/json' },
    },
    req,
  );
  return new Response(res.body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
  });
}
