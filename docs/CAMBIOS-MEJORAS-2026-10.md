# Cambios — Mejoras de seguridad, gestión de usuarios y contenido (2026-10)

**Fecha:** 2026-10-17
**Origen:** cierre de los hallazgos de la auditoría de seguridad (`e801808`,
`ec41a02`) y de un análisis de brechas posterior. Cada mejora se hizo en su
propio commit, con verificación automática (smoke tests) antes de commitear.

Este documento describe **qué se agregó o cambió** respecto del MVP original
descrito en `documentacion.md`. No reemplaza a ese documento: lo complementa.

---

## 1. Resumen de commits

| # | Mejora | Commit | Migración |
|---|--------|--------|-----------|
| 1 | Auditoría de acciones (solo Administrador) | `042cfbc` | `20261016184417_auditoria_acciones` |
| 2 | Bloqueo de cuenta tras 5 intentos fallidos | `fce9111` | `20261016192604_usuario_bloqueo_intentos` |
| 3 | Editar nombre/apellido/email de usuarios | `7b42e32` | — |
| 4 | Eliminar cuenta (solo si está desactivada) | `993e376` | — |
| 5 | El usuario edita su correo y agrega teléfono | `ba595d3` | `20261016202408_usuario_telefono` |
| 6 | Búsqueda y filtro por rol en usuarios | `cf5dc73` | — |
| 7 | Paginación del catálogo público de cursos | `a385add` | — |
| 8 | Login con correo **o** DNI | `d1ca474` | — |
| 9 | Notificación in-app al asignar un curso | `3392bfa` | `20261016212220_notificaciones` |
| 10 | Categorías de cursos como entidad | `a2374f2` | `20261016223000_categoria_curso` |
| 11 | Noticias en estado borrador | `919579b` | `20261017000000_noticia_borrador` |
| 12 | Drag & drop en hitos/galería de Sobre el centro | `bec6642` | — |

---

## 2. Detalle por mejora

### 1. Auditoría de acciones administrativas

Registra **quién hizo qué y cuándo** para las operaciones que modifican datos.
Visible únicamente por el Administrador.

- **Esquema:** `model AuditoriaAccion` (`auditoria_acciones`). Guarda un
  *snapshot* del nombre/email del usuario (para que el registro siga siendo
  legible aunque la cuenta se elimine), la acción, el recurso, su id, un resumen
  legible y los campos afectados. **No** guarda contraseñas ni hashes.
- **Lógica:** `src/lib/auditoria.ts` (`registrarAuditoria`, constantes
  `ACCIONES_AUDITORIA` y `RECURSOS_AUDITORIA`).
- **Permiso:** `AUDITORIA_VER`, exclusivo del Administrador.
- **Panel:** `/panel/auditoria` con paginación y filtros.
- Se instrumentaron todos los endpoints mutantes (cursos, usuarios, noticias,
  guías, FAQs, sobre el centro, configuración, imágenes, consultas).

### 2. Bloqueo de cuenta tras intentos fallidos

- Tras **5** intentos fallidos de login la cuenta se marca `bloqueada`
  (distinto de `activo=false`, que es una baja manual). Solo Administrador o
  Preceptor la reactivan desde el panel.
- **Rate limit en base de datos** (`rate_limit_intentos`): los contadores ya no
  viven en memoria del proceso, así que el bloqueo se comparte entre réplicas y
  sobrevive a un reinicio. Afecta login, cambio de contraseña y formulario de
  contacto.
- `src/lib/auth/rateLimit.ts` (`crearLimitador`, `ipCliente`).

### 3. Edición de nombre, apellido y email

- El Administrador (y el Preceptor sobre docentes) puede corregir nombre,
  apellido y email desde `/panel/usuarios/[id]/editar`.
- `src/components/panel/EditarUsuarioForm.tsx`, `src/lib/usuariosAdmin.ts`.
- El email se normaliza a minúsculas (índice funcional `usuarios_email_lower_key`).

### 4. Eliminación de cuenta

- `DELETE /api/admin/usuarios/[id]`: **irreversible**, reservado al Administrador
  (`USUARIOS_ELIMINAR`) y **solo sobre cuentas ya desactivadas**, para evitar
  borrar por error cuentas en uso.
- Confirmación en el panel (`src/components/panel/EliminarUsuario.tsx`).

### 5. Correo y teléfono propios

- Cada usuario edita su **correo** y su **teléfono** (campo nuevo, opcional)
  desde `/panel/mis-datos`. No puede cambiar su nombre ni su DNI.
- El teléfono lo ven Administrador y Preceptor en el listado de usuarios, solo
  para comunicación directa: **nunca se muestra en el sitio público**.
- `src/components/auth/MisDatosForm.tsx`, `src/lib/validaciones.ts`
  (`REGEX_TELEFONO`, `esTelefonoValido`).

### 6. Búsqueda y filtro por rol en usuarios

- `/panel/usuarios` acepta `?q=` (busca por nombre, apellido, DNI o email) y
  `?rol=`. El filtro por rol solo lo ve el Administrador (el Preceptor ya ve
  únicamente docentes).
- Paginación incluida.

### 7. Paginación del catálogo público de cursos

- `/cursos` pagina de a 6 cursos (`CURSOS_POR_PAGINA`) con componente
  `NavPaginacion`.

