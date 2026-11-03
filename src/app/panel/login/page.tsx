// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import LoginForm from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default async function PanelLoginPage() {
  const user = await getCurrentUser();

  if (user) {
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

        <h1 className="auth-title">Iniciar sesión</h1>
        <p className="auth-sub">
          Ingresá con tu correo electrónico o tu DNI para administrar la plataforma institucional.
        </p>

        <div className="auth-note">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="auth-note-icon"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Acceso exclusivo para el personal directivo, docente y administrativo del centro.</span>
        </div>

        <LoginForm />

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