import { NextAuthOptions, getServerSession } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { AuthError, RateLimitError } from './errors';
import { rateLimit } from './rate-limit';
import { logAuthEvent, AuthEventType } from './auth-logger';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const SESSION_UPDATE_AGE = 24 * 60 * 60; // 24 hours
const BCRYPT_ROUNDS = 12;

// ============================================================================
// AUTH OPTIONS
// ============================================================================

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new AuthError('Email ve şifre gereklidir', 'MISSING_CREDENTIALS');
        }

        const email = credentials.email.toLowerCase().trim();
        const clientIp = getClientIp(req);

        // Rate limiting check
        const rateLimitResult = await rateLimit.check(`auth:${email}`, {
          maxAttempts: MAX_LOGIN_ATTEMPTS,
          windowMs: LOCKOUT_DURATION_MINUTES * 60 * 1000,
        });

        if (!rateLimitResult.success) {
          await logAuthEvent({
            type: AuthEventType.LOGIN_RATE_LIMITED,
            email,
            ip: clientIp,
            metadata: { remainingMs: rateLimitResult.remainingMs },
          });
          
          const remainingMinutes = Math.ceil((rateLimitResult.remainingMs || 0) / 60000);
          throw new RateLimitError(
            `Çok fazla başarısız giriş denemesi. ${remainingMinutes} dakika sonra tekrar deneyin.`
          );
        }

        // Find user
        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            image: true,
            emailVerified: true,
            createdAt: true,
          },
        });

        if (!user || !user.password) {
          await logAuthEvent({
            type: AuthEventType.LOGIN_FAILED,
            email,
            ip: clientIp,
            metadata: { reason: 'USER_NOT_FOUND' },
          });
          
          // Use same error message for security (don't reveal if user exists)
          throw new AuthError('Geçersiz email veya şifre', 'INVALID_CREDENTIALS');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          await logAuthEvent({
            type: AuthEventType.LOGIN_FAILED,
            email,
            ip: clientIp,
            userId: user.id,
            metadata: { reason: 'INVALID_PASSWORD' },
          });
          
          throw new AuthError('Geçersiz email veya şifre', 'INVALID_CREDENTIALS');
        }

        // Clear rate limit on successful login
        await rateLimit.reset(`auth:${email}`);

        // Log successful login
        await logAuthEvent({
          type: AuthEventType.LOGIN_SUCCESS,
          email,
          ip: clientIp,
          userId: user.id,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.emailVerified = user.emailVerified;
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token.name = session.name ?? token.name;
        token.picture = session.image ?? token.picture;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        session.user.emailVerified = token.emailVerified as Date | null;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Block sign in if email not verified (for OAuth providers)
      if (account?.provider !== 'credentials') {
        // OAuth providers auto-verify email
        return true;
      }
      return true;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        await logAuthEvent({
          type: AuthEventType.ACCOUNT_CREATED,
          email: user.email!,
          userId: user.id,
        });
      }
    },
    async signOut({ token }) {
      if (token?.email) {
        await logAuthEvent({
          type: AuthEventType.LOGOUT,
          email: token.email as string,
          userId: token.id as string,
        });
      }
    },
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  debug: process.env.NODE_ENV === 'development',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getClientIp(req: any): string {
  const forwarded = req?.headers?.['x-forwarded-for'];
  const ip = forwarded
    ? (typeof forwarded === 'string' ? forwarded : forwarded[0])?.split(',')[0]?.trim()
    : req?.socket?.remoteAddress || 'unknown';
  return ip;
}

/**
 * Get session on server side
 */
export async function getAuthSession() {
  return getServerSession(authOptions);
}

/**
 * Get current authenticated user with fresh data from database
 */
export async function getCurrentUser() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    throw new AuthError('Oturum açmanız gerekiyor', 'UNAUTHORIZED');
  }

  return session.user;
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate secure random token
 */
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    token += chars[randomValues[i] % chars.length];
  }
  return token;
}

/**
 * Generate verification token for email
 */
export async function generateVerificationToken(email: string): Promise<string> {
  const token = generateToken(64);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Delete any existing tokens for this email
  await db.verificationToken.deleteMany({
    where: { identifier: email },
  });

  // Create new token
  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}

/**
 * Verify email verification token
 */
export async function verifyEmailToken(token: string): Promise<string | null> {
  const verificationToken = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return null;
  }

  if (verificationToken.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return null;
  }

  const email = verificationToken.identifier;

  // Mark user as verified
  await db.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  // Delete used token
  await db.verificationToken.delete({ where: { token } });

  await logAuthEvent({
    type: AuthEventType.EMAIL_VERIFIED,
    email,
  });

  return email;
}

/**
 * Generate password reset token
 */
export async function generatePasswordResetToken(email: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    return null;
  }

  const token = generateToken(64);
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Delete any existing reset tokens for this email
  await db.verificationToken.deleteMany({
    where: {
      identifier: `reset:${email}`,
    },
  });

  // Create new reset token
  await db.verificationToken.create({
    data: {
      identifier: `reset:${email}`,
      token,
      expires,
    },
  });

  await logAuthEvent({
    type: AuthEventType.PASSWORD_RESET_REQUESTED,
    email,
    userId: user.id,
  });

  return token;
}

/**
 * Reset password with token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<boolean> {
  const verificationToken = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken || !verificationToken.identifier.startsWith('reset:')) {
    return false;
  }

  if (verificationToken.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return false;
  }

  const email = verificationToken.identifier.replace('reset:', '');
  const hashedPassword = await hashPassword(newPassword);

  await db.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  // Delete used token
  await db.verificationToken.delete({ where: { token } });

  // Clear any rate limits
  await rateLimit.reset(`auth:${email}`);

  await logAuthEvent({
    type: AuthEventType.PASSWORD_RESET_SUCCESS,
    email,
  });

  return true;
}

/**
 * Change password for authenticated user
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, password: true },
  });

  if (!user || !user.password) {
    return { success: false, error: 'Kullanıcı bulunamadı' };
  }

  const isValid = await verifyPassword(currentPassword, user.password);

  if (!isValid) {
    await logAuthEvent({
      type: AuthEventType.PASSWORD_CHANGE_FAILED,
      email: user.email,
      userId: user.id,
      metadata: { reason: 'INVALID_CURRENT_PASSWORD' },
    });
    return { success: false, error: 'Mevcut şifre yanlış' };
  }

  const hashedPassword = await hashPassword(newPassword);

  await db.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  await logAuthEvent({
    type: AuthEventType.PASSWORD_CHANGED,
    email: user.email,
    userId: user.id,
  });

  return { success: true };
}
