import { useSyncExternalStore } from "react";

/**
 * Configuración de esta computadora (datos del negocio para el recibo y la impresora).
 * Se guarda en el navegador (localStorage) de la computadora donde está la caja.
 */
const CLAVE = "caj-config";

export const CONFIG_INICIAL = {
  negocio: "Mi Caja",
  nit: "",
  direccion: "",
  telefono: "",
  mensaje: "¡Gracias por su compra!",
  papel: "80",            // ancho del rollo: "80" o "58" (mm)
  imprimirAuto: true,     // imprimir el recibo al confirmar cada venta
  imprimirCierre: true,   // imprimir el ticket del cierre de caja
};

let actual = leer();
const oyentes = new Set();

function leer() {
  try { return { ...CONFIG_INICIAL, ...JSON.parse(localStorage.getItem(CLAVE) || "{}") }; }
  catch { return { ...CONFIG_INICIAL }; }
}

export const leerConfig = () => actual;

export function guardarConfig(cambios) {
  actual = { ...actual, ...cambios };
  try { localStorage.setItem(CLAVE, JSON.stringify(actual)); } catch { /* sin almacenamiento */ }
  oyentes.forEach((f) => f());
}

function suscribir(f) {
  oyentes.add(f);
  const otraPestana = (e) => { if (e.key === CLAVE) { actual = leer(); f(); } };
  window.addEventListener("storage", otraPestana);
  return () => { oyentes.delete(f); window.removeEventListener("storage", otraPestana); };
}

/** Hook: devuelve la configuración y se actualiza cuando cambia. */
export const useConfig = () => useSyncExternalStore(suscribir, leerConfig);
