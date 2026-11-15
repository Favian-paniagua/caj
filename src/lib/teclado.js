import { useEffect, useRef } from "react";

/**
 * Lector de códigos de barras USB: funciona como un teclado (escribe el código y presiona Enter).
 * Este hook manda lo que se escriba al buscador aunque el cursor esté en otro lado
 * (por ejemplo, después de hacer clic en el carrito), para que ninguna lectura se pierda.
 */
const esEditable = (el) =>
  !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

export const hayVentanaAbierta = () => !!document.querySelector(".ov.on");

export function useEnfocarAlEscribir(ref, activo = true) {
  useEffect(() => {
    if (!activo) return;
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      if (esEditable(e.target) || hayVentanaAbierta()) return;
      ref.current?.focus();   // la tecla cae en el buscador
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [ref, activo]);
}

/** Atajos de teclado globales (F2, F12, etc.). mapa: { F12: fn, ... }. Se ignoran con una ventana abierta. */
export function useAtajos(mapa, activo = true) {
  const r = useRef(mapa);
  r.current = mapa;
  useEffect(() => {
    if (!activo) return;
    const onKey = (e) => {
      const f = r.current[e.key];
      if (!f || hayVentanaAbierta()) return;
      e.preventDefault();
      f(e);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activo]);
}
