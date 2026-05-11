import { NextResponse, type NextRequest } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.text();
  const r = await apiFetch(`/api/v1/admin/llm-configs/${id}/test`, { method: 'POST', body }, req);
  const resBody = await r.text();
  return new NextResponse(resBody, {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
