import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { dinero, dineroCorto, aNumero } from "../lib/formato";
import { METODOS } from "../lib/estadisticas";
import { Printer } from "lucide-react";

// Tecla para elegir cada forma de pago
const TECLAS = { efectivo: "E", qr: "Q", tarjeta: "T" };

/**
 * Ventana de cobro: forma de pago, monto recibido, cambio e impresión del recibo.
 * Teclado: E / Q / T forma de pago · Enter confirma · Esc cancela.
 */
export default function Cobro({ total, unidades, imprimirInicial = true, onCerrar, onConfirmar }) {
  const [metodo, setMetodo] = useState("efectivo");
  const [recibido, setRecibido] = useState("");
  const [imprimir, setImprimir] = useState(imprimirInicial);
  const [guardando, setGuardando] = useState(false);
  const campo = useRef(null);
  const boton = useRef(null);

  const rec = aNumero(recibido);
  const efectivo = metodo === "efectivo";
  const falta = efectivo && recibido !== "" && rec < total;
  const rapidos = [...new Set([total, Math.ceil(total / 10) * 10, ...[10, 20, 50, 100, 200].filter((d) => d >= total).slice(0, 3)])]
    .filter((v) => v >= total).slice(0, 4);

  // Con efectivo se escribe el monto; con QR o tarjeta basta Enter para confirmar
  useEffect(() => { (efectivo ? campo : boton).current?.focus(); }, [efectivo]);

  async function confirmar() {
    if (falta || guardando) return;
    setGuardando(true);
    try { await onConfirmar(metodo, efectivo && recibido !== "" ? rec : total, imprimir); }
    catch { setGuardando(false); }
  }

  function teclas(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const m = Object.keys(TECLAS).find((k) => TECLAS[k] === e.key.toUpperCase());
    if (m) { e.preventDefault(); setMetodo(m); return; }
    if (e.key === "Enter" && e.target.tagName !== "BUTTON") { e.preventDefault(); confirmar(); }
  }

  return (
    <Modal abierto arriba onCerrar={onCerrar} titulo="Cobrar">
      <div onKeyDown={teclas}>
        <div className="total-box" style={{ margin: "6px 0 16px" }}>
          <div className="amt num">{dinero(total)}</div>
          <div className="meta">{unidades} {unidades === 1 ? "artículo" : "artículos"}</div>
        </div>
        <label className="l">Forma de pago</label>
        <div className="seg">
          {Object.entries(METODOS).map(([id, m]) => (
            <button key={id} className={metodo === id ? "on" : ""} onClick={() => setMetodo(id)}>
              {m.nombre} <kbd className="kbd">{TECLAS[id]}</kbd>
            </button>
          ))}
        </div>
        {efectivo ? (
          <div className="mt2">
            <label className="l" htmlFor="recibido">Monto recibido <span className="sub" style={{ fontWeight: 400 }}>(vacío = monto exacto)</span></label>
            <input ref={campo} className="f num cobro-input" id="recibido" inputMode="decimal" placeholder={dinero(total).replace("Bs ", "")} autoFocus value={recibido}
              onChange={(e) => setRecibido(e.target.value.replace(/[^\d.,]/g, ""))} />
            <div className="quick">
              {rapidos.map((v) => (
                <button key={v} onClick={() => setRecibido(String(v).replace(".", ","))}>{v === total ? "Exacto" : dineroCorto(v)}</button>
              ))}
            </div>
            <div className="change">
              <span>Cambio</span>
              <b className="num">{recibido === "" ? dinero(0) : falta ? "Falta " + dinero(total - rec) : dinero(rec - total)}</b>
            </div>
          </div>
        ) : (
          <p className="sub mt2" style={{ marginBottom: 0 }}>Confirma cuando el pago por {METODOS[metodo].nombre} se haya recibido.</p>
        )}
        <label className="check mt2">
          <input type="checkbox" checked={imprimir} onChange={(e) => setImprimir(e.target.checked)} />
          <Printer size={16} /> Imprimir recibo
        </label>
        <div className="acts">
          <button className="btn" onClick={onCerrar}>Cancelar <kbd className="kbd">Esc</kbd></button>
          <button ref={boton} className="btn primary" onClick={confirmar} disabled={falta || guardando}>
            {guardando ? <><span className="spin" /> Guardando</> : <>Confirmar venta <kbd className="kbd">Enter</kbd></>}
          </button>
        </div>
      </div>
    </Modal>
  );
}
