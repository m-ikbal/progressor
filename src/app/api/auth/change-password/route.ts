import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthSession, changePassword } from '@/lib/auth';
import { validateRequest, errorResponse, successResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { rateLimit } from '@/lib/rate-limit';
import { logAuthEvent, AuthEventType } from '@/lib/auth-logger';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mevcut şifre gereklidir'),
  newPassword: z
    .string()
    .min(8, 'Yeni şifre en az 8 karakter olmalıdır')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'
    ),
  confirmNewPassword: z.string().min(1, 'Şifre tekrarı gereklidir'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmNewPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'Yeni şifre mevcut şifreden farklı olmalıdır',
  path: ['newPassword'],
});

// Rate limit: 5 attempts per hour per user
const CHANGE_PASSWORD_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
};

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const userId = session.user.id;

    // Rate limiting per user
    const rateLimitKey = `change-password:${userId}`;
    const rateLimitResult = await rateLimit.check(rateLimitKey, CHANGE_PASSWORD_RATE_LIMIT);

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
    const validation = await validateRequest(request, changePasswordSchema);

    if (validation.error) {
      return validation.error;
    }

    const { currentPassword, newPassword } = validation.data;

    // Attempt to change password
    const result = await changePassword(userId, currentPassword, newPassword);

    if (!result.success) {
      return errorResponse(result.error || 'Şifre değiştirilemedi', 400, 'PASSWORD_CHANGE_FAILED');
    }

    // Clear rate limit on success
    await rateLimit.reset(rateLimitKey);

    return successResponse({
      message: 'Şifreniz başarıyla değiştirildi',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return serverErrorResponse(error);
  }
}

