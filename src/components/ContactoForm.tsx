"use client";
// Creado por sofia-athos - Formulario funcional de contacto
import { FormEvent, useState } from "react";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

export default function ContactoForm() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [curso, setCurso] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEstado("enviando");
    try {
      const res = await fetchConTimeout("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // `sitio-web` es un honeypot: está oculto y nobody lo completa a mano.
        body: JSON.stringify({ nombre, email, celular, curso, mensaje, "sitio-web": "" }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        mensaje?: string;
      } | null;
      if (!res.ok) {
        setError(data?.error ?? "No se pudo enviar la consulta.");
        setEstado("error");
        return;
      }
      setEstado("ok");
      setNombre("");
      setEmail("");
      setCelular("");
      setCurso("");
      setMensaje("");
    } catch (err) {
      setError(
        err instanceof TimeoutError
          ? "El servidor tardó demasiado. Intentá nuevamente."
          : "No se pudo enviar la consulta. Revisá tu conexión e intentá nuevamente."
      );
      setEstado("error");
    }
  }

  if (estado === "ok") {
    return (
      <div className="form-ok" role="status">
        <p>¡Gracias! Tu consulta fue enviada. Te responderemos a la brevedad.</p>
        <p className="form-note">
          La respuesta llega al correo que dejaste cargado. Si en un par de días
          no tenés novedades, escribinos de nuevo.
        </p>
        <button
          type="button"
          className="btn-ghost-dark btn-sm"
          onClick={() => setEstado("idle")}
        >
          Enviar otra consulta
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="guia-form" noValidate>
      <label className="form-field">
        <span>Nombre y Apellido *</span>
        <input
          type="text"
          name="nombre"
          required
          maxLength={120}
          autoComplete="name"
          placeholder="Ej.: Ana Gómez"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </label>
      <label className="form-field">
        <span>Correo *</span>
        <input
          type="email"
          name="email"
          required
          maxLength={200}
          autoComplete="email"
          placeholder="Tu correo, no el del centro"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <small className="form-hint">
          Escribí tu correo: nuestra respuesta se envía a la bandeja de entrada
          de esa cuenta.
        </small>
      </label>
      <label className="form-field">
        <span>Celular (opcional)</span>
        <input
          type="tel"
          name="celular"
          maxLength={60}
          autoComplete="tel"
          placeholder="Ej.: +54 9 2281 55-1234"
          value={celular}
          onChange={(e) => setCelular(e.target.value)}
        />
        <small className="form-hint">
          Si preferís, podemos responderte por WhatsApp a este número.
        </small>
      </label>
      <label className="form-field">
        <span>Curso de interés (opcional)</span>
        <input
          type="text"
          name="curso"
          maxLength={120}
          placeholder="Ej.: Panadería"
          value={curso}
          onChange={(e) => setCurso(e.target.value)}
        />
      </label>
      <label className="form-field">
        <span>Mensaje *</span>
        <textarea
          name="mensaje"
          rows={4}
          required
          maxLength={2000}
          placeholder="Contanos qué necesitás: inscripción, consulta sobre un curso, un problema con la web…"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
        />
      </label>
      {/* Honeypot: invisible para personas, tentador para bots. */}
      <div className="sr-only" aria-hidden="true">
        <label>
          No completes este campo
          <input type="text" name="sitio-web" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p className="form-error" role="alert" aria-live="assertive">
        {error ?? ""}
      </p>
      <button type="submit" className="btn-primary btn-sm" disabled={estado === "enviando"}>
        {estado === "enviando" ? "Enviando…" : "Enviar consulta"}
      </button>
    </form>
  );
}