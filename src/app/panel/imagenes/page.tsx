import { redirect } from "next/navigation";
import { exigirContrasenaActualizada, getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, obtenerSeccionesPanel, tienePermiso } from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import { urlImagenInterna } from "@/lib/imagenes";
import PanelShell from "@/components/auth/PanelShell";
import ListaImagenes, {
  type ImagenItem,
} from "@/components/panel/ListaImagenes";

export const dynamic = "force-dynamic";

export default async function ImagenesPanelPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }

  exigirContrasenaActualizada(user);
  const puedeAdministrar =
    tienePermiso(user, PERMISOS.CURSOS_CREAR) ||
    tienePermiso(user, PERMISOS.NOTICIAS_CREAR);
  if (!puedeAdministrar) {
    redirect("/panel");
  }

  const filas = await prisma.imagen.findMany({
    select: {
      id: true,
      nombre: true,
      mimeType: true,
      tamano: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  const imagenes: ImagenItem[] = filas.map((fila) => ({
    ...fila,
    createdAt: fila.createdAt.toISOString(),
    url: urlImagenInterna(fila.id),
  }));
  const secciones = obtenerSeccionesPanel(user);

  return (
    <PanelShell user={user} secciones={secciones}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Imágenes</h1>
          <p className="panel-lead">
            Todas las imágenes subidas desde el panel. Las que ya no se usan
            (por ejemplo, tras cancelar un formulario) se pueden eliminar acá.
          </p>
        </div>
      </div>

      <ListaImagenes inicial={imagenes} />
    </PanelShell>
  );
}