import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteHeader />

      <div className="page-header" id="contenido" tabIndex={-1}>
        <div className="wrap">
          <div className="not-found">
            <h1 className="not-found-codigo">404</h1>
            <h2 className="not-found-titulo">La página no existe</h2>
            <p className="not-found-texto">
              La página que buscás fue movida o no existe. Probá volver al
              inicio o explorá nuestros cursos.
            </p>
            <div className="not-found-acciones">
              <Link href="/" className="btn-primary">
                Volver al inicio
              </Link>
              <Link href="/cursos" className="btn-ghost-dark">
                Ver cursos
              </Link>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </>
  );
}