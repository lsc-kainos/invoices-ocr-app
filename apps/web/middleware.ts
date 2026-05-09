import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { rateLimit } from '@/lib/rate-limit';

const authMiddleware = withAuth({
  pages: { signIn: '/login' },
});

// Rate-limit é bypassado fora de production (NextAuth faz várias chamadas
// /api/auth/* num único fluxo de login — limite queima rápido em dev).
function rateLimitEnabled() {
  return process.env.NODE_ENV === 'production';
}

// Limite só os endpoints que são vetor real de brute-force OAuth:
// signin/* (início do fluxo) e callback/* (troca de code). Outros caminhos
// /api/auth/* (csrf, session, signout, providers, _log) são chamadas
// rotineiras do NextAuth client e PRECISAM passar — limitá-las trava
// logout, mata polling de sessão e gera 429 em uso normal.
function isRateLimited(pathname: string): boolean {
  return pathname.startsWith('/api/auth/signin/') || pathname.startsWith('/api/auth/callback/');
}

const SENSITIVE_AUTH_LIMIT = 10;

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/auth/')) {
    if (rateLimitEnabled() && isRateLimited(pathname)) {
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';
      const result = rateLimit(ip, SENSITIVE_AUTH_LIMIT);
      if (result.limited) {
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: { 'Retry-After': String(result.retryAfter) },
        });
      }
    }
    return NextResponse.next();
  }

  // Outras rotas /api/* (proxy/route handlers) decidem auth sozinhas.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  return (authMiddleware as unknown as (req: NextRequest) => Response | Promise<Response>)(req);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
};
