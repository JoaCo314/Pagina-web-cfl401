import { prisma } from '@/lib/prisma';

export async function checkDatabase() {
  let status: 'ok' | 'error' = 'error';
  let error: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    status = 'ok';
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  return { status, error };
}
