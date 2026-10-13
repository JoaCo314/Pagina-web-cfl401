import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verificarTokenSesion } from "@/lib/auth/token";

/// Defensa en profundidad para el panel: rechaza en el borde cualquier request
/// a /panel sin una cookie de sesión firmada y vigente, antes de renderizar la
/// página. Las páginas siguen haciendo su propia verificación con `getCurrentUser`
/// (que además comprueba que la cuenta esté activa y la versión de sesión); esto
/// evita que una ruta nueva quede expuesta por olvidarse del guard.
///
/// La firma del JWT se valida acá (con jose, que corre en el runtime de Node.js
/// del Proxy); no se consulta la base, así que un token vencido o con una
/// versión vieja lo detecta igual la capa de la página.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // La pantalla de acceso es pública.
  if (pathname === "/panel/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const sesion = token ? await verificarTokenSesion(token) : null;

  if (!sesion) {
    const url = request.nextUrl.clone();
    url.pathname = "/panel/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*"],
};
