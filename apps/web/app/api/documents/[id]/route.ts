import { NextResponse, type NextRequest } from 'next/server';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const r = await apiFetch(`/api/v1/documents/${id}`, {}, req);
  const body = await r.text();
  return new NextResponse(body, {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
