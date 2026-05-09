import { NextResponse, type NextRequest } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function GET(req: NextRequest) {
  const search = req.nextUrl.search;
  const r = await apiFetch(`/api/v1/documents${search}`, {}, req);
  const body = await r.text();
  return new NextResponse(body, {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
