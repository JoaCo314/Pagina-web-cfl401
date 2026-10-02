# QA — Tarea #13: Pruebas de acceso denegado por rol

**Referencias:** RNF-04 · Sección 12 (matriz de permisos)
**Fecha de ejecución:** 17/09/2026 · **Actualizado:** 30/09/2026
**Entorno:** contenedor Docker · `http://localhost:4088` · base seed de CFL 401

## Por qué se actualiza este reporte

La ejecución original (17/09/2026) dejó la gestión de usuarios como
`⏳ Pendiente` porque **el panel y los endpoints no existían todavía**: era una
funcionalidad del MVP que no se había implementado.

Desde entonces se desarrolló una serie de funcionalidades que **no estaban
previstas en el MVP** y que cambian el alcance de esta tarea:

- **Gestión de usuarios** (RF-13/RF-14/RF-15): panel, endpoints, permisos por
  rol y el alcance acotado del Preceptor solo sobre cuentas Docente.
- **Contraseña temporal derivada del DNI** y blanqueo desde el panel, con el
  bloqueo de toda la API mientras la contraseña siga siendo temporal.
- **`versionSesion`**: cambiar o blanquear una contraseña cierra las sesiones
  abiertas de esa cuenta en otros equipos.
- **Endpoint `GET /api/categorias-preguntas`** protegido por sesión y
  `PREGUNTAS_FAQS_EDITAR`, antes público.

Los resultados de la ejecución original (tabla de cursos, A1–AD6) se conservan
sin cambios: siguen vigentes. Lo que se agrega es la sección **Gestión de
usuarios (U1–U21)**, que cierra los pendientes que quedaron abiertos.

## Aclaraciones de alcance

- **Visitante**: no existe como rol en el sistema (solo existen `Administrador`,
  `Preceptor` y `Docente`). La prueba de "Visitante no accede a rutas
  administrativas" se ejecuta como **usuario no autenticado (anónimo)**.
- **Docente**: puede **editar** los cursos que le fueron asignados, pero **no
  puede eliminarlos ni modificar la asignación de docentes** (RF-09/RF-12/RF-16),
  independientemente de lo que digan otras tareas.
- **Gestión de usuarios**: implementada (`USUARIOS_CREAR_*`, `USUARIOS_VER_TODOS`,
  `USUARIOS_GESTIONAR_DOCENTES`). El Administrador gestiona todas las cuentas; el
  Preceptor **solo las de rol Docente** (RF-15 con alcance acotado); el Docente no
  tiene acceso al área de usuarios.

## Matriz de permisos verificada (implementada a la fecha)

| Rol | Crear curso | Editar cualquier curso | Editar cursos propios (Docente) | Eliminar curso | Asignar docentes | Listado admin de cursos | Panel |
|-----|-------------|------------------------|------------------|----------------|------------------|--------------------------|-------|
| Administrador | ✔ | ✔ | — | ✔ | ✔ | ✔ | ✔ |
| Preceptor | ✔ | ✔ | — | ✔ | ✔ | ✔ | ✔ |
| Docente | ✘ | ✘ (solo propios) | ✔ (solo asignados) | ✘ | ✘ | ✘ | ✔ (sin secciones admin) |
| Anónimo (Visitante) | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ |

## Resultados de las pruebas (request directa HTTP)

