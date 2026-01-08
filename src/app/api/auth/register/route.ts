import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { registerSchema } from '@/lib/validations';
import { hashPassword, generateVerificationToken } from '@/lib/auth';
import { validateRequest, errorResponse, serverErrorResponse, successResponse } from '@/lib/api-utils';
import { rateLimit } from '@/lib/rate-limit';
import { logAuthEvent, AuthEventType, detectSuspiciousActivity } from '@/lib/auth-logger';

// Rate limit: 5 registration attempts per hour per IP
const REGISTER_RATE_LIMIT = {
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
    // Rate limiting check
    const rateLimitKey = `register:${clientIp}`;
    const rateLimitResult = await rateLimit.check(rateLimitKey, REGISTER_RATE_LIMIT);

    if (!rateLimitResult.success) {
      const remainingMinutes = Math.ceil((rateLimitResult.remainingMs || 0) / 60000);
      return NextResponse.json(
        {
          success: false,
          error: `Çok fazla kayıt denemesi. ${remainingMinutes} dakika sonra tekrar deneyin.`,
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

    // Validate request body
    const validation = await validateRequest(request, registerSchema);

    if (validation.error) {
      return validation.error;
    }

    const { name, email, password } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check for suspicious activity
    const suspiciousCheck = await detectSuspiciousActivity(normalizedEmail);
    if (suspiciousCheck.suspicious) {
      await logAuthEvent({
        type: AuthEventType.SUSPICIOUS_ACTIVITY,
        email: normalizedEmail,
        ip: clientIp,
        metadata: { reason: suspiciousCheck.reason, action: 'REGISTRATION_BLOCKED' },
      });

      return errorResponse(
        'Şüpheli aktivite tespit edildi. Lütfen daha sonra tekrar deneyin.',
        403
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Don't reveal if email exists for security
      // But log the attempt
      await logAuthEvent({
        type: AuthEventType.ACCOUNT_CREATED,
        email: normalizedEmail,
        ip: clientIp,
        metadata: { status: 'DUPLICATE_EMAIL' },
      });

      // Return same success message to prevent email enumeration
      // In production, you might want to send an email saying "account already exists"
      return errorResponse('Bu email adresi zaten kullanılıyor', 409, 'EMAIL_EXISTS');
    }

    // Hash password with high cost factor
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: null, // Require email verification in production
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Create default category for new user
    await db.category.create({
      data: {
        name: 'Genel',
        description: 'Genel görevler ve notlar',
        color: '#6366f1',
        icon: 'Folder',
        sortOrder: 0,
        userId: user.id,
      },
    });

    // Generate email verification token (for production use)
    const verificationToken = await generateVerificationToken(normalizedEmail);

    // Log successful registration
    await logAuthEvent({
      type: AuthEventType.ACCOUNT_CREATED,
      email: normalizedEmail,
      userId: user.id,
      ip: clientIp,
    });

    // In production, send verification email here
    // await sendVerificationEmail(normalizedEmail, verificationToken);

    await logAuthEvent({
      type: AuthEventType.EMAIL_VERIFICATION_SENT,
      email: normalizedEmail,
      userId: user.id,
    });

    return successResponse(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        message: 'Hesabınız başarıyla oluşturuldu',
        // Include token in dev for testing (remove in production)
        ...(process.env.NODE_ENV === 'development' && { verificationToken }),
      },
      201
    );
  } catch (error) {
    console.error('Registration error:', error);

    await logAuthEvent({
      type: AuthEventType.ACCOUNT_CREATED,
      ip: clientIp,
      metadata: { status: 'ERROR', error: String(error) },
    });

    return serverErrorResponse(error);
  }
}
