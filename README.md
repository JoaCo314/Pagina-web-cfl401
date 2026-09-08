# Página Web CFL 401

Sitio web del **Centro de Formación Laboral N° 401**. Plataforma para presentar la oferta de cursos e información de inscripción, con panel de administración.

## 🚀 Tecnologías

- **Frontend + Backend:** Next.js 16 (App Router, TypeScript, API Routes)
- **Base de datos:** PostgreSQL 16
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
│   └── lib/
│       └── db.ts             # Conexión a PostgreSQL
├── public/                   # Imágenes y recursos estáticos
├── assets/                   # Assets originales del sitio (referencia)
├── Dockerfile                # Build de producción
├── docker-compose.yml        # Orquestación (web + db)
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

- Sitio: http://localhost:3000
- Health check: http://localhost:3000/api/health
- PostgreSQL: `localhost:5432` (usuario/contraseña según `.env`, default `postgres`/`postgres`, db `cfl401`)

> Si el puerto 3000 está ocupado por otra aplicación, cambialo en `docker-compose.yml` (ej: `"3080:3000"`).

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
| `POSTGRES_HOST` | Host de PostgreSQL (`db` en Docker, `localhost` local) | `localhost` |
| `POSTGRES_PORT` | Puerto de PostgreSQL | `5432` |

> Copia `.env.example` a `.env` para ajustar valores. `.env` está en `.gitignore` y no se commitea.

## 🔍 Verificación

Al abrir http://localhost:3000 deberías ver la página principal con el estado del health check y de la base de datos en **ok**.

### Prueba del health check

```bash
curl http://localhost:3000/api/health
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
npm run dev      # Desarrollo (hot-reload)
npm run build    # Build de producción
npm run start    # Iniciar el build de producción
npm run lint     # ESLint
docker compose down        # Detener contenedores
docker compose down -v     # Detener y borrar datos de la BD
```

## 📝 Notas

- El sitio público estático original (HTML/CSS) se conserva en las raíces del repo (`index.html`, `cursos.html`, etc.) como referencia/migración futura.
- El puerto 3000 es el default de Next.js; si está ocupado por otro proyecto, ajustalo en `docker-compose.yml` y/o al levantar localmente.
