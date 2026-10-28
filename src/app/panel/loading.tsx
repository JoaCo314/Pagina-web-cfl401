/// Skeleton de las páginas del panel mientras resuelven sus datos en el servidor.
/// Al estar dentro del layout persistente con PanelShell, la barra lateral permanece
/// siempre montada y sin parpadeos mientras el contenido interior se actualiza.
export default function PanelLoading() {
  return (
    <div aria-busy="true">
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
    </div>
  );
}
