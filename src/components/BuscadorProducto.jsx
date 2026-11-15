import { forwardRef, useMemo, useState } from "react";
import { dinero } from "../lib/formato";
import MiniaturaProducto from "./MiniaturaProducto";

/**
 * Campo para agregar productos con el lector de códigos USB o escribiendo su nombre o código.
 * - El lector escribe el código y presiona Enter: se agrega al instante.
 * - Mientras escribes un nombre aparecen sugerencias (flechas ↑ ↓ y Enter para elegir).
 * - "3*" antes del código o nombre agrega 3 unidades (ej. 3*7771234567890).
 * - Un código que no existe se envía a onCodigo (para avisar o registrarlo).
 * - onTeclaSinTexto(e): teclas pulsadas con el campo vacío (para manejar el carrito con el teclado).
 */
const BuscadorProducto = forwardRef(function BuscadorProducto(
  { productos, onElegir, onCodigo, onTeclaSinTexto, placeholder = "Nombre o código", className = "", alto = 56, autoFocus, icono },
  ref
) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(-1);
  const [enfocado, setEnfocado] = useState(false);

  // "3*coca" → cantidad 3, texto "coca"
  const { cantidad, texto } = useMemo(() => {
    const m = q.match(/^\s*(\d{1,3})\s*[*xX]\s*(.*)$/);
    return m && Number(m[1]) > 0 ? { cantidad: Number(m[1]), texto: m[2].trim() } : { cantidad: 1, texto: q.trim() };
  }, [q]);

  const sugerencias = useMemo(() => {
    const t = texto.toLowerCase();
    if (t.length < 2 || /^\d{6,}$/.test(t)) return [];   // un código largo no muestra sugerencias (es el lector)
    return productos.filter((p) => p.nombre.toLowerCase().includes(t) || String(p.codigo).includes(t)).slice(0, 8);
  }, [texto, productos]);

  const limpiar = () => { setQ(""); setSel(-1); };
  const elegir = (p) => { onElegir(p, cantidad); limpiar(); };

  function teclas(e) {
    if (!q && onTeclaSinTexto) { onTeclaSinTexto(e); if (e.defaultPrevented) return; }
    if (e.key === "ArrowDown" && sugerencias.length) { setSel((s) => Math.min(s + 1, sugerencias.length - 1)); e.preventDefault(); return; }
    if (e.key === "ArrowUp" && sugerencias.length) { setSel((s) => Math.max(s - 1, -1)); e.preventDefault(); return; }
    if (e.key === "Escape") { if (q) { e.stopPropagation(); limpiar(); } return; }
    if (e.key !== "Enter") return;
    e.preventDefault();
    const v = texto;
    if (!v) return;
    if (sel >= 0 && sugerencias[sel]) return elegir(sugerencias[sel]);
    const exacto = productos.find((p) => String(p.codigo) === v);
    if (exacto) return elegir(exacto);
    if (/^\d{4,}$/.test(v)) { onCodigo(v, cantidad); return limpiar(); }   // código desconocido
    if (sugerencias.length === 1) return elegir(sugerencias[0]);
    if (sugerencias.length > 1) { setSel(0); return; }
    onCodigo(v, cantidad); limpiar();
  }

  return (
    <div className={"search " + className}>
      {icono && <span className="search-ico" aria-hidden="true">{icono}</span>}
      <input ref={ref} className={"f" + (icono ? " con-ico" : "")} value={q} placeholder={placeholder} autoComplete="off" spellCheck={false}
        autoFocus={autoFocus} aria-label="Buscar producto por nombre o código" style={{ minHeight: alto }}
        onChange={(e) => { setQ(e.target.value); setSel(-1); }} onKeyDown={teclas}
        onFocus={() => setEnfocado(true)} onBlur={() => setTimeout(() => setEnfocado(false), 150)} />
      {cantidad > 1 && <span className="search-cant num" aria-live="polite">× {cantidad}</span>}
      {enfocado && sugerencias.length > 0 && (
        <div className="sugg" style={{ display: "block" }}>
          {sugerencias.map((p, i) => (
            <button key={p.id} className={i === sel ? "hl" : ""} onMouseDown={(e) => e.preventDefault()} onClick={() => elegir(p)}>
              <MiniaturaProducto producto={p} tam={34} />
              <span className="sug-nombre">{p.nombre}</span>
              <span className="sub num sug-cod">{p.codigo}</span>
              <span className="num sug-precio">{dinero(p.precio)}</span>
            </button>
          ))}
        </div>
      )}
      {enfocado && texto.length >= 2 && sugerencias.length === 0 && !/^\d{4,}$/.test(texto) && (
        <div className="sugg" style={{ display: "block" }}><div className="sub" style={{ padding: "11px 14px" }}>No hay productos con ese nombre.</div></div>
      )}
    </div>
  );
});

export default BuscadorProducto;
