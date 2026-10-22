// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ETIQUETAS_ACCION,
  ETIQUETAS_RECURSO,
  RECURSOS_AUDITORIA,
} from "@/lib/auditoriaDatos";

type Valores = {
  q: string;
  recurso: string;
  accion: string;
  rol: string;
  usuario: string;
  dia: string;
  mes: string;
  anio: string;
};

/// Meses en español con su número, en el orden natural del calendario.
const MESES = [
  ["enero", 1], ["febrero", 2], ["marzo", 3], ["abril", 4], ["mayo", 5],
  ["junio", 6], ["julio", 7], ["agosto", 8], ["septiembre", 9],
  ["octubre", 10], ["noviembre", 11], ["diciembre", 12],
] as const;

/// Filtros del panel de auditoría. Es un formulario GET (sin JavaScript los
/// filtros siguen funcionando) pero vive en el cliente para poder desplegar
/// los usuarios del rol elegido al instante, sin esperar un recargo: al
/// cambiar el rol, el selector de usuario se rellena con las cuentas de ese
/// rol y se limpia la selección de usuario anterior.
export default function FiltrosAuditoria({
  valores,
  roles,
  usuarios,
  hayFiltro,
}: {
  valores: Valores;
  /// Nombres de rol tal como los registra la auditoría y como los tiene la
  /// tabla `roles` (los dos usan el nombre visible).
  roles: string[];
  usuarios: { id: number; nombre: string; apellido: string; rol: string }[];
  hayFiltro: boolean;
}) {
  const [rol, setRol] = useState(valores.rol);
  const [usuario, setUsuario] = useState(valores.usuario);

  const usuariosDelRol = rol
    ? usuarios.filter((u) => u.rol === rol)
    : [];

  return (
    <form
      className="filtros-auditoria"
      method="get"
      action="/panel/auditoria"
      role="search"
    >
      <label className="filtro-buscar">
        <span className="sr-only">Buscar por usuario, correo o elemento</span>
        <input
          type="search"
          name="q"
          defaultValue={valores.q}
          maxLength={100}
          placeholder="Buscar por usuario, correo o elemento…"
        />
      </label>

      <label className="filtro-seccion">
        <span className="sr-only">Filtrar por sección</span>
        <select name="recurso" defaultValue={valores.recurso}>
          <option value="">Secciones</option>
          {Object.values(RECURSOS_AUDITORIA).map((r) => (
            <option key={r} value={r}>
              {ETIQUETAS_RECURSO[r] ?? r}
            </option>
          ))}
        </select>
      </label>

      <label className="filtro-accion">
        <span className="sr-only">Filtrar por acción</span>
        <select name="accion" defaultValue={valores.accion}>
          <option value="">Acciones</option>
          {Object.entries(ETIQUETAS_ACCION).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>
      </label>

      <label className="filtro-rol">
        <span className="sr-only">Filtrar por rol</span>
        <select
          name="rol"
          value={rol}
          onChange={(e) => {
            setRol(e.target.value);
            // El usuario elegido pertenecía al rol anterior: al cambiar el rol
            // vuelve a «todos los usuarios» del rol nuevo.
            setUsuario("");
          }}
        >
          <option value="">Roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <label className="filtro-usuario">
        <span className="sr-only">Filtrar por usuario</span>
        <select
          name="usuario"
          value={usuario}
          disabled={!rol}
          onChange={(e) => setUsuario(e.target.value)}
        >
          {rol ? (
            <>
              <option value="">Usuarios</option>
              {usuariosDelRol.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido}
                </option>
              ))}
            </>
          ) : (
            <option value="">Usuarios</option>
          )}
        </select>
      </label>

      <span className="filtro-fecha">
        <span className="sr-only">Filtrar por día, mes o año</span>
        <span className="campo-diagnostico">
          <select
            name="dia"
            className="campo-dia"
            defaultValue={valores.dia}
            aria-label="Día"
          >
            <option value="">Día</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            name="mes"
            className="campo-mes"
            defaultValue={valores.mes}
            aria-label="Mes"
          >
            <option value="">Mes</option>
            {MESES.map(([nombre, numero]) => (
              <option key={numero} value={numero}>
                {nombre}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="anio"
            className="campo-anio"
            defaultValue={valores.anio}
            min={2000}
            max={2100}
            inputMode="numeric"
            placeholder="Año"
            aria-label="Año"
          />
        </span>
      </span>

      <button type="submit" className="btn-primary btn-sm">
        Aplicar
      </button>
      {hayFiltro && (
        <Link href="/panel/auditoria" className="btn-ghost-dark btn-sm">
          Limpiar
        </Link>
      )}
    </form>
  );
}
