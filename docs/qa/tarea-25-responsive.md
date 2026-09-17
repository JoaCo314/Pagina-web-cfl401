# QA — Responsive del sitio público (Tarea #25, RNF-02)

Fecha: 2026-09-17 · Branch `Joaquin`

## Alcance

Verificación y ajuste responsive de las 3 pantallas públicas:

- **Catálogo** de cursos (`/cursos`)
- **Detalle** de curso (`/cursos/[id]`)
- **Guía de inscripción** (sección `#guia` de la home `/`)

## Breakpoints implementados en `src/app/globals.css`

| Estado        | Rango                          | Catálogo | Guía | Detalle |
| ------------- | ------------------------------ | -------- | ---- | ------- |
| Desktop       | > 1024px                       | 3 cols   | 2    | 2 cols (aside sticky) |
| Tablet        | 901–1024px                     | 2 cols   | 2    | 2 cols (aside sticky) |
| Tablet vert.  | 681–900px                      | 2 cols   | 2    | 1 col (aside abajo) |
| Celular       | ≤ 680px                        | 1 col    | 1    | 1 col, campos apilados |
| Celular chico | ≤ 480px                        | —        | —    | logo compacto, acciones a ancho completo |

### Ajustes aplicados

- Nuevos breakpoints `1024px` (catálogo 2 col), `680px` (1 col + paddings/tipografía
  compactos) y `480px` (logo con ellipsis, un badge oculto, botones del hero a
  ancho completo).
- Detalle en celular: el `aside` pasa a abajo (ya existía con 900px) y los ítems
  `dt/dd` se apilan en columna para evitar textos largos que desborden.
- Guía: tarjetas a 1 columna en celular con padding reducido.

## Metodología

Pruebas automatizadas con navegador real (Microsoft Edge headless vía protocolo
CDP) midiendo en cada combinación:

- `documentElement.scrollWidth` vs `clientWidth` → detección de **scroll horizontal**.
- Recorrido de todos los elementos con `getBoundingClientRect()` → detección de
  **elementos fuera del viewport** (right > vw + 1 o left < -1).
- Número de elementos que comparten la primera fila → **columnas reales** del grid.

## Resultados

### Scroll horizontal y superposiciones (criterio de aceptación)

| Tamaño           | Home `/`      | Catálogo `/cursos` | Detalle `/cursos/1` |
| ---------------- | ------------- | ------------------ | ------------------- |
| `390×844` Móvil  | OK sin desbordes | OK sin desbordes | OK sin desbordes |
| `768×1024` Tablet| OK sin desbordes | OK sin desbordes | OK sin desbordes |
| `1366×768` Desktop| OK sin desbordes | OK sin desbordes | OK sin desbordes |

**Resultado:** en las 9 combinaciones `scrollWidth === clientWidth` y cero
elementos con rect fuera del viewport → no hay scroll horizontal ni elementos
superpuestos. ✔

### Columnas efectivas del layout

| Tamaño   | Catálogo (5 cursos) | Guía (4 bloques) |
| -------- | ------------------- | ---------------- |
| 390 px   | 1 columna           | 1 columna        |
| 768 px   | 2 columnas          | 2 columnas       |
| 1366 px  | 3 columnas          | 2 columnas       |

✔ La cuadrícula se adapta al ancho disponible en cada tamaño.

## Datos de prueba

- Catálogo con 5 cursos (seed: Reparación y Mantenimiento de PC, Auxiliar de
  Cocina, Electricidad Domiciliaria Básica, Auxiliar Administrativo Contable +
  curso de prueba QA).
- Guía con los 4 bloques del seed (pasos, documentación, requisitos,
  información adicional).

## Notas

- Sin cambios de datos: los cursos/guía de prueba QA se dejaron en el estado
  original del seed al concluir.
- Verificación manual pendiente en caso de que el sitio deba probarse también en
  navegadores/webviews embebidos muy angostos (< 320px): los breakpoints actuales
  cubren hasta ≤480px con protección de desbordes; debajo de 320px conviene una
  pasada visual.