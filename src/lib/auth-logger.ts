// ============================================================================
// AUTH EVENT LOGGING
// For production, integrate with proper logging service (e.g., LogTail, Datadog)
// ============================================================================

export enum AuthEventType {
  // Login events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGIN_RATE_LIMITED = 'LOGIN_RATE_LIMITED',
  LOGOUT = 'LOGOUT',

  // Account events
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',

  // Email events
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  EMAIL_VERIFICATION_SENT = 'EMAIL_VERIFICATION_SENT',

  // Password events
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_CHANGE_FAILED = 'PASSWORD_CHANGE_FAILED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  PASSWORD_RESET_FAILED = 'PASSWORD_RESET_FAILED',

  // Security events
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SESSION_INVALIDATED = 'SESSION_INVALIDATED',
}

export interface AuthLogEvent {
  type: AuthEventType;
  email?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

interface AuthLogEntry extends AuthLogEvent {
  timestamp: Date;
  environment: string;
}

// In-memory log storage (for development)
// In production, use proper logging infrastructure
const logStore: AuthLogEntry[] = [];
const MAX_LOG_ENTRIES = 10000;

/**
 * Log an authentication event
 */
export async function logAuthEvent(event: AuthLogEvent): Promise<void> {
  const entry: AuthLogEntry = {
    ...event,
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  };

  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    const emoji = getEventEmoji(event.type);
    console.log(
      `${emoji} [AUTH] ${event.type}`,
      JSON.stringify({
        email: event.email,
        userId: event.userId,
        ip: event.ip,
        ...event.metadata,
      })
    );
  }

  // Store in memory (replace with proper logging in production)
  logStore.push(entry);

  // Keep log size manageable
  if (logStore.length > MAX_LOG_ENTRIES) {
    logStore.shift();
  }

  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    await sendToLoggingService(entry);
  }
}

/**
 * Get recent auth events for a user
 */
export async function getAuthEventsForUser(
  userId: string,
  limit: number = 50
): Promise<AuthLogEntry[]> {
  return logStore
    .filter((entry) => entry.userId === userId)
    .slice(-limit)
    .reverse();
}

/**
 * Get recent auth events by type
 */
export async function getAuthEventsByType(
  type: AuthEventType,
  limit: number = 100
): Promise<AuthLogEntry[]> {
  return logStore
    .filter((entry) => entry.type === type)
    .slice(-limit)
    .reverse();
}

/**
 * Get failed login attempts for an email
 */
export async function getFailedLoginAttempts(
  email: string,
  windowMs: number = 15 * 60 * 1000
): Promise<number> {
  const cutoff = new Date(Date.now() - windowMs);
  return logStore.filter(
    (entry) =>
      entry.email === email &&
      entry.type === AuthEventType.LOGIN_FAILED &&
      entry.timestamp > cutoff
  ).length;
}

/**
 * Check for suspicious activity patterns
 */
export async function detectSuspiciousActivity(
  email: string
): Promise<{ suspicious: boolean; reason?: string }> {
  const recentEvents = logStore.filter(
    (entry) =>
      entry.email === email &&
      entry.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
  );

  // Check for multiple failed logins from different IPs
  const failedLogins = recentEvents.filter(
    (e) => e.type === AuthEventType.LOGIN_FAILED
  );
  const uniqueIps = new Set(failedLogins.map((e) => e.ip).filter(Boolean));

  if (failedLogins.length >= 10 && uniqueIps.size >= 3) {
    return {
      suspicious: true,
      reason: 'Multiple failed logins from different IPs',
    };
  }

  // Check for rapid password reset requests
  const resetRequests = recentEvents.filter(
    (e) => e.type === AuthEventType.PASSWORD_RESET_REQUESTED
  );

  if (resetRequests.length >= 5) {
    return {
      suspicious: true,
      reason: 'Excessive password reset requests',
    };
  }

  return { suspicious: false };
}

/**
 * Clear old log entries
 */
export async function cleanupOldLogs(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
  const cutoff = new Date(Date.now() - maxAgeMs);
  const initialLength = logStore.length;
  
  const index = logStore.findIndex((entry) => entry.timestamp > cutoff);
  if (index > 0) {
    logStore.splice(0, index);
  }
  
  return initialLength - logStore.length;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getEventEmoji(type: AuthEventType): string {
  const emojis: Record<AuthEventType, string> = {
    [AuthEventType.LOGIN_SUCCESS]: '✅',
    [AuthEventType.LOGIN_FAILED]: '❌',
    [AuthEventType.LOGIN_RATE_LIMITED]: '🚫',
    [AuthEventType.LOGOUT]: '👋',
    [AuthEventType.ACCOUNT_CREATED]: '🆕',
    [AuthEventType.ACCOUNT_DELETED]: '🗑️',
    [AuthEventType.EMAIL_VERIFIED]: '📧',
    [AuthEventType.EMAIL_VERIFICATION_SENT]: '📤',
    [AuthEventType.PASSWORD_CHANGED]: '🔐',
    [AuthEventType.PASSWORD_CHANGE_FAILED]: '🔒',
    [AuthEventType.PASSWORD_RESET_REQUESTED]: '🔄',
    [AuthEventType.PASSWORD_RESET_SUCCESS]: '✅',
    [AuthEventType.PASSWORD_RESET_FAILED]: '❌',
    [AuthEventType.SUSPICIOUS_ACTIVITY]: '⚠️',
    [AuthEventType.SESSION_INVALIDATED]: '🚪',
  };
  return emojis[type] || '📋';
}

async function sendToLoggingService(entry: AuthLogEntry): Promise<void> {
  // Placeholder for production logging integration
  // Examples: LogTail, Datadog, Sentry, CloudWatch, etc.
  
  // Example with fetch (uncomment and configure for your service):
  /*
  try {
    await fetch(process.env.LOGGING_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LOGGING_API_KEY}`,
      },
      body: JSON.stringify({
        service: 'progressor',
        level: getLogLevel(entry.type),
        message: `Auth event: ${entry.type}`,
        ...entry,
      }),
    });
  } catch (error) {
    console.error('Failed to send log to service:', error);
  }
  */
}

function getLogLevel(type: AuthEventType): 'info' | 'warn' | 'error' {
  const warnTypes = [
    AuthEventType.LOGIN_FAILED,
    AuthEventType.LOGIN_RATE_LIMITED,
    AuthEventType.PASSWORD_CHANGE_FAILED,
    AuthEventType.PASSWORD_RESET_FAILED,
  ];
  
  const errorTypes = [
    AuthEventType.SUSPICIOUS_ACTIVITY,
  ];
  
  if (errorTypes.includes(type)) return 'error';
  if (warnTypes.includes(type)) return 'warn';
  return 'info';
}

