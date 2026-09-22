"use client";

import { useEffect, useState } from "react";

type DocenteBasico = { id: number; nombre: string; apellido: string };

type Curso = {
  id: number;
  nombre: string;
  categoria: string | null;
  modalidad: string | null;
  horarios: string | null;
  docentes: { docente: DocenteBasico }[];
};

export default function CursosList() {
  const [cursos, setCursos] = useState<Curso[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cursos")
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))
      )
      .then((data) => setCursos(data.cursos as Curso[]))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error desconocido")
      );
  }, []);

  if (error) {
    return (
      <p className="text-red-600 text-sm">Error al cargar cursos: {error}</p>
    );
  }

  if (cursos === null) {
    return <p className="text-gray-500 text-sm">Cargando cursos…</p>;
  }

  if (cursos.length === 0) {
    return <p className="text-gray-500 text-sm">No hay cursos cargados.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {cursos.map((c) => (
        <li key={c.id} className="border rounded p-2">
          <p className="font-medium">{c.nombre}</p>
          <p className="text-gray-500">
            {c.categoria} · {c.modalidad} · {c.horarios}
          </p>
          <p className="text-gray-400 text-xs">
            Docentes:{" "}
            {c.docentes
              .map((d) => `${d.docente.nombre} ${d.docente.apellido}`)
              .join(", ") || "—"}
          </p>
        </li>
      ))}
    </ul>
  );
}
