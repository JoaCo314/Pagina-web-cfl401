import { NextResponse } from 'next/server';
import { checkDatabase } from '@/lib/db';

export async function GET() {
  const database = await checkDatabase();
  const status = database.status === 'ok' ? 'ok' : 'degraded';

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      service: 'CFL 401 API',
      database: {
        status: database.status,
        ...(database.error ? { error: database.error } : {}),
      },
    },
    { status: database.status === 'ok' ? 200 : 503 }
  );
}
