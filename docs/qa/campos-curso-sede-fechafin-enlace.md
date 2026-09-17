# QA — Nuevos campos de curso: sede, fin de cursada y link de inscripción IPFL

Fecha: 2026-09-17 · Branch `Joaquin`

## Objetivo

Incorporar a los cursos tres campos nuevos: **sede** (lugar donde se dicta),
**fecha de fin de cursada** y **link de inscripción en el IPFL**. Las
inscripciones no se gestionan en el sitio: el botón "Inscribirme" del curso
redirige a la página del IPFL. Si el curso no tiene link cargado, el botón no se
muestra.

## Cambios

- **Esquema**: `Curso.sede String?`, `Curso.fechaFin DateTime?`,
  `Curso.enlaceInscripcion String?`. Migración
  `20260917154439_agregar_sede_fechafin_enlace`.
- **Validación** (`src/lib/cursoAdmin.ts`): `sede` como texto (≤1000); `fechaFin`
  como fecha válida; `enlaceInscripcion` como URL absoluta `http(s)://` (cadena
  vacía = sin link). `CURSO_SELECT` incluye los tres campos.
- **API**: `GET /api/cursos` devuelve `sede`; `GET /api/cursos/[id]` devuelve
  además `fechaFin` y `enlaceInscripcion`. `POST`/`PUT` validan y persisten los
  tres campos.
- **Panel** (`CursoForm`): campos "Sede", "Fecha de fin de cursada" y "Link de
  inscripción en el IPFL (opcional)", con validación en el cliente.
- **Sitio público**:
  - Catálogo: la tarjeta muestra `Sede: …` cuando está cargada.
  - Detalle: "Datos del curso" agrega **Sede** y **Fin de cursada**.
  - CTA "Inscribirme": link externo al IPFL (`target="_blank"`,
    `rel="noopener noreferrer"`), visible solo si el curso tiene
    `enlaceInscripcion`.
  - Header: el botón genérico "Inscribirme" (antes `href="#"`) ahora lleva al
    catálogo `/cursos`.
- **Fix de fechas**: `formatearFecha` formatea en `timeZone: "UTC"`. Antes, con el
  servidor en UTC y el navegador en Argentina (UTC-3), las fechas guardadas a
  medianoche UTC se mostraban un día antes (el 20/12 se veía 19/12). Afectaba
  tanto a `fechaInicio` como al nuevo `fechaFin`.

## Verificación (E2E con Edge headless vía CDP)

Sesión de administrador y operaciones usando las mismas APIs que el panel:

| # | Chequeo | Resultado |
| - | ------- | --------- |
| 1 | Login admin | 200 |
| 2 | El formulario del panel renderiza Sede / Fin / Link IPFL | true |
| 3 | Catálogo inicial | total 5 |
| 4 | `POST` con enlace inválido (sin `http(s)://`) | 400 con mensaje |
| 5 | `POST` con `fechaFin` inválida | 400 con mensaje |
| 6 | Alta con los 3 campos | 201 |
| 7 | Persistencia de sede/fechaFin/enlace | true |
| 8 | Catálogo público muestra la sede | true |
| 9 | Detalle: sede, "Fin de cursada" = 20/12/2026 y CTA `href` al IPFL con `target="_blank"` | true |
| 10 | `PUT` vaciando el link | 200, `enlaceInscripcion: null` |
| 11 | Sin link: botón "Inscribirme" oculto; sede y fin siguen visibles | true |
| 12 | Curso del seed: "Inicio" = 02/03/2026 (sin corrimiento por zona horaria) | true |
| 13 | Baja del curso QA | 200 |
| 14 | Total del catálogo restaurado | 5 |

`tsc --noEmit` y `eslint` sin errores. Base final: 5 cursos (4 del seed + residuo
previo id 12), sin registros de prueba, con los campos nuevos en `NULL`.
