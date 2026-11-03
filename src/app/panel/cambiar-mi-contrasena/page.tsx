import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import CambiarMiContrasena from "@/components/auth/CambiarMiContrasena";

export const dynamic = "force-dynamic";

/// Página obligatoria tras un blanqueo (o alta) de cuenta: la contraseña en uso
/// es temporal y el usuario tiene que definir una propia antes de seguir. Si ya
/// la cambió, se lo devuelve al panel.
export default async function CambiarMiContrasenaPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }
  if (!user.debeCambiarContrasena) {
    redirect("/panel");
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link href="/" className="auth-brand" title="Volver al portal público del CFL 401">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cfl401azul_logo.jpg"
              alt="CFL 401 Azul"
              className="auth-brand-logo"
              width={46}
              height={46}
            />
            <div className="auth-brand-info">
              <span className="auth-brand-title">CFL 401 Azul</span>
              <span className="auth-brand-badge">Panel Administrativo</span>
            </div>
          </Link>
        </div>

        <h1 className="auth-title">Cambiá tu contraseña</h1>
        <p className="auth-sub">
          Tu cuenta tiene una contraseña provisoria asignada. Establecé una nueva contraseña personal para acceder a tus funciones en el panel.
        </p>

        <CambiarMiContrasena nombre={user.nombre} />

        <div className="auth-footer-links">
          <Link href="/" className="auth-back">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Volver al sitio público
          </Link>
        </div>
      </div>

      <footer className="auth-page-footer">
        <span>Centro de Formación Laboral N° 401 · Azul, Buenos Aires</span>
        <span className="auth-footer-dot" aria-hidden="true">·</span>
        <span>DGCyE / IPFL</span>
      </footer>
    </main>
  );
}