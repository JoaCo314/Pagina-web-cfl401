import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HtmlEnriquecido from "@/components/HtmlEnriquecido";
import { prisma } from "@/lib/prisma";
import {
  SOBRE_SELECT,
  leerGaleria,
  leerHitos,
  leerEstadisticas,
} from "@/lib/sobreElCentro";

export const metadata = {
  title: "Sobre el Centro — CFL 401 Azul",
};

export const dynamic = "force-dynamic";

export default async function SobreElCentroPage() {
  const sobre = await prisma.sobreElCentro.findFirst({
    where: { activo: true },
    select: SOBRE_SELECT,
    orderBy: { id: "asc" },
  });

  const hitos = leerHitos(sobre?.hitos ?? null);
  const estadisticas = leerEstadisticas(sobre?.estadisticas ?? null);
  const galeria = leerGaleria(sobre?.galeria ?? null);

  const hayMision = Boolean(sobre?.misionTexto);
  const hayHistoria = Boolean(sobre?.historiaTexto || hitos);
  const hayEstadisticas = Boolean(estadisticas);
  const hayGaleria = Boolean(galeria);
  const vacio =
    !sobre || (!hayMision && !hayHistoria && !hayEstadisticas && !hayGaleria);

  return (
    <>
      <SiteHeader active="sobre" />

      <div className="page-header" id="contenido" tabIndex={-1}>
        <div className="wrap">
          <h1>Sobre el Centro</h1>
          {sobre?.intro ? (
            <HtmlEnriquecido
              html={sobre.introHtml}
              textoPlano={sobre.intro}
              className="page-intro-enriquecido"
            />
          ) : null}
        </div>
      </div>

      {vacio ? (
        <section className="sobre-section sobre-section-vacio">
          <div className="wrap">
            <div className="section-head">
              <h2>Esta sección se está armando</h2>
              <p>
                Pronto vas a encontrar acá la historia, la misión y las fotos
                del Centro de Formación Laboral 401. Mientras tanto, te
                invitamos a recorrer la oferta de cursos.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          {hayMision && (
            <section className="sobre-section sobre-mision" id="mision">
              <div className="wrap">
                {sobre?.misionTitulo ? (
                  <div className="section-head">
                    <h2>{sobre.misionTitulo}</h2>
                  </div>
                ) : null}
                <HtmlEnriquecido
                  html={sobre?.misionTextoHtml}
                  textoPlano={sobre?.misionTexto}
                  className="sobre-mision-texto"
                />
              </div>
            </section>
          )}

          {hayHistoria && (
            <section className="sobre-section sobre-historia" id="historia">
              <div className="wrap">
                {sobre?.historiaTitulo ? (
                  <div className="section-head">
                    <h2>{sobre.historiaTitulo}</h2>
                  </div>
                ) : null}
                {sobre?.historiaTexto ? (
                  <HtmlEnriquecido
                    html={sobre?.historiaTextoHtml}
                    textoPlano={sobre?.historiaTexto}
                    className="sobre-historia-texto"
                  />
                ) : null}
                {hitos ? (
                  <ol className="timeline">
                    {hitos.map((hito, i) => (
                      <li key={i} className="timeline-item">
                        {hito.anio && (
                          <span className="timeline-anio">{hito.anio}</span>
                        )}
                        <div className="timeline-body">
                          <h3>{hito.titulo}</h3>
                          <p>{hito.texto}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            </section>
          )}

          {hayEstadisticas && (
            <section className="sobre-section sobre-estadisticas" id="datos">
              <div className="wrap">
                {sobre?.estadisticasTitulo ? (
                  <div className="section-head">
                    <h2>{sobre.estadisticasTitulo}</h2>
                  </div>
                ) : null}
                <div className="stats-grid">
                  {estadisticas!.map((stat, i) => (
                    <div key={i} className="stat-card">
                      <strong>{stat.valor}</strong>
                      <span>{stat.etiqueta}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {hayGaleria && (
            <section className="sobre-section sobre-galeria" id="galeria">
              <div className="wrap">
                {sobre?.galeriaTitulo ? (
                  <div className="section-head">
                    <h2>{sobre.galeriaTitulo}</h2>
                  </div>
                ) : null}
                <div className="galeria-grid">
                  {galeria!.map((foto, i) => (
                    <figure key={i} className="galeria-item">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={foto.url}
                        alt={foto.leyenda || "Foto histórica del CFL 401"}
                        loading="lazy"
                      />
                      {foto.leyenda ? (
                        <figcaption>{foto.leyenda}</figcaption>
                      ) : null}
                    </figure>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <SiteFooter />
    </>
  );
}