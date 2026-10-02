import type { NextRequest } from "next/server";

/// Limitador de intentos en memoria, compartido por los endpoints sensibles
/// (login y cambio de contraseña propia).
///
/// Modelo: se cuentan los **intentos fallidos** por identidad y, opcionalmente,
/// por IP. Al alcanzar el máximo la clave queda bloqueada durante `duracionMs` y
/// se responde 429 con los segundos restantes. Un acierto limpia el contador.
///
/// Límite conocido: el estado vive en el proceso. Con una sola instancia (el
/// despliegue de este proyecto) alcanza; con varias réplicas detrás de un balance
/// cada una contaría por separado y el bloqueo sería laxo. Si alguna vez se
/// escala horizontalmente hay que mover estos contadores a la base o a Redis.

type Intentos = { fallidos: number; bloqueadoHasta: number | null };

export type OpcionesLimitador = {
  /// Intentos fallidos tolerados por identidad antes de bloquear.
  maxIntentos: number;
  /// Intentos fallidos tolerados por IP (anti password spraying).
  maxIntentosPorIp?: number;
  /// Duración del bloqueo una vez alcanzado el máximo.
  duracionMs: number;
  /// `false` cuenta solo los intentos fallidos (lo que necesita el login, donde
  /// acertar no debe gastar presupuesto). `true` cuenta cada request, incluso
  /// los válidos: es lo que necesita un formulario público, donde el objetivo
  /// es frenar el volumen total y no los errores.
  contarAciertos?: boolean;
};

export type EstadoLimite = {
  permitido: boolean;
  /// Cuántos intentos fallidos quedan antes del bloqueo.
  restantes: number;
  /// Segundos hasta que se libere el bloqueo (0 si no está bloqueado).
  esperaSegundos: number;
};

export function crearLimitador({
  maxIntentos,
  maxIntentosPorIp,
  duracionMs,
  contarAciertos = false,
}: OpcionesLimitador) {
  const porIdentidad = new Map<string, Intentos>();
  const porIp = new Map<string, Intentos>();

  function leer(mapa: Map<string, Intentos>, clave: string): Intentos {
    const registro = mapa.get(clave);
    if (!registro) return { fallidos: 0, bloqueadoHasta: null };
    if (registro.bloqueadoHasta !== null && Date.now() >= registro.bloqueadoHasta) {
      mapa.delete(clave);
      return { fallidos: 0, bloqueadoHasta: null };
    }
    return registro;
  }

  function sumarFallo(
    mapa: Map<string, Intentos>,
    clave: string,
    maximo: number
  ): void {
    const actual = leer(mapa, clave);
    const fallidos = actual.fallidos + 1;
    mapa.set(clave, {
      fallidos: fallidos >= maximo ? 0 : fallidos,
      bloqueadoHasta: fallidos >= maximo ? Date.now() + duracionMs : null,
    });
  }

  function estado(mapa: Map<string, Intentos>, clave: string, maximo: number): EstadoLimite {
    const registro = leer(mapa, clave);
    if (registro.bloqueadoHasta !== null) {
      return {
        permitido: false,
        restantes: 0,
        esperaSegundos: Math.max(
          1,
          Math.ceil((registro.bloqueadoHasta - Date.now()) / 1000)
        ),
      };
    }
    return {
      permitido: true,
      restantes: Math.max(0, maximo - registro.fallidos),
      esperaSegundos: 0,
    };
  }

  return {
    /// `ip` es opcional: solo se usa si el limitador fue creado con
    /// `maxIntentosPorIp`.
    chequear(identidad: string, ip?: string): EstadoLimite {
      const porCuenta = estado(porIdentidad, identidad, maxIntentos);
      if (!porCuenta.permitido) return porCuenta;
      const porDireccion =
        maxIntentosPorIp !== undefined && ip !== undefined
          ? estado(porIp, ip, maxIntentosPorIp)
          : porCuenta;
      if (!porDireccion.permitido) return porDireccion;

      // Se consume presupuesto recién cuando el request pasa el chequeo, así un
      // request ya bloqueado no reinicia la ventana ni suma al contador.
      if (contarAciertos) {
        sumarFallo(porIdentidad, identidad, maxIntentos);
        if (maxIntentosPorIp !== undefined && ip !== undefined) {
          sumarFallo(porIp, ip, maxIntentosPorIp);
        }
      }
      return porCuenta;
    },
    registrarFallo(identidad: string, ip?: string): void {
      sumarFallo(porIdentidad, identidad, maxIntentos);
      if (maxIntentosPorIp !== undefined && ip !== undefined) {
        sumarFallo(porIp, ip, maxIntentosPorIp);
      }
    },
    limpiar(identidad: string, ip?: string): void {
      porIdentidad.delete(identidad);
      if (ip !== undefined) porIp.delete(ip);
    },
  };
}

/// IP de origen para los contadores. Solo es confiable si la app corre detrás de
/// un proxy propio: los headers `x-forwarded-for` / `x-real-ip` los puede
/// mandar cualquiera si la app está expuesta directamente. Por eso son
/// configurables con `TRUST_PROXY` (ver README): en `false` no se usan y todos
/// los clientes comparten el contador por IP, que igual frena el spraying desde
/// una única fuente pero no desde varias.
export function ipCliente(request: NextRequest): string {
  const confiable = process.env.TRUST_PROXY === "true";
  if (!confiable) return "sin-proxy-confiable";
  const forward = request.headers.get("x-forwarded-for");
  if (forward) return forward.split(",")[0]?.trim() || "sin-proxy";
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim() || "sin-proxy";
  return "sin-proxy";
}
