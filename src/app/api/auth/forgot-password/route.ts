import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePasswordResetToken } from '@/lib/auth';
import { validateRequest, successResponse, serverErrorResponse } from '@/lib/api-utils';
import { rateLimit } from '@/lib/rate-limit';
import { logAuthEvent, AuthEventType } from '@/lib/auth-logger';

const forgotPasswordSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
});

// Rate limit: 3 requests per hour per IP
const FORGOT_PASSWORD_RATE_LIMIT = {
  maxAttempts: 3,
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
    const rateLimitKey = `forgot-password:${clientIp}`;
    const rateLimitResult = await rateLimit.check(rateLimitKey, FORGOT_PASSWORD_RATE_LIMIT);

    if (!rateLimitResult.success) {
      const remainingMinutes = Math.ceil((rateLimitResult.remainingMs || 0) / 60000);
      return NextResponse.json(
        {
          success: false,
          error: `Çok fazla istek. ${remainingMinutes} dakika sonra tekrar deneyin.`,
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
    const validation = await validateRequest(request, forgotPasswordSchema);

    if (validation.error) {
      return validation.error;
    }

    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Generate reset token (returns null if user doesn't exist)
    const token = await generatePasswordResetToken(normalizedEmail);

    // Always return success to prevent email enumeration
    // The token will be null if user doesn't exist, but we don't reveal that

    if (token) {
      // In production, send email here
      // await sendPasswordResetEmail(normalizedEmail, token);

      await logAuthEvent({
        type: AuthEventType.PASSWORD_RESET_REQUESTED,
        email: normalizedEmail,
        ip: clientIp,
        metadata: { tokenGenerated: true },
      });

      // Include token in dev for testing (remove in production)
      if (process.env.NODE_ENV === 'development') {
        return successResponse({
          message: 'Şifre sıfırlama bağlantısı gönderildi',
          resetToken: token, // Only in development!
        });
      }
    } else {
      // Log attempt for non-existent user
      await logAuthEvent({
        type: AuthEventType.PASSWORD_RESET_REQUESTED,
        email: normalizedEmail,
        ip: clientIp,
        metadata: { tokenGenerated: false, reason: 'USER_NOT_FOUND' },
      });
    }

    // Same response regardless of whether user exists
    return successResponse({
      message: 'Eğer bu email adresi kayıtlıysa, şifre sıfırlama bağlantısı gönderilecektir.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return serverErrorResponse(error);
  }
}

