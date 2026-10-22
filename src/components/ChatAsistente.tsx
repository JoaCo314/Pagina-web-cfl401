"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { MAX_PREGUNTA } from "@/lib/chat/validacion";
import { almacenHistorialChat, CLAVE_HISTORIAL_CHAT, historialChatServidor } from "@/lib/chat/historial";
import styles from "./ChatAsistente.module.css";

// Renderiza solo enlaces internos conocidos; el resto se muestra como texto.
// Las respuestas nunca se insertan como HTML.
function contenidoConEnlaces(texto: string): ReactNode[] {
  return texto.split(/(\[[^\]\n]{1,100}\]\([^\s)]+\))/g).map((parte, indice) => {
    const enlace = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(parte);
    if (enlace && /^(?:\/cursos(?:\/\d+)?|\/contacto|\/preguntas-frecuentes|\/sobre-el-centro|\/#guia)$/.test(enlace[2])) {
      return <Link key={indice} href={enlace[2]}>{enlace[1]}</Link>;
    }
    return parte;
  });
}

export default function ChatAsistente() {
  const [abierto, setAbierto] = useState(false);
  const historialGuardado = useSyncExternalStore(
    almacenHistorialChat.suscribir, almacenHistorialChat.leer, historialChatServidor,
  );
  const mensajes = historialGuardado.mensajes;
  const [consulta, setConsulta] = useState("");
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const entrada = useRef<HTMLTextAreaElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const historial = useRef<HTMLDivElement>(null);
  const solicitud = useRef<AbortController | null>(null);

  useEffect(() => {
    if (abierto) entrada.current?.focus();
  }, [abierto]);
  useEffect(() => {
    historial.current?.scrollTo({ top: historial.current.scrollHeight });
  }, [mensajes, pendiente, error, abierto]);
  useEffect(() => () => solicitud.current?.abort(), []);
  useEffect(() => {
    const sincronizar = (event: StorageEvent) => {
      if (event.key === CLAVE_HISTORIAL_CHAT || event.key === null) almacenHistorialChat.restaurar();
    };
    const revisarVencimiento = () => almacenHistorialChat.expirar();
    window.addEventListener("storage", sincronizar);
    window.addEventListener("focus", revisarVencimiento);
    return () => {
      window.removeEventListener("storage", sincronizar);
      window.removeEventListener("focus", revisarVencimiento);
    };
  }, []);
  useEffect(() => {
    if (!historialGuardado.expiraEn) return;
    const timer = window.setTimeout(() => almacenHistorialChat.expirar(),
      Math.max(0, historialGuardado.expiraEn - Date.now()));
    return () => window.clearTimeout(timer);
  }, [historialGuardado.expiraEn]);

  function cerrar() {
    setAbierto(false);
    boton.current?.focus();
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pregunta = consulta.trim();
    if (!pregunta || solicitud.current) return;
    const controller = new AbortController();
    solicitud.current = controller;
    setPendiente(pregunta);
    setError(null);
    // Hasta cuatro intercambios previos y la pregunta actual; se conservan
    // pares completos dentro del presupuesto que valida el servidor.
    const historialAlEnviar = almacenHistorialChat.leer();
    let anteriores = historialAlEnviar.mensajes.slice(-8);
    while (anteriores.reduce((total, m) => total + m.content.length, pregunta.length) > 12_000) {
      anteriores = anteriores.slice(2);
    }
    const timer = window.setTimeout(() => controller.abort(), 40_000);
    try {
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensajes: [...anteriores, { role: "user", content: pregunta }] }),
        signal: controller.signal,
      });
      const datos = await response.json();
      if (!response.ok || typeof datos.respuesta !== "string") {
        throw new Error(typeof datos.error === "string" ? datos.error : "No se pudo responder la consulta. Intentá nuevamente.");
      }
      // No revivir una conversación borrada o vencida mientras llegaba la respuesta.
      if (almacenHistorialChat.leer() !== historialAlEnviar) return;
      almacenHistorialChat.guardar([...historialAlEnviar.mensajes,
        { role: "user", content: pregunta }, { role: "assistant", content: datos.respuesta }]);
      setConsulta("");
    } catch (err) {
      setError(controller.signal.aborted
        ? "La consulta tardó más de lo esperado. Intentá nuevamente."
        : err instanceof Error ? err.message : "No se pudo conectar. Intentá nuevamente.");
    } finally {
      window.clearTimeout(timer);
      solicitud.current = null;
      setPendiente(null);
    }
  }

  return (
    <div className={styles.widget}>
      {abierto && (
        <section id="chat-cfl401" role="dialog" aria-labelledby="chat-titulo"
          aria-describedby="chat-descripcion" className={styles.panel}
          onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); cerrar(); } }}>
          <header className={styles.cabecera}>
            <div><h2 id="chat-titulo">Asistente CFL 401</h2><p>Cursos e información del centro</p></div>
            <button type="button" onClick={cerrar} className={styles.cerrar} aria-label="Cerrar chat">×</button>
          </header>
          <div className={styles.historial} ref={historial} role="log" aria-label="Conversación" aria-live="polite" aria-relevant="additions text">
            <div className={styles.respuesta}>
              <span className={styles.autor}>Asistente</span>
              ¡Hola! Te ayudo con los cursos, la inscripción y la información del CFL 401. ¿Qué te gustaría saber?
            </div>
            {mensajes.map((mensaje, indice) => (
              <div key={indice} className={mensaje.role === "user" ? styles.pregunta : styles.respuesta}>
                <span className={styles.autor}>{mensaje.role === "user" ? "Vos" : "Asistente"}</span>
                {contenidoConEnlaces(mensaje.content)}
              </div>
            ))}
            {pendiente && <><div className={styles.pregunta}><span className={styles.autor}>Vos</span>{pendiente}</div><p className={styles.estado} role="status">Consultando la información del centro…</p></>}
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <nav className={styles.atajos} aria-label="Enlaces de ayuda">
            <Link href="/cursos">Ver cursos</Link><Link href="/#guia">Cómo inscribirme</Link><Link href="/contacto">Contacto</Link>
          </nav>
          <form onSubmit={enviar} className={styles.formulario} aria-busy={pendiente !== null}>
            <label htmlFor="chat-consulta">Tu consulta</label>
            <textarea id="chat-consulta" ref={entrada} value={consulta} rows={2}
              maxLength={MAX_PREGUNTA} readOnly={pendiente !== null}
              placeholder="Por ejemplo: ¿qué cursos hay?"
              aria-describedby="chat-descripcion"
              onChange={(event) => setConsulta(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }} />
            <div className={styles.acciones}>
              <button type="button" className={styles.reiniciar} disabled={pendiente !== null || mensajes.length === 0}
                onClick={() => { almacenHistorialChat.borrar(); setError(null); setConsulta(""); entrada.current?.focus(); }}>Nueva conversación</button>
              <button type="submit" className={styles.enviar} disabled={pendiente !== null || !consulta.trim()}>{pendiente ? "Consultando…" : "Enviar"}</button>
            </div>
            <p id="chat-descripcion" className={styles.aviso}>Asistente con IA. Puede cometer errores. El historial se guarda en este navegador por 24 horas. Tu consulta se envía a OpenAI; evitá compartir datos personales.</p>
          </form>
        </section>
      )}
      <button type="button" ref={boton} className={styles.lanzador}
        aria-expanded={abierto} aria-controls="chat-cfl401" aria-haspopup="dialog"
        onClick={() => abierto ? cerrar() : setAbierto(true)}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z"/><path d="M7 10h8M7 14h5"/></svg>
        {abierto ? "Cerrar chat" : "¿Te ayudamos?"}
      </button>
    </div>
  );
}
