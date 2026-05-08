import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { rateLimit } from '@/lib/rate-limit';

const authMiddleware = withAuth({
  pages: { signIn: '/login' },
});

export default function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/auth/')) {
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
    return NextResponse.next();
  }
  return (authMiddleware as unknown as (req: NextRequest) => Response | Promise<Response>)(req);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
};
