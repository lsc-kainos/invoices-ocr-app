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

type Callbacks = NonNullable<NextAuthOptions['callbacks']>;
type SignInArgs = Parameters<NonNullable<Callbacks['signIn']>>[0];

export async function signInCallback({ user }: SignInArgs) {
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

type JwtArgs = Parameters<NonNullable<Callbacks['jwt']>>[0];

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
    signIn: signInCallback,
    jwt: jwtCallback,
    session: sessionCallback,
  },
};
