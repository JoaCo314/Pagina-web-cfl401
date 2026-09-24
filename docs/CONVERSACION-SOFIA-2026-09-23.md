# Conversación guardada — sofia-athos — 2026-09-23

**Rama:** `sofia-athos` (309560d) — Base `origin/main` 5b2f62c — No se tocó `main`

## Resumen de lo hablado

### 1. Limpieza de branch (no pasar arreglos locales a main)
- Problema: `sofia-athos` tenía 3 commits ahead (`98ea9bc` ReparsePoint + merges `05d42ad` y `31b1376` de JoaCo314/main) que no debían ir a `main`.
- Solución: backup local `sofia-athos-backup-commits-antiguos` (f73d01b) + `BACKUP-sofia-athos-README.txt` en Documentos, luego `reset --hard origin/main` y `push --force-with-lease`. Verificado con `git status`, `branch -vv` y GitHub que pasó de `3 ahead` a `1 ahead` y luego a `up to date`.

### 2. Qué es Prisma (SQL vs NoSQL)
- Prisma es ORM en `prisma/schema.prisma:1`. Modelos = tablas Postgres (`Curso`, `Noticia`, `SobreElCentro`, etc.). `prisma/seed.ts:60` inserta datos iniciales. En NoSQL guardás JSON libre; en SQL definís tabla primero y luego `npx prisma generate` + `migrate`.

### 3. Requerimiento Joaquín (22/9 18:50-18:52)
- Banner azul editable (texto + imagen), logo editable, footer editable (debajo de "cfl 401 azul" y "contactos"), sección Contacto funcional y editable desde panel.

### 4. Implementación (solo en sofia-athos, commit 309560d feat(sofia-athos))
- `prisma/schema.prisma` -> `model SiteConfig` (20 campos banner/logo/footer/contacto)
- `prisma/seed.ts` -> upsert SiteConfig id=1 con valores hardcodeados actuales
- `src/lib/auth/autorizacion.ts:22` -> `SITE_CONFIG_EDITAR` solo para Administrador (Director) y Preceptor, nueva sección `configuracion`
- `src/lib/siteConfig.ts` + `src/app/api/site-config/route.ts` (GET/PUT) + `src/app/api/contacto/route.ts` (POST)
- `src/app/panel/configuracion/page.tsx` + `src/components/panel/SiteConfigForm.tsx` (4 fieldsets)
- `src/app/page.tsx:14` banner con `bannerImagenUrl` como background, `SiteHeader.tsx:1` logoUrl, `SiteFooter.tsx:1` footer editable, `src/app/contacto/page.tsx` + `ContactoForm.tsx`
- `docs/CAMBIOS-SOFIA-ATHOS-CONFIGURACION.md` -> problema, solución, cómo verlo

### 5. Cómo verlo aunque no esté en main
```powershell
pwd # debe ser C:\Users\sofia\OneDrive\Documentos\GitHub\Pagina-web-cfl401
npm install
npx prisma generate
Copy-Item .env.example .env  # si no existe .env
docker compose up -d  # requiere Docker Desktop Running
npx prisma migrate dev --name add_site_config
npm run db:seed
npm run dev
# http://localhost:3000  http://localhost:3000/contacto  http://localhost:3000/panel/configuracion (admin@cfl401.edu.ar / Admin123!)
```
- En GitHub: `https://github.com/JoaCo314/Pagina-web-cfl401/tree/sofia-athos` (1 commit ahead de main). `main` sigue en 5b2f62c.

### 6. Panel y autorizaciones
- No se tocó lo existente. Roles: Administrador (=Director) nivel 3, Preceptor 2, Docente 1 en `prisma/schema.prisma:14` y `autorizacion.ts:36`. Claves en `seed.ts:11` intactas. Solo se agregó permiso `site_config:editar` para Admin/Preceptor.

### 7. Diff
- `git diff 5b2f62c..309560d --stat` -> 15 archivos, 593 inserciones. `autorizacion.ts` diff muestra solo `+ SITE_CONFIG_EDITAR`.

### 8. GitHub como contenedor
- Repo = guarda archivos con historial (commits). Estar en repo no ejecuta nada; solo corre lo importado en `src/`. `assets/` viejo y `contacto.html` no afectan a Next mientras no se importen. Branches = líneas paralelas; GitHub no corre app, solo guarda.

## Archivos de referencia
- `C:\Users\sofia\OneDrive\Documentos\GitHub\Pagina-web-cfl401\docs\CAMBIOS-SOFIA-ATHOS-CONFIGURACION.md`
- `C:\Users\sofia\OneDrive\Documentos\BACKUP-sofia-athos-README.txt`
- `.git/refs/heads/sofia-athos-backup-commits-antiguos` -> f73d01b

> Esta conversación queda guardada en `docs/CONVERSACION-SOFIA-2026-09-23.md` en tu branch `sofia-athos` para releerla.
