// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
"use client";

import { useState } from "react";
import Link from "next/link";
import { fetchConTimeout } from "@/lib/fetchTimeout";

export type NotificacionVista = {
  id: number;
  tipo: string;
  mensaje: string;
  url: string | null;
  leida: boolean;
  createdAt: string;
};

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

/// Anuncia a la campana (y a quien escuche) que cambió la cantidad de no leídas,
/// para que el contador de la cabecera se actualice sin recargar la página.
function anunciarCambio(sinLeer: number) {
  window.dispatchEvent(
    new CustomEvent("notificaciones:cambio", { detail: { sinLeer } })
  );
}

export default function NotificacionesLista({
  inicial,
}: {
  inicial: NotificacionVista[];
}) {
  const [items, setItems] = useState(inicial);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const sinLeer = items.filter((n) => !n.leida).length;

  async function marcar(todas: boolean, id?: number) {
    setError(null);
    setOcupado(true);
    try {
      const res = await fetchConTimeout("/api/notificaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todas ? { todas: true } : { id }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "No se pudo actualizar la notificación.");
        return;
      }
      const data = (await res.json()) as { sinLeer: number };
      setItems((prev) =>
        prev.map((n) => (todas || n.id === id ? { ...n, leida: true } : n))
      );
      anunciarCambio(data.sinLeer);
    } catch {
      setError("No se pudo actualizar la notificación. Revisá tu conexión.");
    } finally {
      setOcupado(false);
    }
  }

  if (items.length === 0) {
    return (
      <p className="panel-vacio">No tenés notificaciones por ahora.</p>
    );
  }

  return (
    <>
      <div className="notif-cabecera">
        <p className="notif-resumen">
          {sinLeer > 0
            ? `Tenés ${sinLeer} sin leer.`
            : "No tenés notificaciones sin leer."}
        </p>
        {sinLeer > 0 && (
          <button
            type="button"
            className="btn-ghost-dark btn-sm"
            onClick={() => marcar(true)}
            disabled={ocupado}
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      <p className="form-error" role="alert" aria-live="assertive">
        {error ?? ""}
      </p>

      <ul className="notif-lista">
        {items.map((n) => (
          <li
            key={n.id}
            className={`notif-item${n.leida ? "" : " no-leida"}`}
          >
            <div className="notif-cuerpo">
              {!n.leida && <span className="notif-punto" aria-label="Sin leer" />}
              <div>
                <p className="notif-mensaje">
                  {n.url ? (
                    <Link href={n.url} className="notif-link">
                      {n.mensaje}
                    </Link>
                  ) : (
                    n.mensaje
                  )}
                </p>
                <time
                  className="notif-fecha"
                  dateTime={n.createdAt}
                >
                  {formatoFecha.format(new Date(n.createdAt))}
                </time>
              </div>
            </div>
            {!n.leida && (
              <button
                type="button"
                className="link-accion"
                onClick={() => marcar(false, n.id)}
                disabled={ocupado}
              >
                Marcar como leída
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