| ID | Rol | Acción | Request | Esperado | Obtenido | Estado |
|----|-----|--------|---------|----------|----------|--------|
| A1 | Anónimo | Listar cursos públicos | `GET /api/cursos` | 200 | 200 | ✔ |
| A2 | Anónimo | Crear curso | `POST /api/cursos` | 401 | 401 | ✔ |
| A3 | Anónimo | Editar curso | `PUT /api/cursos/1` | 401 | 401 | ✔ |
| A4 | Anónimo | Eliminar curso | `DELETE /api/cursos/1` | 401 | 401 | ✔ |
| A5 | Anónimo | Reasignar docentes | `PUT /api/cursos/1/docentes` | 401 | 401 | ✔ |
| A6 | Anónimo | Consultar sesión | `GET /api/auth/me` | 401 | 401 | ✔ |
| A7 | Anónimo | Acceder a `/panel` | `GET /panel` | 307 → login | 307 | ✔ |
| A8 | Anónimo | Acceder a `/panel/cursos` | `GET /panel/cursos` | 307 | 307 | ✔ |
| A9 | Anónimo | Acceder a `/panel/cursos/nuevo` | `GET /panel/cursos/nuevo` | 307 | 307 | ✔ |
| A10 | Anónimo | Acceder a edición | `GET /panel/cursos/1/editar` | 307 | 307 | ✔ |
| A11 | Anónimo | Ver detalle público de curso | `GET /api/cursos/1` | 200 | 200 | ✔ |
| A12 | Anónimo | Consultar asignación de docentes | `GET /api/cursos/1/docentes` | 401 | 401 | ✔ |
| A13 | Anónimo | Leer guía de inscripción | `GET /api/guia-inscripcion` | 200 | 200 | ✔ |
| D1 | Docente | Crear curso | `POST /api/cursos` | 403 | 403 | ✔ |
| D2 | Docente | Eliminar curso propio | `DELETE /api/cursos/1` | 403 | 403 | ✔ |
| D3 | Docente | Reasignar docentes de curso propio | `PUT /api/cursos/1/docentes` | 403 | 403 | ✔ |
| D4 | Docente | Intentar reasignar vía edición (body válido) | `PUT /api/cursos/1` con `docenteIds` | 403 | 403 | ✔ |
| D5 | Docente | Editar su curso asignado | `PUT /api/cursos/1` (sin `docenteIds`) | 200 | 200 | ✔ |
| D6 | Docente | Editar curso ajeno (no asignado) | `PUT /api/cursos/3` | 403 | 403 | ✔ |
| D7 | Docente | Listar cursos | `GET /api/cursos` | 200 | 200 | ✔ |
| D8 | Docente | Listado admin | `GET /panel/cursos` | 307 | 307 | ✔ |
| D9 | Docente | Alta de curso (página) | `GET /panel/cursos/nuevo` | 307 | 307 | ✔ |
| D10 | Docente | Editar su curso (página) | `GET /panel/cursos/1/editar` | 200 | 200 | ✔ |
| D11 | Docente | Editar curso ajeno (página) | `GET /panel/cursos/3/editar` | 307 | 307 | ✔ |
| D12 | Docente | Consultar asignación de docentes | `GET /api/cursos/1/docentes` | 200 | 200 | ✔ |
| D13 | Docente | Acceder a `/panel` | `GET /panel` | 200 | 200 | ✔ |
| P1 | Preceptor | Crear curso | `POST /api/cursos` | 201 | 201 | ✔ |
| P2 | Preceptor | Editar curso | `PUT /api/cursos/1` | 200 | 200 | ✔ |
| P3 | Preceptor | Reasignar docentes | `PUT /api/cursos/1/docentes` | 200 | 200 | ✔ |
| P4 | Preceptor | Eliminar curso creado | `DELETE /api/cursos/14` | 200 | 200 | ✔ |
| P7 | Preceptor | Listado admin | `GET /panel/cursos` | 200 | 200 | ✔ |
| P8 | Preceptor | Consultar asignación de docentes | `GET /api/cursos/1/docentes` | 200 | 200 | ✔ |
| P9 | Preceptor | Acceder a `/panel` | `GET /panel` | 200 | 200 | ✔ |
| AD1 | Administrador | Crear curso | `POST /api/cursos` | 201 | 201 | ✔ |
| AD2 | Administrador | Editar curso | `PUT /api/cursos/1` | 200 | 200 | ✔ |
| AD3 | Administrador | Reasignar docentes | `PUT /api/cursos/1/docentes` | 200 | 200 | ✔ |
| AD4 | Administrador | Eliminar curso creado | `DELETE /api/cursos/16` | 200 | 200 | ✔ |
| AD5 | Administrador | Consultar asignación de docentes | `GET /api/cursos/1/docentes` | 200 | 200 | ✔ |
| AD6 | Administrador | Acceder a `/panel` | `GET /panel` | 200 | 200 | ✔ |

## Gestión de usuarios (RF-13/RF-14/RF-15) — ejecución 30/09/2026

Alcance implementado: el Administrador ve y gestiona **todas** las cuentas; el
Preceptor ve y gestiona **solo las de rol Docente** (sin importar que conozca el
ID de otra cuenta); el Docente no accede al área de usuarios.

