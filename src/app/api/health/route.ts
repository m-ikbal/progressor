import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Health check endpoint
 * Used for monitoring and load balancer checks
 */
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    checks: {
      database: false,
    },
  };

  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;
    health.checks.database = true;
  } catch (error) {
    health.status = 'degraded';
    console.error('Health check - Database error:', error);
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

