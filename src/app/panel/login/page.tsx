import { redirect } from "next/navigation";
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
        <LoginForm />
      </div>
    </main>
  );
}