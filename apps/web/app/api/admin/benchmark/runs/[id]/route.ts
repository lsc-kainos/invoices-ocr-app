import { NextResponse, type NextRequest } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await apiFetch(`/api/v1/admin/benchmark/runs/${id}`, {}, req);
  const body = await r.text();
  return new NextResponse(body, {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
