import { NextResponse, type NextRequest } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function POST(req: NextRequest) {
  const r = await apiFetch('/api/v1/admin/llm-configs/reload-cache', { method: 'POST' }, req);
  const body = await r.text();
  return new NextResponse(body, {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
