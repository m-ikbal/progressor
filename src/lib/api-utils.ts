import { NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';
import { getAuthSession } from './auth';
import {
  AppError,
  AuthError,
  ValidationError,
  RateLimitError,
  NotFoundError,
  formatErrorResponse,
  getErrorStatusCode,
} from './errors';
import { apiRateLimiter } from './rate-limit';
import { setRateLimitHeaders } from './security-headers';

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400, code?: string) {
  return NextResponse.json(
    { success: false, error: message, ...(code && { code }) },
    { status }
  );
}

export function validationErrorResponse(errors: Record<string, string[]>) {
  return NextResponse.json(
    {
      success: false,
      error: 'Doğrulama hatası',
      code: 'VALIDATION_ERROR',
      validationErrors: errors,
    },
    { status: 400 }
  );
}

export function unauthorizedResponse(message = 'Oturum açmanız gerekiyor') {
  return errorResponse(message, 401, 'UNAUTHORIZED');
}

export function forbiddenResponse(message = 'Bu işlem için yetkiniz yok') {
  return errorResponse(message, 403, 'FORBIDDEN');
}

export function notFoundResponse(resource = 'Kaynak') {
  return errorResponse(`${resource} bulunamadı`, 404, 'NOT_FOUND');
}

export function rateLimitResponse(retryAfter?: number) {
  const response = NextResponse.json(
    {
      success: false,
      error: 'Çok fazla istek. Lütfen bekleyin.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    { status: 429 }
  );

  if (retryAfter) {
    response.headers.set('Retry-After', String(Math.ceil(retryAfter / 1000)));
  }

  return response;
}

export function serverErrorResponse(error?: unknown) {
  // Log error for debugging
  console.error('Server error:', error);

  // Don't expose internal error details in production
  const message =
    process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.message
      : 'Sunucu hatası';

  return errorResponse(message, 500, 'INTERNAL_ERROR');
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

export async function validateRequest<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(err.message);
      });
      return { data: null, error: validationErrorResponse(fieldErrors) };
    }

    if (error instanceof SyntaxError) {
      return { data: null, error: errorResponse('Geçersiz JSON formatı', 400) };
    }

    return { data: null, error: serverErrorResponse(error) };
  }
}

export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse } {
  try {
    const params: Record<string, string | string[]> = {};
    searchParams.forEach((value, key) => {
      const existing = params[key];
      if (existing) {
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          params[key] = [existing, value];
        }
      } else {
        params[key] = value;
      }
    });

    const data = schema.parse(params);
    return { data, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(err.message);
      });
      return { data: null, error: validationErrorResponse(fieldErrors) };
    }
    return { data: null, error: serverErrorResponse(error) };
  }
}

// ============================================================================
// AUTH HELPERS
// ============================================================================

export async function withAuth<T>(
  handler: (userId: string) => Promise<T>
): Promise<T | NextResponse> {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  return handler(session.user.id);
}

export async function getAuthUserId(): Promise<string | null> {
  const session = await getAuthSession();
  return session?.user?.id ?? null;
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  return { page, limit };
}

export function getPaginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

// ============================================================================
// ERROR HANDLER WRAPPER
// ============================================================================

type ApiHandler = (
  request: Request,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>;

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);

      // Handle custom errors
      if (error instanceof AppError) {
        if (error instanceof ValidationError) {
          return validationErrorResponse(error.errors);
        }
        if (error instanceof RateLimitError) {
          return rateLimitResponse(error.retryAfter);
        }
        return errorResponse(error.message, error.statusCode, error.code);
      }

      // Handle Prisma errors
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string; meta?: { target?: string[] } };

        // Unique constraint violation
        if (prismaError.code === 'P2002') {
          const field = prismaError.meta?.target?.[0] || 'alan';
          return errorResponse(`Bu ${field} zaten kullanılıyor`, 409, 'CONFLICT');
        }

        // Record not found
        if (prismaError.code === 'P2025') {
          return notFoundResponse();
        }
      }

      return serverErrorResponse(error);
    }
  };
}

// ============================================================================
// RATE LIMITED HANDLER
// ============================================================================

export function withRateLimit(handler: ApiHandler, limit = 100, windowMs = 60000): ApiHandler {
  return async (request, context) => {
    const result = await apiRateLimiter(request);

    if (!result.success) {
      const response = rateLimitResponse(result.remainingMs);
      return setRateLimitHeaders(response, 0, limit, result.remainingMs);
    }

    const response = await handler(request, context);
    return setRateLimitHeaders(response, result.remaining, limit);
  };
}

// ============================================================================
// COMBINED MIDDLEWARE
// ============================================================================

export function createApiHandler(
  handler: ApiHandler,
  options: {
    requireAuth?: boolean;
    rateLimit?: { limit: number; windowMs: number };
  } = {}
): ApiHandler {
  let wrappedHandler = handler;

  // Apply error handling
  wrappedHandler = withErrorHandler(wrappedHandler);

  // Apply rate limiting if specified
  if (options.rateLimit) {
    const originalHandler = wrappedHandler;
    wrappedHandler = withRateLimit(
      originalHandler,
      options.rateLimit.limit,
      options.rateLimit.windowMs
    );
  }

  // Apply auth check if required
  if (options.requireAuth) {
    const originalHandler = wrappedHandler;
    wrappedHandler = async (request, context) => {
      const session = await getAuthSession();
      if (!session?.user?.id) {
        return unauthorizedResponse();
      }
      return originalHandler(request, context);
    };
  }

  return wrappedHandler;
}
