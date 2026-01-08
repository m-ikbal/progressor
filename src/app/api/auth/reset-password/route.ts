import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resetPasswordWithToken } from '@/lib/auth';
import { validateRequest, errorResponse, successResponse, serverErrorResponse } from '@/lib/api-utils';
import { rateLimit } from '@/lib/rate-limit';
import { logAuthEvent, AuthEventType } from '@/lib/auth-logger';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token gereklidir'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'
    ),
  confirmPassword: z.string().min(1, 'Şifre tekrarı gereklidir'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

// Rate limit: 5 attempts per hour per IP
const RESET_PASSWORD_RATE_LIMIT = {
  maxAttempts: 5,
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
    const rateLimitKey = `reset-password:${clientIp}`;
    const rateLimitResult = await rateLimit.check(rateLimitKey, RESET_PASSWORD_RATE_LIMIT);

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
    const validation = await validateRequest(request, resetPasswordSchema);

    if (validation.error) {
      return validation.error;
    }

    const { token, password } = validation.data;

    // Attempt to reset password
    const success = await resetPasswordWithToken(token, password);

    if (!success) {
      await logAuthEvent({
        type: AuthEventType.PASSWORD_RESET_FAILED,
        ip: clientIp,
        metadata: { reason: 'INVALID_OR_EXPIRED_TOKEN' },
      });

      return errorResponse(
        'Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı',
        400,
        'INVALID_TOKEN'
      );
    }

    return successResponse({
      message: 'Şifreniz başarıyla değiştirildi. Giriş yapabilirsiniz.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return serverErrorResponse(error);
  }
}

