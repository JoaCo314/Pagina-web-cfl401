# QA — Responsive del panel administrativo (Tarea #26, RNF-02)

Fecha: 2026-09-17 · Branch `Joaquin`

## Alcance

Verificación y ajuste responsive de las pantallas del panel:

- **Login** (`/panel/login`, `auth-card`)
- **Listados**: cursos (`/panel/cursos`), usuarios (`/panel/usuarios`) e inicio del
  panel (`/panel`, cards y `panel-lista`)
- **Formularios**: alta/edición de curso (`/panel/cursos/nuevo` y `/editar`),
  alta de usuario (`/panel/usuarios/nuevo`) y edición de la guía
  (`/panel/guia`)

## Ajustes aplicados en `src/app/globals.css`

- **Login**: padding del card y de la página reducido en celulares (≤680px).
- **Listados**: en ≤680px las tablas del panel pasan de tabla a **tarjetas
  apiladas** (thead oculto; cada celda con su etiqueta vía `data-label` +
  `::before`; acciones por fila conservadas). El `thead` se mantiene en tablet y
  desktop.
- **Formularios**: a 1 columna (ya existía ≤900px); en ≤680px se compacta el
  padding del form y los botones de acción pasan a ancho completo, apilados.
- **Shell**: en ≤900px se oculta el nombre/rol del usuario (queda el botón
  "Cerrar sesión"); el nav del panel scrollea horizontalmente dentro de su
  propio contenedor (`overflow-x: auto`) sin generar scroll de página; `panel-main`
  y `panel-head` compactados para celular.

## Metodología

Pruebas con navegador real (Microsoft Edge headless vía CDP): login como
administrador con `fetch` same-origin y luego medición por combinación de:

- `documentElement.scrollWidth` vs `clientWidth` → **scroll horizontal**.
- Recorrido de elementos con `getBoundingClientRect()` (excluyendo ancestros con
  `overflow` propio) → **elementos fuera del viewport / superpuestos**.
- Estado de `.panel-table thead` (oculto → cards; visible → tabla) y apilamiento
  vertical de las celdas (top creciente entre celdas de una misma fila).

## Resultados

### Scroll horizontal / desbordes (7 rutas × 3 tamaños)

| Pantalla | Móvil 390×844 | Tablet 768×1024 | Desktop 1366×768 |
| -------- | ------------- | --------------- | ---------------- |
| Login    | OK            | OK              | OK               |
| Inicio   | OK            | OK              | OK               |
| Cursos   | OK            | OK              | OK               |
| Usuarios | OK            | OK              | OK               |
| Nuevo curso | OK         | OK              | OK               |
| Nuevo usuario | OK       | OK              | OK               |
| Guía     | OK            | OK              | OK               |

En todas las combinaciones `scrollWidth === clientWidth` y cero elementos fuera
del viewport → **sin scroll horizontal ni superposiciones**. El único overflow
interno es el nav de secciones del panel, que scrollea dentro de su propio
contenedor (comportamiento intencional en móvil).

### Comportamiento de las tablas (listados)

| Tamaño | `thead`        | Celdas fila 1        | Etiquetas `data-label` |
| ------ | -------------- | -------------------- | ---------------------- |
| 390 px | `none` (cards) | apiladas (top 349→435)| visibles (p. ej. "Curso", "Nombre") |
| 768 px | visible (tabla)| alineadas (top igual) | ninguna (ocultas) |
| 1366 px| visible (tabla)| alineadas (top igual) | ninguna (ocultas) |

### Usabilidad funcional móvil (criterio de aceptación)

- En tarjeta, cada fila conserva: nombre y datos (curso/usuario), estado
  (`Activo`/`Inactivo`) y las **acciones** (Editar / Desactivar / Activar /
  Eliminar) → ninguna funcionalidad se pierde.
- El login, los formularios (`curso-form`, alta de usuario, guía) y el toggle de
  usuarios quedan a ancho completo y operables por touch (áreas táctiles ≥ 40 px).

## Datos de prueba

- Sesión: administrador (`admin@cfl401.edu.ar`).
- Listados: 5 cursos (4 del seed + residuo previo id 12, ajeno a este QA) y 4
  usuarios seed.
- Sin cambios de datos: el usuario de prueba residuo (`admin2@...`) detectado en
  la base fue eliminado; los cursos quedaron como estaban al inicio del QA.

## Notas

- Los breakpoints reutilizan los del sitio público (900/680/480 px).
- Verificación manual visual pendiente en celulares físicos muy angostos
  (< 320 px) y en el modo zoom del navegador; el CSS aplicado protege contra
  desbordes hasta ≤320 px.