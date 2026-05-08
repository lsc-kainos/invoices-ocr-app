import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Role } from '@prisma/client';
import { prisma } from './prisma';
import { env } from './env';

const adminEmails = env.ADMIN_EMAILS.split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export async function signInCallback({
  user,
}: {
  user: {
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
}) {
  if (!user.email) return false;
  const role: Role = adminEmails.includes(user.email.toLowerCase()) ? Role.ADMIN : Role.USER;
  await prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name ?? undefined,
      avatar: user.image ?? undefined,
      role,
    },
    create: {
      email: user.email,
      name: user.name ?? null,
      avatar: user.image ?? null,
      role,
    },
  });
  return true;
}

type JwtArgs = {
  token: Record<string, unknown>;
  user?: { email?: string | null } | null;
  trigger?: string;
};

export async function jwtCallback({ token, user, trigger }: JwtArgs) {
  if (user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });
    if (dbUser) {
      token.sub = dbUser.id;
      token.role = dbUser.role;
      token.email = dbUser.email;
    }
  } else if (trigger === 'update' && typeof token.email === 'string') {
    const dbUser = await prisma.user.findUnique({
      where: { email: token.email },
    });
    if (dbUser) token.role = dbUser.role;
  }
  return token;
}

type SessionArgs = {
  session: { user?: Record<string, unknown>; expires: string };
  token: Record<string, unknown>;
};

export async function sessionCallback({ session, token }: SessionArgs) {
  if (session.user && token.sub) {
    session.user = { ...session.user, id: token.sub, role: token.role };
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
    ...(process.env.NODE_ENV === 'test'
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
    signIn: signInCallback as never,
    jwt: jwtCallback as never,
    session: sessionCallback as never,
  },
};
