/// Skeleton de las páginas del panel mientras resuelven sus datos en el
/// servidor. Sin esto, cada navegación dentro del panel mostraba una página en
/// blanco durante un corto lapso.
export default function PanelLoading() {
  return (
    <div className="panel">
      <main className="wrap panel-main" aria-busy="true">
        <div className="panel-head">
          <div>
            <div className="skeleton skeleton-titulo" aria-hidden="true" />
          </div>
        </div>
        <div className="panel-card">
          <div className="skeleton skeleton-linea" aria-hidden="true" />
          <div className="skeleton skeleton-linea media" aria-hidden="true" />
          <div className="skeleton skeleton-linea corta" aria-hidden="true" />
        </div>
        <p className="sr-only" role="status">
          Cargando…
        </p>
      </main>
    </div>
  );
}