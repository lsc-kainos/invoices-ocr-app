import { NextResponse, type NextRequest } from 'next/server';
import { apiUpload } from '@/lib/api';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const r = await apiUpload('/api/v1/documents', formData, req);
  const body = await r.text();
  return new NextResponse(body, {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
