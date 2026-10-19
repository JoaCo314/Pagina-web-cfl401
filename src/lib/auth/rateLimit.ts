// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/// Limitador de intentos compartido por los endpoints sensibles (login, cambio
/// de contraseña propia y formulario público de contacto).
///
/// Modelo: se cuentan los **intentos fallidos** por identidad y, opcionalmente,
/// por IP. Al alcanzar el máximo la clave queda bloqueada durante `duracionMs` y
/// se responde 429 con los segundos restantes. Un acierto limpia el contador.
///
/// El estado vive en la tabla `rate_limit_intentos`, no en memoria del proceso:
/// así el bloqueo se comparte entre réplicas y sobrevive a un reinicio. Cada
/// limitador usa un `nombre` distinto para que sus contadores no se mezclen.
///
/// Ante un error de base, el limpiador falla "abierto" (permite el intento) y lo
/// registra: un problema transitorio de la base no debe dejar afuera a todo el
/// mundo. El login y el contacto igual necesitan la base para funcionar.

type Registro = { fallidos: number; bloqueadoHasta: Date | null };

export type OpcionesLimitador = {
  /// Espacio de nombres del limitador (separa los contadores de cada endpoint).
  nombre: string;
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

/// Lee el registro vigente de una clave. Si el bloqueo ya venció, lo borra y
/// devuelve un contador limpio.
async function leer(ambito: string, clave: string): Promise<Registro> {
  const registro = await prisma.intentoRateLimit.findUnique({
    where: { ambito_clave: { ambito, clave } },
  });
  if (!registro) return { fallidos: 0, bloqueadoHasta: null };
  if (
    registro.bloqueadoHasta !== null &&
    registro.bloqueadoHasta.getTime() <= Date.now()
  ) {
    await prisma.intentoRateLimit.deleteMany({ where: { ambito, clave } });
    return { fallidos: 0, bloqueadoHasta: null };
  }
  return { fallidos: registro.fallidos, bloqueadoHasta: registro.bloqueadoHasta };
}

async function sumarFallo(
  ambito: string,
  clave: string,
  maximo: number,
  duracionMs: number
): Promise<boolean> {
  const actual = await leer(ambito, clave);
  const fallidos = actual.fallidos + 1;
  const bloquear = fallidos >= maximo;
  const datos = {
    fallidos: bloquear ? 0 : fallidos,
    bloqueadoHasta: bloquear ? new Date(Date.now() + duracionMs) : null,
  };
  await prisma.intentoRateLimit.upsert({
    where: { ambito_clave: { ambito, clave } },
    create: { ambito, clave, ...datos },
    update: datos,
  });
  return bloquear;
}

async function estado(
  ambito: string,
  clave: string,
  maximo: number
): Promise<EstadoLimite> {
  const registro = await leer(ambito, clave);
  if (registro.bloqueadoHasta !== null) {
    return {
      permitido: false,
      restantes: 0,
      esperaSegundos: Math.max(
        1,
        Math.ceil((registro.bloqueadoHasta.getTime() - Date.now()) / 1000)
      ),
    };
  }
  return {
    permitido: true,
    restantes: Math.max(0, maximo - registro.fallidos),
    esperaSegundos: 0,
  };
}

/// Borra de tanto en tanto los registros vencidos para que la tabla no crezca
/// sin límite (una clave que no se vuelve a consultar quedaría para siempre).
/// Es best-effort: un error de limpieza no debe afectar la operación.
let contadorLimpieza = 0;
async function limpiarVencidos(duracionMs: number): Promise<void> {
  contadorLimpieza += 1;
  if (contadorLimpieza % 50 !== 0) return;
  const antiguedad = new Date(Date.now() - Math.max(duracionMs, 60 * 60 * 1000));
  try {
    await prisma.intentoRateLimit.deleteMany({
      where: {
        OR: [
          { bloqueadoHasta: { lt: new Date() } },
          { bloqueadoHasta: null, updatedAt: { lt: antiguedad } },
        ],
      },
    });
  } catch {
    // La limpieza es de mejor esfuerzo.
  }
}

export function crearLimitador({
  nombre,
  maxIntentos,
  maxIntentosPorIp,
  duracionMs,
  contarAciertos = false,
}: OpcionesLimitador) {
  const ambitoCuenta = `${nombre}:cuenta`;
  const ambitoIp = `${nombre}:ip`;

  function usarIp(): boolean {
    return maxIntentosPorIp !== undefined;
  }

  return {
    /// `ip` es opcional: solo se usa si el limitador fue creado con
    /// `maxIntentosPorIp`.
    async chequear(identidad: string, ip?: string): Promise<EstadoLimite> {
      try {
        void limpiarVencidos(duracionMs);

        const porCuenta = await estado(ambitoCuenta, identidad, maxIntentos);
        if (!porCuenta.permitido) return porCuenta;

        if (usarIp()) {
          if (ip !== undefined) {
            const porDireccion = await estado(ambitoIp, ip, maxIntentosPorIp!);
            if (!porDireccion.permitido) return porDireccion;
          }
        }

        // Se consume presupuesto recién cuando el request pasa el chequeo, así un
        // request ya bloqueado no reinicia la ventana ni suma al contador.
        if (contarAciertos) {
          await sumarFallo(ambitoCuenta, identidad, maxIntentos, duracionMs);
          if (usarIp() && ip !== undefined) {
            await sumarFallo(ambitoIp, ip, maxIntentosPorIp!, duracionMs);
          }
        }
        return porCuenta;
      } catch (err) {
        // Falla abierto: un error de base no debe bloquear a usuarios legítimos.
        console.error("[rateLimit] No se pudo chequear el límite:", err);
        return { permitido: true, restantes: maxIntentos, esperaSegundos: 0 };
      }
    },
    /// Devuelve `bloqueoCuenta: true` cuando este fallo alcanzó el máximo para
    /// la identidad y el contador acaba de bloquearse. El login lo usa para
    /// aplicar el bloqueo permanente de la cuenta (no solo el temporal).
    async registrarFallo(
      identidad: string,
      ip?: string
    ): Promise<{ bloqueoCuenta: boolean }> {
      try {
        const bloqueoCuenta = await sumarFallo(
          ambitoCuenta,
          identidad,
          maxIntentos,
          duracionMs
        );
        if (usarIp() && ip !== undefined) {
          await sumarFallo(ambitoIp, ip, maxIntentosPorIp!, duracionMs);
        }
        return { bloqueoCuenta };
      } catch (err) {
        console.error("[rateLimit] No se pudo registrar el fallo:", err);
        return { bloqueoCuenta: false };
      }
    },
    async limpiar(identidad: string, ip?: string): Promise<void> {
      try {
        await prisma.intentoRateLimit.deleteMany({
          where: { ambito: ambitoCuenta, clave: identidad },
        });
        if (ip !== undefined) {
          await prisma.intentoRateLimit.deleteMany({
            where: { ambito: ambitoIp, clave: ip },
          });
        }
      } catch (err) {
        console.error("[rateLimit] No se pudo limpiar el contador:", err);
      }
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
