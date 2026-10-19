// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { redirect } from "next/navigation";
import { exigirContrasenaActualizada, getCurrentUser } from "@/lib/auth/session";
import { obtenerSeccionesPanel } from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import PanelShell from "@/components/auth/PanelShell";
import NotificacionesLista, {
  type NotificacionVista,
} from "@/components/panel/NotificacionesLista";

export const dynamic = "force-dynamic";

export const metadata = { title: "Notificaciones" };

/// Bandeja de avisos internos de la cuenta en sesión. El `usuarioId` sale de la
/// sesión (nunca de la URL), así cada persona ve solo lo suyo.
export default async function NotificacionesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }

  exigirContrasenaActualizada(user);

  const filas = await prisma.notificacion.findMany({
    where: { usuarioId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      tipo: true,
      mensaje: true,
      url: true,
      leida: true,
      createdAt: true,
    },
  });

  const inicial: NotificacionVista[] = filas.map((n) => ({
    id: n.id,
    tipo: n.tipo,
    mensaje: n.mensaje,
    url: n.url,
    leida: n.leida,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <PanelShell user={user} secciones={obtenerSeccionesPanel(user)}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Notificaciones</h1>
          <p className="panel-lead">
            Avisos internos de tu cuenta, por ejemplo cuando te asignan a un
            curso. Marcálos como leídos para dejar la bandeja al día.
          </p>
        </div>
      </div>

      <NotificacionesLista inicial={inicial} />
    </PanelShell>
  );
}
