import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NoticiasList from "@/components/NoticiasList";

export const metadata = {
  title: "Noticias y Novedades",
  description:
    "Convocatorias, aperturas de inscripciones y actividades institucionales del CFL 401 Azul.",
};

export default function NoticiasPage() {
  return (
    <>
      <SiteHeader active="noticias" />

      <div className="page-header" id="contenido" tabIndex={-1}>
        <div className="wrap">
          <h1>Noticias y Novedades</h1>
          <p>
            Mantenete al tanto de convocatorias, aperturas de inscripciones y
            actividades institucionales.
          </p>
        </div>
      </div>

      <NoticiasList />

      <SiteFooter />
    </>
  );
}
