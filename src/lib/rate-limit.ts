// ============================================================================
// IN-MEMORY RATE LIMITER
// For production, use Redis-based rate limiting
// ============================================================================

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  remainingMs?: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  /**
   * Check if request should be rate limited
   */
  async check(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.store.get(key);

    // No previous attempts
    if (!entry) {
      this.store.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return { success: true, remaining: options.maxAttempts - 1 };
    }

    // Window has expired, reset
    if (now - entry.firstAttempt > options.windowMs) {
      this.store.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return { success: true, remaining: options.maxAttempts - 1 };
    }

    // Still within window
    entry.count++;
    entry.lastAttempt = now;
    this.store.set(key, entry);

    // Check if exceeded
    if (entry.count > options.maxAttempts) {
      const remainingMs = options.windowMs - (now - entry.firstAttempt);
      return {
        success: false,
        remaining: 0,
        remainingMs: Math.max(0, remainingMs),
      };
    }

    return {
      success: true,
      remaining: options.maxAttempts - entry.count,
    };
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Get current count for a key
   */
  async getCount(key: string): Promise<number> {
    const entry = this.store.get(key);
    return entry?.count || 0;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [key, entry] of this.store.entries()) {
      if (now - entry.lastAttempt > maxAge) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Stop cleanup interval (for testing)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Global rate limiter instance
export const rateLimit = new RateLimiter();

// ============================================================================
// API RATE LIMITER MIDDLEWARE
// ============================================================================

interface ApiRateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (request: Request) => string;
}

const defaultKeyGenerator = (request: Request): string => {
  // Get IP from headers (works with proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return `api:${ip}`;
};

/**
 * Create rate limit middleware for API routes
 */
export function createRateLimiter(options: ApiRateLimitOptions) {
  const {
    maxRequests,
    windowMs,
    keyGenerator = defaultKeyGenerator,
  } = options;

  return async (request: Request): Promise<RateLimitResult & { key: string }> => {
    const key = keyGenerator(request);
    const result = await rateLimit.check(key, {
      maxAttempts: maxRequests,
      windowMs,
    });
    return { ...result, key };
  };
}

// ============================================================================
// PRESET RATE LIMITERS
// ============================================================================

/**
 * Rate limiter for authentication endpoints
 * 5 attempts per 15 minutes per IP
 */
export const authRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
});

/**
 * Rate limiter for API endpoints
 * 100 requests per minute per IP
 */
export const apiRateLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000,
});

/**
 * Rate limiter for sensitive operations
 * 10 requests per hour per IP
 */
export const sensitiveRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
});

