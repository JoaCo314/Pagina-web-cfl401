import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT) || 5432,
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'cfl401',
      connectionTimeoutMillis: 3000,
    });
  }
  return pool;
}

export async function checkDatabase() {
  let status: 'ok' | 'error' = 'error';
  let error: string | null = null;

  try {
    await getPool().query('SELECT NOW()');
    status = 'ok';
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  return { status, error };
}
