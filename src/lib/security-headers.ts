import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================================
// SECURITY HEADERS CONFIGURATION
// ============================================================================

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: boolean;
  strictTransportSecurity?: boolean;
  xContentTypeOptions?: boolean;
  xFrameOptions?: boolean;
  xXssProtection?: boolean;
  referrerPolicy?: boolean;
  permissionsPolicy?: boolean;
}

const defaultConfig: SecurityHeadersConfig = {
  contentSecurityPolicy: true,
  strictTransportSecurity: true,
  xContentTypeOptions: true,
  xFrameOptions: true,
  xXssProtection: true,
  referrerPolicy: true,
  permissionsPolicy: true,
};

// ============================================================================
// CSP CONFIGURATION
// ============================================================================

function getContentSecurityPolicy(): string {
  const isDev = process.env.NODE_ENV === 'development';

  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Next.js
      "'unsafe-eval'", // Required for Next.js in dev
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    'style-src': ["'self'", "'unsafe-inline'"], // Required for Tailwind
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      ...(isDev ? ['ws://localhost:*', 'http://localhost:*'] : []),
    ],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'upgrade-insecure-requests': [],
  };

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

// ============================================================================
// APPLY SECURITY HEADERS
// ============================================================================

export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = defaultConfig
): NextResponse {
  const headers = response.headers;

  // Content Security Policy
  if (config.contentSecurityPolicy) {
    headers.set('Content-Security-Policy', getContentSecurityPolicy());
  }

  // HTTP Strict Transport Security
  if (config.strictTransportSecurity && process.env.NODE_ENV === 'production') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // X-Content-Type-Options
  if (config.xContentTypeOptions) {
    headers.set('X-Content-Type-Options', 'nosniff');
  }

  // X-Frame-Options
  if (config.xFrameOptions) {
    headers.set('X-Frame-Options', 'DENY');
  }

  // X-XSS-Protection
  if (config.xXssProtection) {
    headers.set('X-XSS-Protection', '1; mode=block');
  }

  // Referrer-Policy
  if (config.referrerPolicy) {
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }

  // Permissions-Policy
  if (config.permissionsPolicy) {
    headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );
  }

  // Additional security headers
  headers.set('X-DNS-Prefetch-Control', 'on');
  headers.set('X-Download-Options', 'noopen');
  headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  return response;
}

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

const defaultCorsConfig: CorsConfig = {
  allowedOrigins: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000'] 
    : [],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
  credentials: true,
};

export function applyCorsHeaders(
  request: NextRequest,
  response: NextResponse,
  config: CorsConfig = defaultCorsConfig
): NextResponse {
  const origin = request.headers.get('origin');
  const headers = response.headers;

  // Check if origin is allowed
  if (origin && (config.allowedOrigins.includes(origin) || config.allowedOrigins.includes('*'))) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  headers.set('Access-Control-Allow-Methods', config.allowedMethods.join(', '));
  headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
  headers.set('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
  headers.set('Access-Control-Max-Age', String(config.maxAge));

  if (config.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

// ============================================================================
// API RESPONSE HEADERS
// ============================================================================

export function setApiResponseHeaders(response: NextResponse): NextResponse {
  const headers = response.headers;

  // Prevent caching of API responses by default
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');

  // Security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');

  return response;
}

// ============================================================================
// RATE LIMIT HEADERS
// ============================================================================

export function setRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  limit: number,
  resetMs?: number
): NextResponse {
  const headers = response.headers;

  headers.set('X-RateLimit-Limit', String(limit));
  headers.set('X-RateLimit-Remaining', String(Math.max(0, remaining)));

  if (resetMs !== undefined) {
    headers.set('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000 + resetMs / 1000)));
    headers.set('Retry-After', String(Math.ceil(resetMs / 1000)));
  }

  return response;
}

