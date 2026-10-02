import { NextResponse } from 'next/server';
import { checkDatabase } from '@/lib/db';

export async function GET() {
  const database = await checkDatabase();
  const status = database.status === 'ok' ? 'ok' : 'degraded';

  // /api/health es público (lo consultan Docker y balanceadores), así que el
  // detalle del error de Prisma solo va al log del servidor: el mensaje crudo
  // puede traer credenciales o nombres de host de la base.
  if (database.error) {
    console.error('[Health] Base de datos inaccesible:', database.error);
  }

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      service: 'CFL 401 API',
      database: { status: database.status },
    },
    { status: database.status === 'ok' ? 200 : 503 }
  );
}
