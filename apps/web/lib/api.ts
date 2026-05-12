import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import { env } from './env';

async function resolveToken(req?: NextRequest): Promise<string | null> {
  if (req) {
    return (await getToken({
      req: req as never,
      secret: env.NEXTAUTH_SECRET,
      raw: true,
    })) as string | null;
  }
  const cookieStore = await cookies();
  const headerStore = await headers();
  const fakeReq = {
    cookies: { get: (name: string) => cookieStore.get(name) },
    headers: headerStore,
  };
  return (await getToken({
    req: fakeReq as never,
    secret: env.NEXTAUTH_SECRET,
    raw: true,
  })) as string | null;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  req?: NextRequest,
): Promise<Response> {
  const token = await resolveToken(req);
  return fetch(`${env.API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
}

export async function apiJSON(
  path: string,
  init: RequestInit = {},
  req?: NextRequest,
): Promise<Response> {
  return apiFetch(
    path,
    {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        'Content-Type': 'application/json',
      },
    },
    req,
  );
}

// Multipart proxy: NÃO setar Content-Type — o fetch determina automaticamente
// com o boundary correto a partir do FormData.
export async function apiUpload(
  path: string,
  formData: FormData,
  req?: NextRequest,
): Promise<Response> {
  return apiFetch(path, { method: 'POST', body: formData }, req);
}
