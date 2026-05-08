import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { rateLimit } from '@/lib/rate-limit';

const authMiddleware = withAuth({
  pages: { signIn: '/login' },
});

// Rate-limit é bypassado fora de production (NextAuth faz várias chamadas
// /api/auth/* num único fluxo de login — 5/min queima na primeira tentativa
// em dev). Em prod (Railway), o limite vale.
function rateLimitEnabled() {
  return process.env.NODE_ENV === 'production';
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/auth/')) {
    if (rateLimitEnabled()) {
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';
      const result = rateLimit(ip);
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
