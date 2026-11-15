import { useMemo, useState } from "react";
import { useConfig, guardarConfig } from "../lib/config";
import { htmlRecibo, imprimirHtml, VENTA_EJEMPLO } from "../lib/recibo";
import { useAvisos } from "../components/Avisos";
import { Printer } from "lucide-react";

const CAMPOS = [
  { k: "negocio", l: "Nombre del negocio", ph: "Ej. Tienda Don Pepe" },
  { k: "nit", l: "NIT (opcional)", ph: "Ej. 1234567019" },
  { k: "direccion", l: "Dirección (opcional)", ph: "Ej. Av. Blanco Galindo #123" },
  { k: "telefono", l: "Teléfono (opcional)", ph: "Ej. 70012345" },
  { k: "mensaje", l: "Mensaje al pie del recibo", ph: "Ej. ¡Gracias por su compra!" },
];

/** Datos del negocio para el recibo, ancho del papel y opciones de impresión. */
export default function Configuracion() {
  const { avisar } = useAvisos();
  const config = useConfig();
  const [f, setF] = useState(config);
  const cambiado = CAMPOS.some(({ k }) => (f[k] ?? "") !== (config[k] ?? ""));

  // La vista previa usa los datos escritos (aunque todavía no se hayan guardado)
  const vista = useMemo(() => htmlRecibo({ ...VENTA_EJEMPLO, ts: Date.now() }, { ...config, ...f }), [f, config]);
  const anchoVista = config.papel === "58" ? 230 : 320;

  function guardar(e) {
    e.preventDefault();
    guardarConfig(Object.fromEntries(CAMPOS.map(({ k }) => [k, String(f[k] ?? "").trim()])));
    avisar("Datos del recibo guardados");
  }

  const opcion = (k, v) => { guardarConfig({ [k]: v }); setF((x) => ({ ...x, [k]: v })); };

  async function prueba() {
    try { await imprimirHtml(htmlRecibo({ ...VENTA_EJEMPLO, ts: Date.now() }, config)); }
    catch (e) { avisar("No se pudo imprimir: " + e.message, 4000); }
  }

  return (
    <section className="view on">
      <div className="config">
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <form className="card pad" onSubmit={guardar}>
            <h2>Datos del recibo</h2>
            <p className="sub" style={{ marginTop: -6 }}>Aparecen en la parte de arriba de cada recibo y en el ticket del cierre de caja.</p>
            {CAMPOS.map(({ k, l, ph }) => (
              <div key={k} className="mt">
                <label className="l" htmlFor={"cfg_" + k}>{l}</label>
                <input className="f" id={"cfg_" + k} value={f[k] ?? ""} placeholder={ph} maxLength={80}
                  onChange={(e) => setF({ ...f, [k]: e.target.value })} />
              </div>
            ))}
            <div className="acts" style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button type="submit" className="btn primary" disabled={!cambiado}>Guardar</button>
            </div>
          </form>

          <div className="card pad">
            <h2>Impresora de recibos</h2>
            <label className="l">Ancho del rollo de papel</label>
            <div className="seg seg2" style={{ maxWidth: 360 }}>
              <button className={config.papel === "80" ? "on" : ""} onClick={() => opcion("papel", "80")}>80 mm</button>
              <button className={config.papel === "58" ? "on" : ""} onClick={() => opcion("papel", "58")}>58 mm</button>
            </div>
            <label className="check mt2">
              <input type="checkbox" checked={!!config.imprimirAuto} onChange={(e) => opcion("imprimirAuto", e.target.checked)} />
              Imprimir el recibo automáticamente al confirmar cada venta
            </label>
            <label className="check mt">
              <input type="checkbox" checked={!!config.imprimirCierre} onChange={(e) => opcion("imprimirCierre", e.target.checked)} />
              Imprimir el ticket del cierre de caja
            </label>
            <button className="btn mt2" onClick={prueba}><Printer size={18} /> Imprimir recibo de prueba</button>

            <h2 className="mt2" style={{ marginBottom: 4 }}>Imprimir sin el cuadro de diálogo</h2>
            <p className="sub" style={{ margin: 0 }}>
              Normalmente el navegador muestra una ventana para elegir la impresora cada vez. Para que el recibo salga directo:
            </p>
            <ol className="pasos">
              <li>En Windows, pon la impresora de recibos como <b>impresora predeterminada</b> (Configuración → Impresoras).</li>
              <li>En sus preferencias, elige el papel del rollo (80 mm o 58 mm) y márgenes en 0.</li>
              <li>Crea un acceso directo de Google Chrome y agrégale al final del destino: <code className="c">--kiosk-printing</code></li>
              <li>Abre la caja siempre desde ese acceso directo.</li>
            </ol>
          </div>
        </div>

        <div className="card pad">
          <h2>Vista previa del recibo</h2>
          <div className="vista-recibo">
            <iframe title="Vista previa del recibo" srcDoc={vista} style={{ width: anchoVista, height: 560 }} />
          </div>
          <p className="sub" style={{ marginBottom: 0 }}>Ejemplo con datos de prueba. Así se verá cada recibo impreso.</p>
        </div>
      </div>
    </section>
  );
}
