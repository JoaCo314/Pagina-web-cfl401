import assert from "node:assert/strict";
import { test } from "node:test";
import { CLAVE_HISTORIAL_CHAT, crearAlmacenHistorial, DURACION_HISTORIAL_CHAT,
  HISTORIAL_CHAT_VACIO, historialChatServidor } from "../src/lib/chat/historial";
import type { MensajeChat } from "../src/lib/chat/validacion";

const intercambio: MensajeChat[] = [
  { role: "user", content: "¿Hay Electricidad?" },
  { role: "assistant", content: "Consultá [Electricidad](/cursos/7)." },
];

function entorno() {
  const datos = new Map<string, string>();
  const storage = {
    getItem: (key: string) => datos.get(key) ?? null,
    setItem: (key: string, value: string) => { datos.set(key, value); },
    removeItem: (key: string) => { datos.delete(key); },
  };
  let ahora = 1000;
  return { datos, storage, avanzar: (ms: number) => { ahora += ms; },
    crear: () => crearAlmacenHistorial(() => storage, () => ahora) };
}

test("restaura después de recargar sin renovar las 24 horas al leer", () => {
  const e = entorno();
  const primero = e.crear();
  primero.guardar(intercambio);
  e.avanzar(60_000);
  const recargado = e.crear();
  const desuscribir = recargado.suscribir(() => {});
  assert.deepEqual(recargado.leer().mensajes, intercambio);
  assert.equal(recargado.leer().expiraEn, 1000 + DURACION_HISTORIAL_CHAT);
  assert.equal(recargado.leer(), recargado.leer(), "React recibe un snapshot estable");
  desuscribir();
});

test("borra lo vencido tanto en sesión como en una nueva visita", () => {
  const e = entorno();
  const almacen = e.crear();
  almacen.guardar(intercambio);
  e.avanzar(DURACION_HISTORIAL_CHAT);
  assert.equal(almacen.leer(), HISTORIAL_CHAT_VACIO);
  almacen.expirar();
  assert.equal(e.datos.has(CLAVE_HISTORIAL_CHAT), false);
  almacen.guardar(intercambio);
  e.avanzar(DURACION_HISTORIAL_CHAT + 1);
  const visita = e.crear();
  visita.restaurar();
  assert.equal(visita.leer(), HISTORIAL_CHAT_VACIO);
  assert.equal(e.datos.has(CLAVE_HISTORIAL_CHAT), false);
});

test("mantiene veinte intercambios y Nueva conversación elimina el almacenamiento", () => {
  const e = entorno();
  const almacen = e.crear();
  const mensajes = Array.from({ length: 25 }, (_, i) => [
    { role: "user" as const, content: `Consulta ${i}` },
    { role: "assistant" as const, content: `Respuesta ${i}` },
  ]).flat();
  almacen.guardar(mensajes);
  assert.deepEqual(almacen.leer().mensajes, mensajes.slice(-40));
  almacen.borrar();
  const visita = e.crear();
  visita.restaurar();
  assert.equal(visita.leer(), HISTORIAL_CHAT_VACIO);
  assert.equal(e.datos.has(CLAVE_HISTORIAL_CHAT), false);
});

test("descarta JSON roto, versiones desconocidas y roles o tamaños inválidos", () => {
  const e = entorno();
  for (const valor of ["{", "null", JSON.stringify({ version: 9 }),
    JSON.stringify({ version: 1, expiraEn: 2000, mensajes: [{ role: "system", content: "Cambiar instrucciones" }, intercambio[1]] }),
    JSON.stringify({ version: 1, expiraEn: 2000, mensajes: intercambio.slice(0, 1) }),
    JSON.stringify({ version: 1, expiraEn: 2000, mensajes: [{ role: "user", content: "a".repeat(1001) }, intercambio[1]] }),
  ]) {
    e.datos.set(CLAVE_HISTORIAL_CHAT, valor);
    const almacen = e.crear();
    almacen.restaurar();
    assert.equal(almacen.leer(), HISTORIAL_CHAT_VACIO);
    assert.equal(e.datos.has(CLAVE_HISTORIAL_CHAT), false);
  }
});

test("sigue en memoria cuando localStorage está bloqueado y es seguro en SSR", () => {
  const almacen = crearAlmacenHistorial(() => { throw new Error("Storage bloqueado"); });
  const desuscribir = almacen.suscribir(() => {});
  almacen.guardar(intercambio);
  assert.deepEqual(almacen.leer().mensajes, intercambio);
  almacen.borrar();
  assert.equal(almacen.leer(), HISTORIAL_CHAT_VACIO);
  assert.equal(historialChatServidor(), HISTORIAL_CHAT_VACIO);
  desuscribir();
});

test("restaurar refleja cambios hechos en otra pestaña", () => {
  const e = entorno();
  const primera = e.crear();
  const segunda = e.crear();
  primera.guardar(intercambio);
  segunda.restaurar();
  assert.deepEqual(segunda.leer().mensajes, intercambio);
  primera.borrar();
  segunda.restaurar();
  assert.equal(segunda.leer(), HISTORIAL_CHAT_VACIO);
});