| ID | Rol | Acción | Request | Esperado | Obtenido | Estado |
|----|-----|--------|---------|----------|----------|--------|
| U1 | Anónimo | Listar usuarios | `GET /api/admin/usuarios` | 401 | 401 | ✔ |
| U2 | Anónimo | Crear usuario | `POST /api/admin/usuarios` | 401 | 401 | ✔ |
| U3 | Anónimo | Blanquear contraseña | `PATCH /api/admin/usuarios/3` | 401 | 401 | ✔ |
| U4 | Docente | Listar usuarios | `GET /api/admin/usuarios` | 403 | 403 | ✔ |
| U5 | Docente | Ver panel de usuarios | `GET /panel/usuarios` | 307 → `/panel` | 307 | ✔ |
| U6 | Docente | Blanquear a otro docente | `PATCH /api/admin/usuarios/4` | 403 | 403 | ✔ |
| U7 | Preceptor | Listar usuarios | `GET /api/admin/usuarios` | 200 solo docentes | 200 (3 docentes) | ✔ |
| U8 | Preceptor | Ver panel de usuarios | `GET /panel/usuarios` | 200 sin adm./preceptores | 200 | ✔ |
| U9 | Preceptor | Blanquear contraseña de un docente | `PATCH /api/admin/usuarios/3` | 200 | 200 | ✔ |
| U10 | Preceptor | Desactivar / reactivar un docente | `PATCH /api/admin/usuarios/3` | 200 | 200 | ✔ |
| U11 | Preceptor | Corregir DNI de un docente | `PATCH /api/admin/usuarios/4` | 200 | 200 | ✔ |
| U12 | Preceptor | Blanquear a un **Administrador** | `PATCH /api/admin/usuarios/1` | 403 | 403 | ✔ |
| U13 | Preceptor | Blanquear a un **Preceptor** | `PATCH /api/admin/usuarios/2` | 403 | 403 | ✔ |
| U14 | Preceptor | Corregir DNI de un Administrador | `PATCH /api/admin/usuarios/1` | 403 | 403 | ✔ |
| U15 | Preceptor | Crear **Docente** | `POST /api/admin/usuarios` rol Docente | 201 | 201 | ✔ |
| U16 | Preceptor | Crear **Preceptor** | `POST /api/admin/usuarios` rol Preceptor | 403 | 403 | ✔ |
| U17 | Preceptor | Crear **Administrador** | `POST /api/admin/usuarios` rol Administrador | 403 | 403 | ✔ |
| U18 | Preceptor | Asignar contraseña escrita a mano | `PATCH` con `password` | 400 | 400 | ✔ |
| U19 | Preceptor | Ver roles en el alta | `GET /panel/usuarios/nuevo` | solo opción Docente | solo Docente | ✔ |
| U20 | Administrador | Listar usuarios | `GET /api/admin/usuarios` | 200 (5 cuentas) | 200 | ✔ |
| U21 | Administrador | Blanquear a un Preceptor | `PATCH /api/admin/usuarios/2` | 200 | 200 | ✔ |

Notas de esta ejecución:

- Con `debeCambiarContrasena` en `true`, cualquier página del panel responde
  `307 → /panel/cambiar-mi-contrasena` **en el servidor**, sin depender del
  JavaScript del navegador (verificado en las 17 páginas del panel).
- La contraseña temporal nunca viaja en las respuestas de la API ni se muestra
  en pantalla: se deriva del DNI (últimos 4 dígitos) y se comunica al usuario.
- El listado del Preceptor oculta la columna Rol porque todas sus filas son
  Docente, y el resumen del panel muestra "Docentes activos" en lugar del total
  de cuentas.
- La base quedó sin residuos: se ejecutó el seed al terminar.

## Notas y limitaciones observadas

- El `PUT /api/cursos/[id]` exige el campo obligatorio `nombre` en el cuerpo:
  una edición parcial sin `nombre` devuelve 400. El formulario de la UI siempre
  lo envía, por lo que el flujo normal no se ve afectado.
- El `GET /api/cursos/[id]/docentes` requiere sesión (`CURSOS_VER`): un usuario
  anónimo recibe 401. Es una consulta de lectura permitida para los tres roles.
- Las pruebas eliminaron los cursos creados (QA Curso Temporal, QA Curso Admin)
  al finalizar; la base quedó sin residuos de la ejecución QA.