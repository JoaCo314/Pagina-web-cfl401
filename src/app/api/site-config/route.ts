// Creado por sofia-athos - API editable para banner, logo, footer y contactos
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import {
  getSiteConfig,
  normalizarUrlMapa,
  upsertSiteConfig,
} from "@/lib/siteConfig";
import { borrarImagenPorUrl, validarImagenUrl } from "@/lib/imagenes";

export const dynamic = "force-dynamic";

const CAMPOS_PERMITIDOS = [
  "bannerPill",
  "bannerTitulo",
  "bannerSubtitulo",
  "bannerImagenUrl",
  "logoUrl",
  "logoAlt",
  "footerCflTitulo",
  "footerCflTexto",
  "footerContactosTitulo",
  "footerEmail",
  "footerTelefono",
  "footerDireccion",
  "footerHorarios",
  "footerCopy",
  "contactoTitulo",
  "contactoSubtitulo",
  "contactoEmail",
  "contactoTelefono",
  "contactoDireccion",
  "contactoHorarios",
  "contactoFormDestinatario",
  "mapaUrl",
  "mapaTitulo",
  "mapaSubtitulo",
] as const;

/// Límite máximo de caracteres por campo de texto (evita payloads gigantes y
/// textos que rompan el layout). Banner/logo e imágenes se validan aparte.
const LIMITES_CAMPO: Record<string, number> = {
  bannerPill: 80,
  bannerTitulo: 200,
  bannerSubtitulo: 300,
  logoAlt: 200,
  footerCflTitulo: 100,
  footerCflTexto: 600,
  footerContactosTitulo: 100,
  footerEmail: 200,
  footerTelefono: 60,
  footerDireccion: 200,
  footerHorarios: 300,
  footerCopy: 200,
  contactoTitulo: 200,
  contactoSubtitulo: 300,
  contactoEmail: 200,
  contactoTelefono: 60,
  contactoDireccion: 200,
  contactoHorarios: 300,
  contactoFormDestinatario: 200,
  mapaTitulo: 200,
  mapaSubtitulo: 300,
};

export async function GET() {
  try {
    const config = await getSiteConfig();
    return NextResponse.json({ config });
  } catch (err) {
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!tienePermiso(user, PERMISOS.SITE_CONFIG_EDITAR)) {
    return NextResponse.json({ error: "No tenés permiso para realizar esta acción." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida: se esperaba un JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Formato inválido." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  for (const key of CAMPOS_PERMITIDOS) {
    if (key in (body as Record<string, unknown>)) {
      const val = (body as Record<string, unknown>)[key];
      if (val !== null && typeof val !== "string") {
        return NextResponse.json({ error: `Campo ${key} debe ser texto o null.` }, { status: 400 });
      }
      const limite = LIMITES_CAMPO[key];
      if (typeof val === "string" && limite !== undefined && val.length > limite) {
        return NextResponse.json(
          { error: `El campo ${key} no puede superar ${limite} caracteres.` },
          { status: 400 }
        );
      }
      data[key] = val === "" ? null : val;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No se enviaron campos para actualizar." }, { status: 400 });
  }

  // El mapa de la portada debe ser un iframe o una URL http(s) (nunca
  // javascript:, data:, etc.), porque se inyecta como atributo src de un iframe.
  if ("mapaUrl" in data) {
    const mapa = normalizarUrlMapa(data.mapaUrl);
    if (mapa.error) {
      return NextResponse.json({ error: mapa.error }, { status: 400 });
    }
    data["mapaUrl"] = mapa.valor;
  }

  // El banner y el logo se inyectan como background-image / <img src>, así que
  // solo se aceptan imágenes administradas o URLs http(s), nunca otros esquemas.
  for (const campo of ["bannerImagenUrl", "logoUrl"]) {
    if (campo in data) {
      const imagen = validarImagenUrl(data[campo]);
      if (imagen.error) {
        return NextResponse.json({ error: imagen.error }, { status: 400 });
      }
      data[campo] = imagen.valor;
    }
  }

  try {
    const antes = await getSiteConfig();
    const config = await upsertSiteConfig(data);
    // Limpieza de mejor esfuerzo: si el banner o el logo apuntaban a una imagen
    // administrada y se reemplazaron (o quitaron), se borra la fila anterior.
    if (config.bannerImagenUrl !== antes.bannerImagenUrl) {
      await borrarImagenPorUrl(antes.bannerImagenUrl);
    }
    if (config.logoUrl !== antes.logoUrl) {
      await borrarImagenPorUrl(antes.logoUrl);
    }
    return NextResponse.json({ config });
  } catch (err) {
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}
