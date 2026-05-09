import { NextRequest } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function POST(req: NextRequest) {
  const res = await apiFetch('/api/v1/chat/sessions', { method: 'POST' }, req);
  return new Response(res.body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const res = await apiFetch(`/api/v1/chat/sessions?${url.searchParams.toString()}`, {}, req);
  return new Response(res.body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
  });
}
