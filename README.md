# Página Web CFL 401

Sitio web del **Centro de Formación Laboral N° 401**. Plataforma para presentar la oferta de cursos e información de inscripción, con panel de administración.

## 🚀 Tecnologías

- **Frontend + Backend:** Next.js 16 (App Router, TypeScript, API Routes)
- **Base de datos:** PostgreSQL 16 con **Prisma ORM 7** (migraciones + cliente tipado)
- **DevOps:** Docker + Docker Compose

## 📁 Estructura del proyecto

```text
Pagina-web-cfl401/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── health/       # Health check del backend
│   │   ├── layout.tsx        # Layout raíz
│   │   ├── page.tsx          # Página principal
│   │   └── globals.css       # Estilos globales
│   ├── lib/
│   │   ├── db.ts             # Health check de la base de datos
│   │   └── prisma.ts         # Cliente Prisma (singleton)
│   └── generated/            # Cliente Prisma generado (no se commitea)
├── prisma/
│   ├── schema.prisma         # Modelo de datos (entidades y relaciones)
│   └── migrations/           # Migraciones versionadas
├── prisma7.config.ts         # Config de Prisma 7 (DATABASE_URL)
├── public/                   # Imágenes y recursos estáticos
├── assets/                   # Assets originales del sitio (referencia)
├── Dockerfile                # Build de producción (web + init)
├── docker-compose.yml        # Orquestación (web + db + init)
├── docker-entrypoint.sh      # Arranque del contenedor: migraciones + seed + server
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
| `AUTH_SECRET` | Secreto para firmar las sesiones (JWT) | solo hay fallback de desarrollo |
| `RUN_SEED` | Ejecuta el seed de datos de prueba al arrancar | `false` |
| `RUN_MIGRATIONS` | El entrypoint del contenedor `web` aplica migraciones | `false` en Compose |
| `TRUST_PROXY` | Lee la IP real de `x-forwarded-for` | `false` |
| `MIGRATE_RETRIES` | Reintentos de `migrate deploy` al arrancar | `30` |

> Copia `.env.example` a `.env` para ajustar valores. `.env` está en `.gitignore` y no se commitea.
> En Docker, el `docker-compose.yml` arma `DATABASE_URL` apuntando al servicio `db` automáticamente.

### Sobre `AUTH_SECRET`

`AUTH_SECRET` es **obligatoria**: es la clave con la que se firman los JWT de
sesión y sin ella la app lanza un error al validar cualquier cookie. Generala una
vez y guardala como secreto del stack (no la regeneres: cambiar la clave cierra
todas las sesiones abiertas):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Sobre `TRUST_PROXY`

El login y el cambio de contraseña limitan los intentos fallidos por cuenta (5) y
por IP (20); el formulario de contacto cuenta todos los envíos (no solo los
fallidos) con topes por IP (20) y por correo (5). Para armar el límite por IP la
app necesita la IP real:

- `TRUST_PROXY=false` (default): no lee cabeceras de proxy y usa una única clave
  para todas las conexiones. Sirve en desarrollo, donde el navegador habla
  directo con el contenedor.
- `TRUST_PROXY=true`: solo si la app está detrás de un proxy propio (Nginx,
  Traefik, Dokploy). Con `false` en un despliegue real, todos los límites por IP
  comparten una clave global y un atacante puede bloquear el login de todo el
  centro agitando cinco contraseñas incorrectas.

Con `TRUST_PROXY=true` la app también toma `x-forwarded-proto` para decidir si la
cookie de sesión se marca `secure`, así que funciona igual detrás de un proxy que
termina TLS.

> Los contadores viven en memoria del proceso. Con una sola instancia (el
> despliegue de este proyecto) alcanza; si alguna vez se escala a varias réplicas
> detrás de un balanceador hay que moverlos a la base o a Redis.

`RUN_SEED` viene **apagado**: el seed crea datos de prueba y en un despliegue
con datos reales no debe correr. El seed solo crea lo que falta y nunca pisa
contraseñas ni reinicia cuentas existentes.

## 🗄️ Base de datos (Prisma)

El modelo de datos se define en `prisma/schema.prisma`. Entidades:

- **Rol** — los 3 roles que se persisten (Administrador, Preceptor, Docente) con campo `nivel` para la jerarquía. El Visitante no tiene rol: es todo usuario sin sesión.
- **Usuario** — usuarios del sistema. `activo` desactiva el login; `dni` es único y es la fuente de la contraseña temporal; `debeCambiarContrasena` fuerza el cambio en el primer ingreso; `versionSesion` invalida sesiones al cambiar o blanquear una contraseña.
- **Curso** — oferta educativa (campos de la sección 7 del documento).
- **CursoDocente** — relación N:N entre cursos y docentes asignados.
- **Imagen** — imágenes subidas desde el panel, guardadas como bytes y servidas por `/api/imagenes/[id]`.
- **MensajeContacto** — consultas que llegan por el formulario público de `/contacto`. El panel del Administrador las lee y marca como leídas.

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

- **Contenedor único (Dokploy)**: el contenedor que arranca la web ejecuta `prisma migrate deploy` en cada inicio, dentro de `docker-entrypoint.sh`, antes de levantar el servidor. Si la base aún no está lista, reintenta hasta `MIGRATE_RETRIES` veces (default `30`, cada 2 s) y luego falla con error (visible en los logs del deploy). Si preferís que las migraciones corran en un paso aparte del arranque, poné `RUN_MIGRATIONS=false` y aplicalas por separado.
- **Stack con Compose**: el servicio `init` corre las migraciones (y el seed si `RUN_SEED=true`) y `web` espera a que termine. `web` va con `RUN_MIGRATIONS=false`, así que no las repite: el flujo de migraciones queda en un solo lugar.

Opciones al desplegar:

- **`AUTH_SECRET`**: definilo como variable/secreto del stack con un valor aleatorio de 32 bytes (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Es obligatorio: sin esta variable la app no puede firmar sesiones y falla al pedir `/api/auth/me`.
- **`POSTGRES_PASSWORD`**: usá una contraseña fuerte y distinta de la de desarrollo.
- **`RUN_SEED`**: seed de datos de prueba. Default `false`; solo prendelo en desarrollo. El seed nunca pisa contraseñas ni reactiva cuentas ya existentes.
- **`TRUST_PROXY`**: ponelo en `true` si hay un proxy delante (Traefik, Nginx, Dokploy), para que los límites de intentos por IP vean la IP real. Ver la sección de variables de entorno.
- **`MIGRATE_RETRIES`**: cantidad de reintentos de `migrate deploy` al arrancar (default `30`).
- **Base expuesta**: en el stack Compose el servicio `db` queda en loopback (`127.0.0.1:5432:5432`); en Dokploy la base suele ser otro contenedor del mismo proyecto, configurado como secreto/URL en `DATABASE_URL`.
- **Firewall**: abrí el puerto `4088/tcp` (o el que configuren en el mapeo) y `80/443` si usan dominio con HTTPS.
- **HTTPS con proxy**: con `TRUST_PROXY=true` la cookie de sesión se marca `Secure` si el proxy envía `x-forwarded-proto: https`, así que funciona detrás de Traefik/Nginx sin tocar `next.config.ts`.

## 📝 Notas

- El sitio público estático original (HTML/CSS) se conserva en las raíces del repo (`index.html`, `cursos.html`, etc.) como referencia/migración futura.
- La web publica el puerto 4088 del host hacia el contenedor (interno 3000). Cualquier cambio de puerto se hace en el lado izquierdo del mapeo de `docker-compose.yml`.
- El contenedor `web` tiene un healthcheck contra `/api/health`, que responde 503 si la base no está accesible. `docker compose ps` muestra el estado; `docker compose up -d` espera a que `db` esté sano y a que `init` termine.
- La contraseña temporal de una cuenta se deriva siempre de los últimos 4 dígitos de su DNI y **no se muestra en la interfaz ni se devuelve por API**. Para comunicársela a la persona hay que leerla del DNI, no de la pantalla.
- Cambiar o blanquear una contraseña cierra las sesiones abiertas de esa cuenta en otros equipos: el JWT lleva el número de `versionSesion` con el que se emitió y si no coincide con la base, la sesión deja de validar.
- Los endpoints que modifican datos no necesitan token CSRF: la cookie de sesión es `httpOnly` + `sameSite=lax` (no viaja en pedidos de otro sitio) y ninguna escritura se hace por GET.
- Mientras una cuenta tiene contraseña temporal, la API y las páginas del panel bloquean toda operación salvo el cambio de contraseña, y el bloqueo se aplica en el servidor.
