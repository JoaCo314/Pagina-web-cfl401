# QA — Sección de Noticias (pública + panel) y tablero del panel con accesos directos

Fecha: 2026-09-17 · Branch `Joaquin`

## Objetivo

Incorporar una sección de **Noticias** con página pública `/noticias` (tarjetas
apiladas, sin filtros) y su edición desde el panel. Además, que los bloques del
tablero del panel (cursos, usuarios y guía) linkeen a sus secciones de edición.

## Alcance funcional

- Página pública `/noticias` con listado de noticias publicadas, de la más
  reciente a la más antigua. Cada tarjeta muestra fecha, título, resumen, imagen
  (opcional) y el link "Leer nota completa".
- Página de detalle `/noticias/[id]` con la nota completa (título, resumen,
  imagen y cuerpo en párrafos).
- Bloque "Últimas noticias" en la home con las **3 más recientes**; si no hay
  noticias publicadas el bloque no se muestra.
- Navbar y footer "Noticias" apuntan a `/noticias` (antes `#`).
- Panel `/panel/noticias`: listado (activas e inactivas), alta, edición y baja.
- Permisos: **Administrador y Preceptor** tienen CRUD completo. El Docente no ve
  la sección ni puede operar sobre noticias.
- Los bloques del tablero (Cursos, Usuarios, Guía, Noticias) son links a su
  sección; en el caso del Preceptor, "Usuarios" apunta al alta de docentes.

## Cambios

- **Esquema**: modelo `Noticia` (`titulo`, `resumen?`, `contenido`, `fecha`,
  `imagenUrl?`, `activo`) mapeado a `noticias`. Migración
  `20260917163954_agregar_noticias`.
- **Permisos** (`src/lib/auth/autorizacion.ts`): `NOTICIAS_CREAR`,
  `NOTICIAS_EDITAR`, `NOTICIAS_ELIMINAR` para Administrador y Preceptor; nueva
  sección `noticias` en `obtenerSeccionesPanel`.
- **Validación** (`src/lib/noticiaAdmin.ts`): `titulo` obligatorio (≤200),
  `contenido` obligatorio (≤20000), `resumen` (≤300), `fecha` obligatoria válida,
  `imagenUrl` opcional como URL absoluta `http(s)://`. `NOTICIA_SELECT` centraliza
  los campos devueltos.
- **API**:
  - `GET /api/noticias` (público): solo activas, orden `fecha desc, createdAt
    desc`, opcional `?limit=N`.
  - `GET /api/noticias/[id]` (público): 404 si no existe o está inactiva.
  - `POST` / `PUT` / `DELETE` protegidos por los permisos de noticias; los campos
    no enviados en `PUT` conservan su valor.
- **Panel**: `NoticiaForm` (título, fecha, imagen opcional, resumen, contenido y
  toggle "publicada"), `EliminarNoticia` con confirmación, y páginas
  `/panel/noticias`, `/panel/noticias/nuevo`, `/panel/noticias/[id]/editar`.
  `PUT`/`POST` validan también en el cliente.
- **Público**: `NoticiasList`, `NoticiaDetail` y `NoticiasHome` (clientes que
  consumen la API en caliente), `NoticiaCard`, helpers en `src/lib/noticiaUtils.ts`
  (`formatearFechaLarga` con `timeZone: "UTC"`, `dividirParrafos` por renglón en
  blanco). El cuerpo respeta párrafos y saltos de línea (`white-space: pre-line`).
- **Tablero del panel** (`src/app/panel/page.tsx`): los bloques de cursos,
  usuarios, guía y noticias ahora son `<Link>` (clase `panel-card-link`) a su
  sección de edición.
- **Seed**: 4 noticias de ejemplo alineadas con la maqueta; `upsertNoticia`
  idempotente por título.

## Verificación (E2E con Edge headless vía CDP)

Sesiones de Administrador, Docente y Preceptor, operando contra las mismas APIs
que el panel y las páginas públicas:

| # | Chequeo | Resultado |
| - | ------- | --------- |
| 1 | Login admin | 200 |
| 2 | Tablero: links a `/panel/cursos`, `/panel/usuarios`, `/panel/guia`, `/panel/noticias` | true |
| 3 | `/panel/noticias` lista las noticias del seed | true |
| 4 | `POST` sin título / sin fecha / con imagen inválida | 400 / 400 / 400 |
| 5 | Alta de noticia | 201 |
| 6 | Persistencia de título, resumen, imagen, fecha y activo | true |
| 7 | Detalle público: título, bajada, 2 párrafos, imagen, "volver a /noticias" | true |
| 8 | `/noticias` muestra el encabezado y 5 tarjetas (4 del seed + la nueva) | true |
| 9 | Home: "Últimas noticias" con 3 tarjetas, CTA a `/noticias`, nav y footer con `/noticias` | true |
| 10 | Despublicar: `PUT activo:false` → `GET` público 404 y fuera del listado | true |
| 11 | Editar título/contenido y republicar; resumen no enviado se preserva | true |
| 12 | Login docente | 200 |
| 13 | Docente: `/panel/noticias` redirige a `/panel`; `POST` → 403 | true |
| 14 | Login preceptor | 200 |
| 15 | Preceptor: bloque "Noticias" en el tablero, alta 201 y edición 200 | true |
| 16 | Baja de la noticia del preceptor | 200 |
| 17 | Baja de la noticia del admin | 200 |
| 18 | Total público restaurado | 4 |

`tsc --noEmit` y `eslint` sin errores. Base final: 4 noticias del seed (ninguna
inactiva), sin registros de prueba.
