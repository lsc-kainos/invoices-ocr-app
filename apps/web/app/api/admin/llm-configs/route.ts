import { NextResponse, type NextRequest } from 'next/server';
import { apiFetch, apiJSON } from '@/lib/api';

export async function GET(req: NextRequest) {
  const r = await apiFetch('/api/v1/admin/llm-configs', {}, req);
  const body = await r.text();
  return new NextResponse(body, {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const r = await apiJSON('/api/v1/admin/llm-configs', { method: 'POST', body }, req);
  const resBody = await r.text();
  return new NextResponse(resBody, {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
