# QA — Tarea #13: Pruebas de acceso denegado por rol

**Referencias:** RNF-04 · Sección 12 (matriz de permisos)
**Fecha de ejecución:** 17/09/2026
**Entorno:** contenedor Docker · `http://localhost:4088` · base seed de CFL 401

## Aclaraciones de alcance

- **Visitante**: no existe como rol en el sistema (solo existen `Administrador`,
  `Preceptor` y `Docente`). La prueba de "Visitante no accede a rutas
  administrativas" se ejecuta como **usuario no autenticado (anónimo)**.
- **Docente**: puede **editar** los cursos que le fueron asignados, pero **no
  puede eliminarlos ni modificar la asignación de docentes** (RF-09/RF-12/RF-16),
  independientemente de lo que digan otras tareas.
- **Gestión de usuarios** (crear Administradores/Preceptores/Docentes y
  desactivar cuentas): los permisos existen en la matriz (`USUARIOS_CREAR_*`,
  `USUARIOS_DESACTIVAR`) pero **el endpoint y el panel de usuarios aún no están
  implementados**. La validación "un Preceptor no puede crear Administradores ni
  Preceptores" se podrá probar y cerrar cuando se implemente esa funcionalidad.

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

## Pendiente de verificación (funcionalidad no implementada)

| ID | Rol | Acción | Estado |
|----|-----|--------|--------|
| P5 | Preceptor | Crear Administrador | ⏳ Pendiente — endpoint de alta de usuarios inexistente |
| P6 | Preceptor | Crear Preceptor | ⏳ Pendiente — endpoint de alta de usuarios inexistente |
| — | Preceptor | Crear Docente | ⏳ Pendiente — endpoint de alta de usuarios inexistente |
| — | Cualquier rol | `GET /panel/usuarios` | ⏳ Pendiente — página inexistente (404) |

Al implementarse el panel de usuarios se probará que el Preceptor solo pueda
crear Docentes (no Administradores ni Preceptores) conforme a RF-13/RF-14.

## Notas y limitaciones observadas

- El `PUT /api/cursos/[id]` exige el campo obligatorio `nombre` en el cuerpo:
  una edición parcial sin `nombre` devuelve 400. El formulario de la UI siempre
  lo envía, por lo que el flujo normal no se ve afectado.
- El `GET /api/cursos/[id]/docentes` requiere sesión (`CURSOS_VER`): un usuario
  anónimo recibe 401. Es una consulta de lectura permitida para los tres roles.
- Las pruebas eliminaron los cursos creados (QA Curso Temporal, QA Curso Admin)
  al finalizar; la base quedó sin residuos de la ejecución QA.