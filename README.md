# Página Web CFL 401

Sitio web del **Centro de Formación Laboral N° 401**. Plataforma para presentar la oferta de cursos e información de inscripción, con panel de administración.

## 🚀 Tecnologías

- **Frontend + Backend:** Next.js 16 (App Router, TypeScript, API Routes)
- **Base de datos:** PostgreSQL 16 con **Prisma ORM 7** (migraciones + cliente tipado)
- **DevOps:** Docker + Docker Compose

## 📁 Estructura del proyecto

```text
Pagina-web-cfl401/
├── Backend/                  # API, autenticación, Prisma y panel administrativo
│   ├── src/app/api/          # Rutas API y health check
│   ├── src/lib/              # Lógica de negocio, permisos y acceso a datos
│   ├── prisma/               # Esquema, migraciones y seed
│   └── Dockerfile            # Build de producción del Backend
├── Frontend/                 # Aplicación Next.js de visualización pública
│   ├── src/app/              # Rutas App Router de las páginas actuales
│   ├── src/components/       # Componentes de interfaz y comportamiento cliente
│   ├── public/               # Recursos estáticos del sitio
│   ├── legacy/               # HTML original preservado como referencia
│   └── Dockerfile            # Build de producción del Frontend
├── docker-compose.yml        # Orquestación (web + db + init)
├── .env.example              # Variables de entorno de ejemplo
└── README.md
```

## 🔧 Requisitos previos

- [Docker](https://www.docker.com/products/docker-desktop/) con Docker Compose (v2+)
- Node.js 20+ (solo para desarrollo local) y npm

## 🏗️ Levantar el proyecto

### Opción A: Docker (recomendada)

Con Docker Desktop corriendo, desde la raíz del proyecto:

```bash
# 1. Crear variables de entorno desde el ejemplo
copy .env.example .env

# 2. Construir y levantar web + base de datos
docker compose up -d --build
```

- Sitio: http://localhost:4088
- Health check: http://localhost:4088/api/health
- PostgreSQL: `localhost:5432` (usuario/contraseña según `.env`, default `postgres`/`postgres`, db `cfl401`). Solo accesible desde la máquina (loopback), no se expone al exterior.

> El contenedor de la web escucha en el puerto interno 3000 y se publica en el 4088 del host (`"4088:3000"` en `docker-compose.yml`). Para exponer otro puerto cambiá el lado izquierdo del mapeo (ej: `"5080:3000"`).

### Opción B: Desarrollo local

Para iterar rápido con hot-reload:

```bash
# 1. Instalar dependencias
npm install

# 2. Crear variables de entorno
copy .env.example .env

# 3. Levantar solo la base de datos con Docker
docker compose up -d db

# 4. Correr Next.js en modo desarrollo
npm run dev
```

- Sitio: http://localhost:3000

## ⚙️ Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `POSTGRES_USER` | Usuario de PostgreSQL | `postgres` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `postgres` |
| `POSTGRES_DB` | Nombre de la base de datos | `cfl401` |
| `DATABASE_URL` | URL de conexión que usa Prisma | `postgresql://postgres:postgres@localhost:5432/cfl401?schema=public` |

> Copia `.env.example` a `.env` para ajustar valores. `.env` está en `.gitignore` y no se commitea.
> En Docker, el `docker-compose.yml` arma `DATABASE_URL` apuntando al servicio `db` automáticamente.

## 🗄️ Base de datos (Prisma)

El modelo de datos se define en `prisma/schema.prisma`. Entidades:

- **Rol** — los 3 roles que se persisten (Administrador, Preceptor, Docente) con campo `nivel` para la jerarquía. El Visitante no tiene rol: es todo usuario sin sesión.
- **Usuario** — usuarios del sistema (`activo` permite desactivar el login).
- **Curso** — oferta educativa (campos de la sección 7 del documento).
- **CursoDocente** — relación N:N entre cursos y docentes asignados.

Comandos de base de datos:

```bash
npm run db:migrate    # Crea/aplica una migración en dev (prisma migrate dev)
npm run db:deploy     # Aplica migraciones pendientes (producción)
npm run db:generate   # Regenera el cliente Prisma en src/generated
npm run db:studio     # Abre Prisma Studio (GUI para ver/editar datos)
```

> El cliente generado (`src/generated/`) no se commitea; se regenera con `npm run db:generate` (el `Dockerfile` ya lo hace en el build).

## 🔍 Verificación

Al abrir http://localhost:4088 deberías ver la página principal con el estado del health check y de la base de datos en **ok**.

### Prueba del health check

```bash
curl http://localhost:4088/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "timestamp": "2026-...",
  "service": "CFL 401 API",
  "database": { "status": "ok" }
}
```

## 📌 Comandos útiles

```bash
npm run dev          # Desarrollo (hot-reload)
npm run build        # Build de producción
npm run start        # Iniciar el build de producción
npm run lint         # ESLint
npm run db:migrate   # Crea/aplica migraciones en dev
npm run db:studio    # Abre Prisma Studio
docker compose down        # Detener contenedores
docker compose down -v     # Detener y borrar datos de la BD
```

## ☁️ Producción (VPS / Dokploy)

Se puede desplegar tanto el stack completo (`docker-compose.yml`) como un **contenedor único** en Dokploy (build del `Dockerfile`). En ambos casos las migraciones corren automáticamente:

- **Contenedor único (Dokploy)**: el contenedor que arranca la web ejecuta `prisma migrate deploy` en cada inicio, dentro de `docker-entrypoint.sh`, antes de levantar el servidor. Si la base aún no está lista, reintenta hasta `MIGRATE_RETRIES` veces (default `30`, cada 2 s) y luego falla con error (visible en los logs del deploy).
- **Stack con Compose**: el servicio `init` corre las migraciones (y el seed si `RUN_SEED=true`) antes de que arranque `web`. Con el nuevo entrypoint, `web` también las vuelve a aplicar en cada arranque (no-op si ya están aplicadas).

Opciones al desplegar:

- **`AUTH_SECRET`**: definilo como variable/secreto del stack con un valor aleatorio de 32 bytes (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Sin esto las sesiones usan el fallback de desarrollo.
- **`POSTGRES_PASSWORD`**: usá una contraseña fuerte y distinta de la de desarrollo.
- **`RUN_SEED`**: controla el seed de datos de prueba (default `true` en Compose). En producción con datos reales ponelo en `false` para no regenerar datos de prueba.
- **`MIGRATE_RETRIES`**: cantidad de reintentos de `migrate deploy` al arrancar (default `30`).
- **Base expuesta**: en el stack Compose el servicio `db` queda en loopback (`127.0.0.1:5432:5432`); en Dokploy la base suele ser otro contenedor del mismo proyecto, configurado como secreto/URL en `DATABASE_URL`.
- **Firewall**: abrí el puerto `4088/tcp` (o el que configuren en el mapeo) y `80/443` si usan dominio con HTTPS.
- **HTTPS con proxy**: si ponés dominio con HTTPS delante (ej. Traefik), el login no marca la cookie como `Secure` (funciona igual); para endurecerlo se puede habilitar `server.hostname`/`trustHost` en `next.config.ts`.

## 📝 Notas

- El sitio público estático original (HTML/CSS) se conserva en las raíces del repo (`index.html`, `cursos.html`, etc.) como referencia/migración futura.
- La web publica el puerto 4088 del host hacia el contenedor (interno 3000). Cualquier cambio de puerto se hace en el lado izquierdo del mapeo de `docker-compose.yml`.
