import { NextResponse, type NextRequest } from 'next/server';
import { apiJSON } from '@/lib/api';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.text();
  const r = await apiJSON(
    `/api/v1/documents/${id}/summary`,
    {
      method: 'PATCH',
      body,
    },
    req,
  );
  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
