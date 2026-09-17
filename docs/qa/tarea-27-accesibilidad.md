# QA — Accesibilidad básica del sitio público (Tarea #27, RNF-07)

Fecha: 2026-09-17 · Branch `Joaquin`

## Alcance

Pantallas públicas: Home (`/`), catálogo (`/cursos`) y detalle (`/cursos/[id]`),
más el header/footer compartidos. Páginas del panel y formularios de admin quedan
fuera del checklist (se mejoraron incidentalmente los textos secundarios con bajo
contraste por compartir `globals.css`).

## 1. Contraste de color

### Cambios en `src/app/globals.css`

| Elemento | Antes | Ahora | Ratio |
| -------- | ----- | ----- | ----- |
| Botones primarios (`.btn-primary`, `.btn-primary` del panel) | blanco sobre `#3e8fcc` | nuevo `--cfl-blue-deep: #2a6ea3` | **5.44:1** (cumple ≥4.5) |
| Aviso "cupos" (`.cupos`) y avisos del panel | `--cfl-warn-fg: #a8620a` | `#8f5307` | **5.65:1** |
| `.course-docente` (tarjetas catálogo) | `opacity .55` | `opacity .72` | **6.09:1** |
| `.detail-item dt` (detalle) | `opacity .55` | `opacity .72` | **6.52:1** |
| `.detail-back` (volver) | `--cfl-blue #3e8fcc` | `--cfl-navy-2` | **11.63:1** |
| `.courses-empty` | `opacity .6` | `opacity .7` | 7.0:1 |
| Panel/form: `.panel-table th`, `.td-sub`, `.link-accion`, `.docente-opt small`, `.guia-contador` | opacidades 0.55/0.6/0.7 y azul | opacidades 0.7/0.75/0.85 y `--cfl-navy-2` | todos ≥4.5 |

Se verificó que los pares de texto sobre fondo ya cumplían sin cambios (sin
opacidad o con ≥0.7 en texto de 12-16px, y texto blanco grande sobre azul oscuro):
encabezados, `.tag`, `.course-gratis`, `.detail-cta`, footer, hero.

### Medición real (Edge headless + CDP)

Se midió el ratio efectivo componiendo color de texto × opacidad sobre el fondo
real (incluyendo gradientes, p. ej. `.hero`), para todas las muestras de las tres
páginas:

- **Home**: mínimo 5.44:1 (`.btn-primary`); resto entre 8 y 14.55:1.
- **Catálogo**: mínimo 5.32:1 (`.course-gratis`); `.course-docente` 6.09, `.cupos`
  5.65, `.tag` 10.35, enlaces 11.63.
- **Detalle**: mínimo 5.32:1 (`.detail-cta`); `.detail-item dt` 6.52, `.desc` 7.23.

Resultado: **ningún par por debajo de 4.5:1** (criterio AA WCAG 2.1 para texto
normal).

## 2. Textos alternativos

- Única imagen del sitio público: el logo en `SiteHeader` ya tenía
  `alt="CFL 401 Azul"`. Sin cambio.
- Iconos de cursos (`course-icon`, `guia-icon`) son emojis/glifos acompañados de
  texto textual (nombre del curso), por lo que no requieren `alt`.
- Filtros del catálogo (input de búsqueda y select de rubro) ahora tienen
  `aria-label` con nombre accesible (`CourseCatalog.tsx`).

## 3. Navegación por teclado

- Todos los controles son elementos nativos (`a`, `button`, `input`, `select`)
  tabulables; el menú móvil usa `<button>` con `aria-label`/`aria-expanded`
  (`SiteHeader.tsx`).
- `:focus-visible` global con outline de 3px visible en el sitio completo.
- **Skip link** "Saltar al contenido" agregado al inicio de cada página pública
  (antes del topbar), con target `id="contenido"` + `tabindex="-1"` en hero,
  `page-header` y `detail-body`. Oculto hasta recibir foco.
- Orden de tabulación verificado con pulsaciones `Tab` reales vía CDP:

  - **Catálogo**: Saltar-al-contenido → logo → menú → filtros (input, select) →
    tarjetas (enlaces "Ver detalle").
  - **Detalle**: Saltar-al-contenido → logo → menú → "Volver al catálogo" →
    CTA "Inscribirme".
  - Navegador, botones y enlaces reciben foco; sin "trampas de teclado".

- Prueba del skip link: al enfocarlo se vuelve visible; al presionar Entrar el
  foco salta a `#contenido` (`foco=contenido`) y la página hace scroll al
  contenido (`scrollY≈122`).

## Conclusión

Criterio de aceptación cumplido: las pantallas públicas cumplen contraste mínimo
(≥4.5:1 en todos los textos medidos), alt-text y nombres accesibles en los
controles, y se navegan por completo con teclado (incluido un mecanismo para
omitir el header).