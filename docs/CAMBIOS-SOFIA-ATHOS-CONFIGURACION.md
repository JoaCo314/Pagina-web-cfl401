# Cambios — sofia-athos — Banner, Logo, Footer y Contacto

**Autora:** sofia-athos (ATHOS1995) — Rama `sofia-athos` — No mergeado a `main`  
**Fecha:** 2026-09-23 — Requerimiento Joaquín Vera [6:50-6:52 p.m., 22/9/2026]  
**Branch base:** `origin/main` en `5b2f62c` (Merge #25)

## Problema
1. **Banner azul front page** en `src/app/page.tsx:14` hardcodeado (`Capacitate en un oficio...` y `Preinscripción {anio}`), solo degradado en `src/app/globals.css:288`, sin imagen editable.
2. **Logo** en `src/components/SiteHeaderCliente.tsx:52` hardcodeado a `/cfl401azul_logo.jpg` (en `public/cfl401azul_logo.jpg`). En HTML viejo apunta a `/assets/` que no existe en Next.
3. **Footer** en `src/components/SiteFooter.tsx:8-50` hardcodeado (`CFL 401 Azul`, `cfl401azul@gmail.com`, `+54 2281...`, `href="#"` roto para Contacto).
4. **Contacto** no existe como ruta Next (`src/app/contacto` no existe), solo `contacto.html:118` estático con Formspree. No es funcional ni editable.
5. **Imágenes** mencionadas en `assets/` son de la maqueta HTML; en Next deben ir en `public/` o vía `Imagen` (`prisma/schema.prisma:89` y `/api/imagenes`).
6. Nada de lo anterior tiene modelo en `prisma/schema.prisma:47-193` ni permiso en `src/lib/auth/autorizacion.ts:4`, por lo que no es editable desde `src/app/panel/`.

## Solución (solo en `sofia-athos`, no en `main`)
### 1. Base de datos (SQL con Prisma)
- `prisma/schema.prisma` -> nuevo `model SiteConfig` (fila única id=1) con campos: `bannerPill`, `bannerTitulo`, `bannerSubtitulo`, `bannerImagenUrl`, `logoUrl`, `logoAlt`, `footerCflTitulo`, `footerCflTexto`, `footerContactosTitulo`, `footerEmail`, `footerTelefono`, `footerDireccion`, `footerHorarios`, `footerCopy`, `contactoTitulo`, `contactoSubtitulo`, `contactoEmail`, `contactoTelefono`, `contactoDireccion`, `contactoHorarios`, `contactoFormDestinatario`.
- `prisma/seed.ts` -> `upsert` de `siteConfig` id=1 con valores actuales hardcodeados como default.

> Nota NoSQL vs SQL: en Prisma definís la tabla primero en `schema.prisma` y Postgres exige esa estructura. Luego generás cliente con `npx prisma generate` y migrás con `npx prisma migrate dev --name add_site_config`.

### 2. Permisos y panel
- `src/lib/auth/autorizacion.ts` -> `PERMISOS.SITE_CONFIG_EDITAR` + agregado a `ADMINISTRADOR` y `PRECEPTOR`, y sección `configuracion` en `obtenerSeccionesPanel` (`src/lib/auth/autorizacion.ts:142`).
- `src/lib/siteConfig.ts` (nuevo) -> `getSiteConfig()` y `upsertSiteConfig()` con defaults.
- `src/app/api/site-config/route.ts` (nuevo) -> `GET` público, `PUT` protegido por `SITE_CONFIG_EDITAR`.
- `src/app/panel/configuracion/page.tsx` (nuevo) + `src/components/panel/SiteConfigForm.tsx` (nuevo) -> formulario con 4 fieldsets (Banner, Logo, Footer, Contacto), similar a `panel/sobre-el-centro:1` y `panel/guia`.

### 3. Frontend
- `src/app/page.tsx` -> ahora `async`, trae `config` y aplica `bannerPill`, `bannerTitulo`, `bannerSubtitulo` y `bannerImagenUrl` como `backgroundImage` si existe; fallback a valores viejos.
- `src/components/SiteHeader.tsx` -> trae `config` y pasa `logoUrl`/`logoAlt` a `SiteHeaderCliente.tsx`.
- `src/components/SiteHeaderCliente.tsx` -> `NAV_ITEMS` Contacto ahora `href: "/contacto"` (`:16`) y props `logoUrl`/`logoAlt`.
- `src/components/SiteFooter.tsx` -> ahora `async`, lee `config` para `footerCflTitulo`, `footerCflTexto`, `footerEmail`, etc., y `Link href="/contacto"` en vez de `href="#"`.
- `src/app/contacto/page.tsx` (nuevo) -> página `/contacto` con info de `config` y `ContactoForm`.
- `src/components/ContactoForm.tsx` (nuevo) -> formulario cliente que `POST /api/contacto`.
- `src/app/api/contacto/route.ts` (nuevo) -> valida `nombre`, `email`, `mensaje` y responde `ok:true` (log en servidor). En producción se enviaría email a `contactoFormDestinatario`.

## Archivos creados/modificados por sofia-athos
- Creados: `src/lib/siteConfig.ts`, `src/app/api/site-config/route.ts`, `src/app/api/contacto/route.ts`, `src/components/panel/SiteConfigForm.tsx`, `src/components/ContactoForm.tsx`, `src/app/contacto/page.tsx`, `src/app/panel/configuracion/page.tsx`, `docs/CAMBIOS-SOFIA-ATHOS-CONFIGURACION.md` (este archivo)
- Modificados: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/auth/autorizacion.ts`, `src/app/page.tsx`, `src/components/SiteHeader.tsx`, `src/components/SiteHeaderCliente.tsx`, `src/components/SiteFooter.tsx`

## Cómo ver los cambios (aunque no estén en `main`)
### En tu PC con VS Code (cinta celeste)
1. Abrí la carpeta `C:\Users\sofia\OneDrive\Documentos\GitHub\Pagina-web-cfl401` (abajo a la izquierda debe decir `sofia-athos`).
2. Si te dice `main`, clic ahí -> elegí `sofia-athos`.
3. En Terminal de VS Code (Ctrl+ñ):
   ```powershell
   npm install
   npx prisma generate
   npx prisma migrate dev --name add_site_config
   npm run dev
   ```
4. Abrí `http://localhost:3000` -> banner azul nuevo, logo desde config, footer editable.
5. `http://localhost:3000/contacto` -> sección contacto funcional.
6. `http://localhost:3000/panel` -> logueate con `admin@cfl401.edu.ar` / `Admin123!` -> nueva sección **Configuración del sitio** (Banner, Logo, Footer, Contacto). Guardá y recargá la home para ver cambios al instante.
7. Para comparar con `main`: cambiá abajo a la izquierda a `main` y recargá `localhost:3000` -> ves la versión vieja hardcodeada.

### En GitHub (gato negro)
- Tu branch: `https://github.com/JoaCo314/Pagina-web-cfl401/tree/sofia-athos` (no es `main`).
- El `main` sigue intacto en `https://github.com/JoaCo314/Pagina-web-cfl401/tree/main`.

### Backup
- Branch local `sofia-athos-backup-commits-antiguos` en `f73d01b` + archivo `C:\Users\sofia\OneDrive\Documentos\BACKUP-sofia-athos-README.txt` con el estado anterior a los cambios del 23/09.

## Próximos pasos opcionales
- Mover imágenes de `assets/` viejo a `public/` o subirlas vía `/panel/configuracion` como `/api/imagenes/<id>` (usar campo `bannerImagenUrl` y `logoUrl`).
- Si querés actualizar el remoto: `git push origin sofia-athos` (solo tu branch). Nunca `git push origin main`.
