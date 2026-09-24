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
        <div className="auth-logo">
          <span className="auth-logo-dot"></span>
          Panel Administrativo
        </div>
        <h1>Bienvenido</h1>
        <p className="auth-sub">
          Ingresá con tu cuenta para administrar la plataforma del CFL 401.
        </p>
        <p className="auth-note">
          Solo nuestro personal institucional necesita ingresar al sistema.
        </p>
        <LoginForm />
        <Link href="/" className="auth-back">
          <span aria-hidden="true">←</span> Volver al sitio público
        </Link>
      </div>
    </main>
  );
}