### 8. Login con correo o DNI

- `POST /api/auth/login` acepta `identificador` que puede ser **correo o DNI**,
  indistintamente. El formulario y la página de login reflejan la opción.

### 9. Notificación in-app al asignar un curso

- Cuando se asigna un docente a un curso (alta o edición) se le crea una
  `Notificacion` (`tipo = "curso_asignado"`).
- `GET /api/notificaciones` devuelve la lista y el contador de no leídas;
  `PATCH` marca una o todas como leídas (404 si el id no es de la cuenta).
- En el panel: campana en la cabecera (`CampanaNotificaciones`, con badge y SVG
  inline, sin emojis) y bandeja en `/panel/notificaciones`. La sección
  "Notificaciones" está disponible para cualquier cuenta autenticada.

### 10. Categorías de cursos como entidad

- Antes la categoría era **texto libre** en `Curso.categoria`; ahora es una
  entidad (`CategoriaCurso`, tabla `categorias_cursos`) y `Curso.categoriaId`.
- La migración **reasigna** las categorías de texto existentes a las nuevas
  entidades (backfill) sin perder datos.
- `onDelete: SetNull`: eliminar una categoría **no** borra los cursos, los deja
  sin categoría.
- CRUD en `/panel/categorias-cursos` (permiso `CURSOS_CATEGORIAS`, Admin y
  Preceptor) y selectores en el formulario de curso.

### 11. Noticias en estado borrador

- `Noticia.borrador`: una noticia en borrador **nunca** se muestra en el sitio
  público (ni en listado, ni en detalle, ni en el sitemap), aunque `activo` sea
  verdadero.
- El panel muestra el estado (*Borrador* / *Publicada* / *Inactiva*) y el
  formulario permite publicar, guardar como borrador o despublicar.

### 12. Drag & drop en Sobre el centro

- En `/panel/sobre-el-centro` los **hitos** y las **fotos de la galería** se
  reordenan arrastrando el asa (drag & drop HTML5, sin dependencias nuevas).
- `src/components/panel/SobreElCentroForm.tsx`.

---

## 3. Permisos y secciones agregadas

Nuevos permisos en `src/lib/auth/autorizacion.ts`:

| Permiso | Administrador | Preceptor | Docente |
|---------|:---:|:---:|:---:|
| `USUARIOS_ELIMINAR` | ✔ | ✘ | ✘ |
| `CURSOS_CATEGORIAS` | ✔ | ✔ | ✘ |
| `AUDITORIA_VER` | ✔ | ✘ | ✘ |

Nuevas secciones del panel: **Notificaciones** (todos), **Categorías de cursos**
(Admin/Preceptor), **Auditoría** (solo Admin).

---

## 4. Verificación

Cada mejora se probó con scripts *smoke* antes de commitear (login por API/UI,
altas, permisos por rol, validaciones y limpieza de datos de prueba). Todos
pasaron y el `tsc --noEmit`, `npm run build` y el stack Docker quedaron en verde.

| Suite | Cubre | Resultado |
|-------|-------|-----------|
| `smoke-aud.js` | Auditoría | 13/13 |
| `smoke-lock.js` | Bloqueo por intentos | 12/12 |
| `smoke-edit.js` | Edición de usuario | 16/16 |
| `smoke-del.js` + `smoke-del-ui.js` | Eliminación de cuenta | 13/13 + 5/5 |
| `smoke-tel.js` | Correo + teléfono | 22/22 |
| `smoke-search.js` | Búsqueda/filtro de usuarios | 13/13 |
| `smoke-catalog.js` | Paginación del catálogo | 10/10 |
| `smoke-login.js` | Login correo o DNI | 10/10 |
| `smoke-notif.js` + `smoke-notif-ui.js` | Notificaciones | 17/17 + 7/7 |
| `smoke-catcurso.js` | Categorías de cursos | 23/23 |
| `smoke-borrador.js` | Noticias borrador | 17/17 |
| `smoke-dnd.js` | Drag & drop Sobre el centro | 8/8 |

---

## 5. Cómo probarlo a mano

Con el stack levantado (`docker compose up -d --build`), en
`http://localhost:4088`:

- **Auditoría:** entrar como `admin@cfl401.edu.ar` / `Admin123!` → menú
  **Auditoría**: se ve el registro de lo que hicieron los usuarios.
- **Bloqueo:** fallar 5 veces el login de una cuenta y verla "Bloqueada" en
  `/panel/usuarios`; reactivarla desde el panel.
- **Mis datos:** como cualquier usuario, `/panel/mis-datos` permite cambiar
  correo y cargar teléfono.
- **Búsqueda/filtro:** en `/panel/usuarios` buscar por nombre o filtrar por rol
  (Admin).
- **Notificaciones:** asignar un docente a un curso y entrar con ese docente: la
  campana muestra el aviso.
- **Categorías:** `/panel/categorias-cursos` crear/editar; el curso se elige por
  selector.
- **Borrador:** en `/panel/noticias/nuevo`, elegir estado *Borrador* y guardar:
  no aparece en `/noticias` hasta publicarlo.
- **Drag & drop:** en `/panel/sobre-el-centro`, arrastrar el asa para reordenar
  hitos y fotos.
