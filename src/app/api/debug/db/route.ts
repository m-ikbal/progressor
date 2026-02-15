import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function safeConnectionInfo(databaseUrl: string) {
  try {
    const u = new URL(databaseUrl);
    return {
      protocol: u.protocol.replace(':', ''),
      host: u.host, // no credentials
      database: u.pathname?.replace(/^\//, '') || null,
      isNeon: u.host.includes('.neon.tech'),
    };
  } catch {
    // If DATABASE_URL isn't a valid URL (shouldn't happen for Postgres), avoid leaking it.
    return { protocol: null, host: null, database: null, isNeon: null };
  }
}

// Dev-only endpoint to verify which DB the running app is connected to (without exposing secrets).
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const databaseUrl = process.env.DATABASE_URL ?? '';
  const conn = safeConnectionInfo(databaseUrl);

  // If we're connected to Postgres, confirm the server-side DB name/schema.
  // (Safe: returns only DB and schema names)
  let server: { database: string; schema: string } | null = null;
  let tables: string[] | null = null;
  let counts: Record<string, number> | null = null;
  try {
    const rows = await db.$queryRaw<{ database: string; schema: string }[]>`
      select current_database() as database, current_schema() as schema
    `;
    server = rows?.[0] ?? null;

    const tableRows = await db.$queryRaw<{ tablename: string }[]>`
      select tablename
      from pg_tables
      where schemaname = 'public'
      order by tablename asc
    `;
    tables = tableRows.map((r) => r.tablename);

    // Quick sanity counts for key app tables (Prisma models are PascalCase -> quoted identifiers)
    const [userCount, categoryCount, taskCount, noteCount] = await Promise.all([
      db.$queryRaw<{ count: bigint }[]>`select count(*)::bigint as count from "User"`,
      db.$queryRaw<{ count: bigint }[]>`select count(*)::bigint as count from "Category"`,
      db.$queryRaw<{ count: bigint }[]>`select count(*)::bigint as count from "Task"`,
      db.$queryRaw<{ count: bigint }[]>`select count(*)::bigint as count from "Note"`,
    ]);

    counts = {
      User: Number(userCount?.[0]?.count ?? 0n),
      Category: Number(categoryCount?.[0]?.count ?? 0n),
      Task: Number(taskCount?.[0]?.count ?? 0n),
      Note: Number(noteCount?.[0]?.count ?? 0n),
    };
  } catch {
    // Ignore; if misconfigured, this endpoint still helps by showing parsed host/db.
  }

  return NextResponse.json({
    connection: conn,
    server,
    tables,
    counts,
  });
}


