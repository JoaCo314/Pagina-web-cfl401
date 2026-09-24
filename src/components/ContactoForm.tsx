"use client";
// Creado por sofia-athos - Formulario funcional de contacto
import { FormEvent, useState } from "react";

export default function ContactoForm() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [curso, setCurso] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEstado("enviando");
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, curso, mensaje }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "No se pudo enviar.");
        setEstado("error");
        return;
      }
      setEstado("ok");
      setNombre("");
      setEmail("");
      setCurso("");
      setMensaje("");
    } catch {
      setError("Error de red.");
      setEstado("error");
    }
  }

  if (estado === "ok") {
    return <p className="form-ok">¡Gracias! Tu consulta fue enviada. Te responderemos a la brevedad.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="guia-form" noValidate>
      <label className="form-field"><span>Nombre y Apellido *</span><input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required /></label>
      <label className="form-field"><span>Correo *</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label className="form-field"><span>Curso de interés</span><input type="text" value={curso} onChange={(e) => setCurso(e.target.value)} placeholder="Opcional" /></label>
      <label className="form-field"><span>Mensaje *</span><textarea rows={4} value={mensaje} onChange={(e) => setMensaje(e.target.value)} required /></label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn-primary btn-sm" disabled={estado === "enviando"}>{estado === "enviando" ? "Enviando…" : "Enviar consulta"}</button>
    </form>
  );
}
