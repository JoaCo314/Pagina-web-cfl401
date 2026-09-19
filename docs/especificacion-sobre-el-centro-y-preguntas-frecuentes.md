# Especificación: "Sobre el centro" y "Preguntas frecuentes"

Rutas públicas:
- `/sobre-el-centro`
- `/preguntas-frecuentes`

## "Sobre el centro" (`/sobre-el-centro`)

Página institucional enfocada en la historia del CFL 401. El contenido se
administra desde el panel y se guarda en la base de datos.

### Vista pública

- Encabezado de página (`page-header`) fijo con título "Sobre el Centro" y un
  párrafo introductorio editable.
- Secciones (todas **opcionales**). Si una sección no está completa, no se
  muestra en la vista pública (ni su título ni su contenido):
  1. **Misión / identidad institucional**: título + texto. Estilo "sobre con
     texto centrado" o tarjeta de presentación.
  2. **Historia y línea de tiempo**: título + texto narrativo + hitos. Los hitos
     se muestran como línea de tiempo (cada hito con año, título y texto).
  3. **Estadísticas**: título + lista de ítems (valor + etiqueta). Grilla de
     cajas destacadas.
  4. **Galería de fotos históricas**: título + conjunto de imágenes con
     leyenda/descripción opcional. Usa el sistema de subida de imágenes del
     panel (`POST /api/imagenes`).

### Panel (sección "Sobre el centro")

- Una sola página de edición: `/panel/sobre-el-centro`.
- Formulario único con todos los campos. Campos opcionales; los grupos vacíos
  se ocultan en la vista pública.
- Hitos: lista dinámica (agregar/quitar fila) con `año`, `título` y `texto`.
- Estadísticas: lista dinámica con `valor` y `etiqueta`.
- Galería: agregar/quitar imágenes subidas (con vista previa).
- Rol: **Administrador y Preceptor**.

## "Preguntas frecuentes" (`/preguntas-frecuentes`)

### Vista pública

- Encabezado de página fijo ("Preguntas frecuentes") y CTA de contacto.
- Preguntas agrupadas por **categorías**; cada categoría muestra sus preguntas
  activas ordenadas.
- Cada pregunta se muestra como **acordeón**: la respuesta se despliega al
  hacer clic (accesible con botón y `aria-expanded`).

### Panel (sección "Preguntas frecuentes")

- Listado en `/panel/preguntas-frecuentes` con:
  - Gestión de **categorías** (crear, renombrar, eliminar).
  - Listado de preguntas por categoría con alta/edición/eliminación y
    activo/inactivo y orden.
- Alta/edición de pregunta en páginas propias
  (`/panel/preguntas-frecuentes/nueva` y `/panel/preguntas-frecuentes/[id]/editar`).
- Rol: **Administrador y Preceptor**.

## Modelo de datos (Prisma)

- `SobreElCentro`: fila única de contenido.
  - `id`, `intro`, `misionTitulo`, `misionTexto`, `historiaTitulo`,
    `historiaTexto`, `hitos` (JSON), `estadisticas` (JSON), `galeria` (JSON),
    `activo`, timestamps.
  - `hitos`: `[{ anio: string, titulo: string, texto: string }]`
  - `estadisticas`: `[{ valor: string, etiqueta: string }]`
  - `galeria`: `[{ url: string, leyenda: string }]`
- `CategoriaPregunta`: `id`, `nombre` (único), `orden`, `activo`.
- `PreguntaFrecuente`: `id`, `pregunta`, `respuesta`, `categoriaId`,
  `orden`, `activo`.

## Permisos y navegación

- Nuevos permisos: `SOBRE_EL_CENTRO_EDITAR` y `PREGUNTAS_FAQS_EDITAR`
  (Administrador y Preceptor).
- Nueva sección en el panel: "Sobre el centro" y "Preguntas frecuentes".
- Navbar público: items "Sobre el centro" y "Preguntas frecuentes" apuntan a
  las rutas públicas nuevas (hoy son `#`).