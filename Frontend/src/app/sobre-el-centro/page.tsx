"use client";

import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

type Hito = { anio?: string; titulo: string; texto: string };
type Estadistica = { valor: string; etiqueta: string };
type Foto = { url: string; leyenda?: string };
type Sobre = { intro?: string; misionTitulo?: string; misionTexto?: string; historiaTitulo?: string; historiaTexto?: string; hitos?: Hito[]; estadisticasTitulo?: string; estadisticas?: Estadistica[]; galeriaTitulo?: string; galeria?: Foto[] };

export default function SobreElCentroPage() {
  const [sobre, setSobre] = useState<Sobre | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    fetch("/api/sobre-el-centro")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setSobre(data.sobre ?? null))
      .catch(() => setSobre(null))
      .finally(() => setCargado(true));
  }, []);

  const hitos = sobre?.hitos ?? [];
  const estadisticas = sobre?.estadisticas ?? [];
  const galeria = sobre?.galeria ?? [];
  const vacio = !sobre || (!sobre.misionTexto && !sobre.historiaTexto && !hitos.length && !estadisticas.length && !galeria.length);

  return <>
    <SiteHeader active="sobre" />
    <div className="page-header" id="contenido" tabIndex={-1}><div className="wrap"><h1>Sobre el Centro</h1>{sobre?.intro && <p>{sobre.intro}</p>}</div></div>
    {!cargado ? <p className="courses-empty">Cargando información…</p> : vacio ? <section className="sobre-section sobre-section-vacio"><div className="wrap"><div className="section-head"><h2>Esta sección se está armando</h2><p>Pronto vas a encontrar acá la historia, la misión y las fotos del Centro de Formación Laboral 401.</p></div></div></section> : <>
      {sobre?.misionTexto && <section className="sobre-section sobre-mision"><div className="wrap">{sobre.misionTitulo && <div className="section-head"><h2>{sobre.misionTitulo}</h2></div>}<div className="sobre-mision-texto">{sobre.misionTexto}</div></div></section>}
      {(sobre?.historiaTexto || hitos.length > 0) && <section className="sobre-section sobre-historia"><div className="wrap">{sobre?.historiaTitulo && <div className="section-head"><h2>{sobre.historiaTitulo}</h2></div>}{sobre?.historiaTexto && <div className="sobre-historia-texto">{sobre.historiaTexto}</div>}{hitos.length > 0 && <ol className="timeline">{hitos.map((hito, i) => <li key={i} className="timeline-item">{hito.anio && <span className="timeline-anio">{hito.anio}</span>}<div className="timeline-body"><h3>{hito.titulo}</h3><p>{hito.texto}</p></div></li>)}</ol>}</div></section>}
      {estadisticas.length > 0 && <section className="sobre-section sobre-estadisticas"><div className="wrap">{sobre?.estadisticasTitulo && <div className="section-head"><h2>{sobre.estadisticasTitulo}</h2></div>}<div className="stats-grid">{estadisticas.map((stat, i) => <div key={i} className="stat-card"><strong>{stat.valor}</strong><span>{stat.etiqueta}</span></div>)}</div></div></section>}
      {galeria.length > 0 && <section className="sobre-section sobre-galeria"><div className="wrap">{sobre?.galeriaTitulo && <div className="section-head"><h2>{sobre.galeriaTitulo}</h2></div>}<div className="galeria-grid">{galeria.map((foto, i) => <figure key={i} className="galeria-item"><img src={foto.url} alt={foto.leyenda || "Foto histórica del CFL 401"} loading="lazy" />{foto.leyenda && <figcaption>{foto.leyenda}</figcaption>}</figure>)}</div></div></section>}
    </>}
    <SiteFooter />
  </>;
}
