import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { Role } from '@invoices-ocr/shared-types';
import { internalFetch } from './internal-api';
import { env } from './env';

type Callbacks = NonNullable<NextAuthOptions['callbacks']>;
type SignInArgs = Parameters<NonNullable<Callbacks['signIn']>>[0];

export async function signInCallback({ user }: SignInArgs) {
  return !!user.email;
}

type JwtArgs = Parameters<NonNullable<Callbacks['jwt']>>[0];

export async function jwtCallback({ token, user, trigger }: JwtArgs) {
  const shouldSync = (user != null && user.email != null) || trigger === 'update';
  if (!shouldSync) return token;

  const email = user?.email ?? (token.email as string | undefined);
  if (!email) return token;

  const res = await internalFetch('/api/v1/internal/users/sync', {
    method: 'POST',
    body: JSON.stringify({
      email,
      name: user?.name ?? undefined,
      avatar: user?.image ?? undefined,
    }),
  });

  // Falha aqui é fatal: se não substituirmos token.sub pelo CUID do User,
  // o NextAuth assina o JWT com o sub do provedor OAuth (Google/GitHub) e
  // a API rejeita TODAS as requests com 401 (user não existe pelo id do
  // OAuth). Melhor abortar o login do que entregar token-fantasma.
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[auth] user sync failed', {
      status: res.status,
      bodyPreview: body.slice(0, 200),
    });
    throw new Error(`User sync failed (${res.status})`);
  }

  const synced = (await res.json()) as { id: string; email: string; role: Role };
  token.sub = synced.id;
  token.role = synced.role;
  token.email = synced.email;

  return token;
}

type SessionArgs = Parameters<NonNullable<Callbacks['session']>>[0];

export async function sessionCallback({ session, token }: SessionArgs) {
  if (session.user && token.sub) {
    session.user = {
      ...session.user,
      id: token.sub,
      role: token.role as Role,
    };
  }
  return session;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
    // E2E_TEST=1 ativa o provider de credenciais usado pelos testes
    // Playwright. NODE_ENV sozinho não basta porque `next dev` força
    // NODE_ENV=development; usamos uma flag dedicada.
    ...(process.env.NODE_ENV === 'test' || process.env.E2E_TEST === '1'
      ? [
          CredentialsProvider({
            id: 'e2e-test',
            name: 'E2E Test',
            credentials: { email: { type: 'text' } },
            authorize: async (creds) => {
              if (!creds?.email) return null;
              return { id: 'pending', email: creds.email, name: 'Test User' };
            },
          }),
        ]
      : []),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  secret: env.NEXTAUTH_SECRET,
  pages: { signIn: '/login' },
  callbacks: {
    signIn: signInCallback,
    jwt: jwtCallback,
    session: sessionCallback,
  },
};
