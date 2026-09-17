# QA — Consistencia de datos panel ↔ público (Tarea #28, RNF-06)

Fecha: 2026-09-17 · Branch `Joaquin`

## Alcance

Verificación end-to-end de que los cambios realizados desde el panel
administrativo (cursos y guía de inscripción) se reflejan **al instante** en el
sitio público. Las páginas públicas son componentes cliente que consultan las
APIs públicas en cada montaje (`CourseCatalog` → `GET /api/cursos?groupBy=…`,
`CourseDetail` → `GET /api/cursos/[id]`, `GuiaInscripcion` → `GET
/api/guia-inscripcion`), por lo que la verificación se hizo sobre el render real
en navegador (Microsoft Edge headless vía CDP) tras cada operación del panel.

## Metodología

- Sesión de administrador creada por CDP (`POST /api/auth/login` → 200).
- Operaciones "de panel" ejecutadas con las mismas rutas que usan los
  formularios del panel:
  - Alta: `POST /api/cursos` (CursoForm)
  - Edición: `PUT /api/cursos/[id]` (CursoForm) y `PUT /api/guia-inscripcion`
    (GuiaForm)
  - Baja: `DELETE /api/cursos/[id]` (EliminarCurso)
- Verificación pública: navegación real a `/`, `/cursos` y `/cursos/[id]` (con
  espera del fetch en montaje) y chequeo del `innerText` / `h1` del DOM, además
  del estado de las APIs públicas y la base de datos.

## Resultados

### Escenario 1 — Edición de curso → catálogo y detalle público

| Paso | Resultado |
| ---- | --------- |
| Alta de curso "QA28 Curso Temp" desde el panel | `201` (curso id creado) |
| Catálogo público muestra el curso nuevo | `true` |
| Edición desde el panel (nombre → "QA28 Curso Editado", modalidad → Virtual, nueva descripción y fecha) | `200` |
| Catálogo público refleja la edición (nombre nuevo visible, nombre viejo ausente) | `true` |
| Detalle público refleja la edición (h1 = nombre nuevo, descripción y modalidad editadas) | `true` |

### Escenario 2 — Edición de guía → home pública

| Paso | Resultado |
| ---- | --------- |
| Guía pública inicial | 4 bloques (pasos, documentacion, requisitos, informacion_adicional) |
| Edición desde el panel (título del bloque "pasos" + línea marcador añadida) | `200`, 4 bloques persistidos |
| Home pública muestra la guía editada (marcador y título nuevos visibles) | `true` |
| Restauración de la guía al contenido original | `200` |
| Guía pública de vuelta al seed (comparación título+contenido de los 4 bloques) | `true` |

### Escenario 3 — Eliminación de curso → desaparece del catálogo

| Paso | Resultado |
| ---- | --------- |
| Baja del curso desde el panel (`DELETE`) | `200`, `eliminado: true` |
| Catálogo público ya no muestra el curso (y los demás siguen visibles) | `true` |
| Total del catálogo publico restaurado | 5 (igual al inicial) |
| `GET /api/cursos/[id]` del curso eliminado | `404` |

## Estado final de la base

- Cursos: los 5 originales (4 del seed + residuo previo id 12, ajeno a este QA);
  sin cursos QA residuales.
- Guía: exactamente el seed (pasos 320, documentacion 295, requisitos 287,
  informacion_adicional 305).

## Conclusión

Criterio de aceptación cumplido: los 3 escenarios muestran consistencia inmediata
entre lo cargado en el panel (alta/edición/baja) y lo visible en el sitio
público, sin necesidad de reinicios ni "deploy".