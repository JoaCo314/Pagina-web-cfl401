// Creado por sofia-athos - API editable para banner, logo, footer y contactos
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import { getSiteConfig, upsertSiteConfig } from "@/lib/siteConfig";

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

export async function GET() {
  try {
    const config = await getSiteConfig();
    return NextResponse.json({ config });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
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
      data[key] = val === "" ? null : val;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No se enviaron campos para actualizar." }, { status: 400 });
  }

  try {
    const config = await upsertSiteConfig(data);
    return NextResponse.json({ config });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
