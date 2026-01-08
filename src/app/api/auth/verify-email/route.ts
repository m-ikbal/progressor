import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyEmailToken } from '@/lib/auth';
import { validateRequest, errorResponse, successResponse, serverErrorResponse } from '@/lib/api-utils';
import { rateLimit } from '@/lib/rate-limit';

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token gereklidir'),
});

// Rate limit: 10 attempts per hour per IP
const VERIFY_EMAIL_RATE_LIMIT = {
  maxAttempts: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
};

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  try {
    // Rate limiting
    const rateLimitKey = `verify-email:${clientIp}`;
    const rateLimitResult = await rateLimit.check(rateLimitKey, VERIFY_EMAIL_RATE_LIMIT);

    if (!rateLimitResult.success) {
      const remainingMinutes = Math.ceil((rateLimitResult.remainingMs || 0) / 60000);
      return NextResponse.json(
        {
          success: false,
          error: `Çok fazla deneme. ${remainingMinutes} dakika sonra tekrar deneyin.`,
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.remainingMs || 0) / 1000)),
          },
        }
      );
    }

    // Validate request
    const validation = await validateRequest(request, verifyEmailSchema);

    if (validation.error) {
      return validation.error;
    }

    const { token } = validation.data;

    // Verify token
    const email = await verifyEmailToken(token);

    if (!email) {
      return errorResponse(
        'Geçersiz veya süresi dolmuş doğrulama bağlantısı',
        400,
        'INVALID_TOKEN'
      );
    }

    return successResponse({
      message: 'Email adresiniz başarıyla doğrulandı',
      email,
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return serverErrorResponse(error);
  }
}

