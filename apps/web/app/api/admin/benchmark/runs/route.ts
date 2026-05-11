import { NextResponse, type NextRequest } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit');
  const path = limit
    ? `/api/v1/admin/benchmark/runs?limit=${limit}`
    : `/api/v1/admin/benchmark/runs`;
  const r = await apiFetch(path, {}, req);
  const body = await r.text();
  return new NextResponse(body, {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
