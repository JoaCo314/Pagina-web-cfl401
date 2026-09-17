import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import {
  TAMANO_MAXIMO_IMAGEN,
  TIPOS_IMAGEN_PERMITIDOS,
  urlImagenInterna,
} from "@/lib/imagenes";

export const dynamic = "force-dynamic";

/// Subida de una imagen desde el panel (cursos y noticias). Recibe
/// `multipart/form-data` con el campo `archivo` y devuelve la URL interna con
/// la que se referencia la imagen. Administrador y Preceptor.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const puedeSubir =
    tienePermiso(user, PERMISOS.CURSOS_CREAR) ||
    tienePermiso(user, PERMISOS.NOTICIAS_CREAR);
  if (!puedeSubir) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida: se esperaba un formulario con el archivo." },
      { status: 400 }
    );
  }

  const archivo = form.get("archivo");
  if (!(archivo instanceof File)) {
    return NextResponse.json(
      { error: "Falta el archivo de imagen." },
      { status: 400 }
    );
  }

  if (
    !TIPOS_IMAGEN_PERMITIDOS.includes(
      archivo.type as (typeof TIPOS_IMAGEN_PERMITIDOS)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Formato no permitido. Se aceptan imágenes JPG, PNG, WEBP o GIF.",
      },
      { status: 400 }
    );
  }

  if (archivo.size === 0) {
    return NextResponse.json(
      { error: "El archivo de imagen está vacío." },
      { status: 400 }
    );
  }

  if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
    return NextResponse.json(
      { error: "La imagen no puede superar los 5 MB." },
      { status: 400 }
    );
  }

  try {
    const bytes = new Uint8Array(await archivo.arrayBuffer());

    const imagen = await prisma.imagen.create({
      data: {
        nombre: archivo.name.slice(0, 255),
        mimeType: archivo.type,
        tamano: archivo.size,
        datos: bytes,
      },
      select: { id: true, nombre: true, mimeType: true, tamano: true },
    });

    return NextResponse.json(
      { imagen: { ...imagen, url: urlImagenInterna(imagen.id) } },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
