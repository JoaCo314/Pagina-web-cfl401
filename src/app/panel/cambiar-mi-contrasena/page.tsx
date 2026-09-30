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
        <div className="auth-logo">
          <span className="auth-logo-dot"></span>
          Panel Administrativo
        </div>
        <h1>Cambiá tu contraseña</h1>
        <p className="auth-sub">
          Tu contraseña fue blanqueada por un administrador, así que es temporal.
          Definí una contraseña propia para poder usar el panel.
        </p>
        <CambiarMiContrasena nombre={user.nombre} />
        <Link href="/" className="auth-back">
          <span aria-hidden="true">←</span> Volver al sitio público
        </Link>
      </div>
    </main>
  );
}