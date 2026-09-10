import { checkDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const db = await checkDatabase();
  const appStatus = db.status === 'ok' ? 'ok' : 'degraded';

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">CFL 401</h1>
      <p className="text-lg text-gray-600 mb-8">Plataforma Web</p>

      <div className="border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Estado del Backend</h2>
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              appStatus === 'ok' ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="capitalize">{appStatus}</span>
        </div>

        <div className="mt-3 text-sm">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                db.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span>
              Base de datos: <span className="capitalize">{db.status}</span>
            </span>
          </div>
          {db.error && <p className="text-red-600 mt-1 text-xs">{db.error}</p>}
        </div>

        <p className="text-sm text-gray-500 mt-3">
          Último check: {new Date().toLocaleString('es-AR')}
        </p>
      </div>
    </main>
  );
}
