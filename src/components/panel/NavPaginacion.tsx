import Link from "next/link";

/// Navegación de páginas para los listados del panel. En el primer/último
/// límite el enlace queda `aria-disabled` (sin interacción ni salto de layout)
/// en vez de ocultarse, para no perder la posición del foco y del teclado.
export default function NavPaginacion({
  pagina,
  totalPaginas,
  construirHref,
  etiqueta = "Paginación",
}: {
  pagina: number;
  totalPaginas: number;
  construirHref: (pagina: number) => string;
  etiqueta?: string;
}) {
  if (totalPaginas <= 1) return null;

  const anterior = construirHref(Math.max(1, pagina - 1));
  const siguiente = construirHref(Math.min(totalPaginas, pagina + 1));

  return (
    <nav className="paginacion" aria-label={etiqueta}>
      <Link
        href={anterior}
        className="btn-sm btn-ghost-dark"
        aria-disabled={pagina <= 1}
        aria-label="Página anterior"
      >
        ← Anterior
      </Link>
      <span className="paginacion-info" aria-current="page">
        Página {pagina} de {totalPaginas}
      </span>
      <Link
        href={siguiente}
        className="btn-sm btn-ghost-dark"
        aria-disabled={pagina >= totalPaginas}
        aria-label="Página siguiente"
      >
        Siguiente →
      </Link>
    </nav>
  );
}