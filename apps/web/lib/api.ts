import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import { env } from './env';

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  req?: NextRequest,
): Promise<Response> {
  let token: string | null;
  if (req) {
    token = (await getToken({
      req: req as never,
      secret: env.NEXTAUTH_SECRET,
      raw: true,
    })) as string | null;
  } else {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const fakeReq = {
      cookies: { get: (name: string) => cookieStore.get(name) },
      headers: headerStore,
    };
    token = (await getToken({
      req: fakeReq as never,
      secret: env.NEXTAUTH_SECRET,
      raw: true,
    })) as string | null;
  }
  return fetch(`${env.API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
}
