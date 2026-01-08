import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in-memory for middleware)
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.timestamp > 60000) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return ip;
}

function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = `ratelimit:${ip}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.timestamp > windowMs) {
    rateLimitStore.set(key, { count: 1, timestamp: now });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

export default withAuth(
  function middleware(request) {
    const { pathname } = request.nextUrl;
    const ip = getClientIp(request);

    // Rate limiting for API routes
    if (pathname.startsWith('/api')) {
      // Stricter limit for auth routes
      const isAuthRoute = pathname.startsWith('/api/auth');
      const limit = isAuthRoute ? 20 : 100;
      const windowMs = isAuthRoute ? 60000 : 60000;

      if (!checkRateLimit(ip, limit, windowMs)) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Çok fazla istek. Lütfen bekleyin.',
            code: 'RATE_LIMIT_EXCEEDED',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60',
            },
          }
        );
      }
    }

    // Add security headers to response
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes - allow without auth
        const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
        if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
          return true;
        }

        // API auth routes - allow without auth
        if (pathname.startsWith('/api/auth')) {
          return true;
        }

        // API public routes
        if (pathname === '/api/health') {
          return true;
        }

        // All other routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
