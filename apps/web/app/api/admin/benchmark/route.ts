import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { env } from '@/lib/env';

export async function POST(req: NextRequest) {
  const token = (await getToken({
    req: req as never,
    secret: env.NEXTAUTH_SECRET,
    raw: true,
  })) as string | null;

  const upstream = await fetch(`${env.API_URL}/api/v1/admin/benchmark`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'text/event-stream',
    },
  });

  if (!upstream.ok) {
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}
