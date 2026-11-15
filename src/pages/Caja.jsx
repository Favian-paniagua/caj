import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/database";
import { buscarPorCodigo, registrarVenta, aperturaActual, abrirCaja, ventasDelTurno } from "../db/repositorio";
import { dinero, dineroCorto, aNumero } from "../lib/formato";
import { useAvisos } from "../components/Avisos";
import Cobro from "../components/Cobro";
import BuscadorProducto from "../components/BuscadorProducto";
import ProductoForm from "../components/ProductoForm";
import { LockKeyholeOpen, Minus, Plus, Printer, ScanBarcode, ShoppingCart, Trash2, X } from "lucide-react";
import { EsqueletoCaja } from "../components/Esqueletos";
import MiniaturaProducto from "../components/MiniaturaProducto";
import { useAtajos, useEnfocarAlEscribir } from "../lib/teclado";
import { pitido } from "../lib/sonido";
import { imprimirRecibo, numeroVenta } from "../lib/recibo";
import { useConfig } from "../lib/config";
import { METODOS } from "../lib/estadisticas";

const Tecla = ({ children }) => <kbd className="kbd">{children}</kbd>;

/** Tabla del carrito: producto, precio, cantidad (− +), importe y quitar. Clic en una fila la selecciona. */
function TablaCarrito({ carrito, seleccion, setSeleccion, cambiarCantidad, quitar, porId }) {
  const filaSel = useRef(null);
  useEffect(() => { filaSel.current?.scrollIntoView({ block: "nearest" }); }, [seleccion]);

  if (!carrito.length) {
    return (
      <div className="empty pos-vacio">
        <div className="ico"><ShoppingCart size={40} strokeWidth={1.4} /></div>
        <b>Pasa el lector por el código de barras</b>
        <span>o escribe el nombre del producto. Los productos aparecerán aquí.</span>
      </div>
    );
  }
  return (
    <table className="pos-tabla">
      <thead>
        <tr><th>Producto</th><th className="d">P. unit.</th><th className="c">Cantidad</th><th className="d">Importe</th><th aria-label="Quitar" /></tr>
      </thead>
      <tbody>
        {carrito.map((i) => {
          const sel = i.productoId === seleccion;
          return (
            <tr key={i.productoId + "-" + (i.flash || 0)} ref={sel ? filaSel : null} className={(sel ? "sel " : "") + (i.flash ? "flash" : "")} onClick={() => setSeleccion(i.productoId)}>
              <td>
                <div className="pos-prod">
                  <MiniaturaProducto producto={porId?.get(i.productoId) || i} tam={36} />
                  <div><div className="ci-name">{i.nombre}</div><div className="sub num">{i.codigo}</div></div>
                </div>
              </td>
              <td className="d num">{dinero(i.precio)}</td>
              <td className="c">
                <div className="qty">
                  <button tabIndex={-1} aria-label={"Menos " + i.nombre} onClick={(e) => { e.stopPropagation(); cambiarCantidad(i.productoId, -1); }}><Minus size={15} /></button>
                  <span className="num">{i.cantidad}</span>
                  <button tabIndex={-1} aria-label={"Más " + i.nombre} onClick={(e) => { e.stopPropagation(); cambiarCantidad(i.productoId, 1); }}><Plus size={15} /></button>
                </div>
              </td>
              <td className="d num neg">{dinero(i.precio * i.cantidad)}</td>
              <td className="c">
                <button tabIndex={-1} className="btn ghost icon quitar" aria-label={"Quitar " + i.nombre} onClick={(e) => { e.stopPropagation(); quitar(i.productoId); }}><X size={16} /></button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Recuadro de apertura de caja: registra con cuánto efectivo se empieza el turno. */
function AperturaCaja({ onAbierta }) {
  const { avisar } = useAvisos();
  const [monto, setMonto] = useState("");
  const [abriendo, setAbriendo] = useState(false);

  async function abrir(e) {
    e.preventDefault();
    if (monto.trim() === "" || aNumero(monto) < 0) return avisar("Escribe con cuánto efectivo empiezas (puede ser 0).", 2600);
    setAbriendo(true);
    try {
      const a = await abrirCaja(aNumero(monto));
      avisar(`Caja abierta con ${dinero(a.efectivoInicial)}`);
      onAbierta?.(a);
    } catch (err) {
      avisar("No se pudo abrir la caja: " + err.message, 4000);
      setAbriendo(false);
    }
  }

  return (
    <form className="card pad apertura" onSubmit={abrir} noValidate>
      <div className="apertura-ico"><LockKeyholeOpen size={30} strokeWidth={1.8} /></div>
      <h2 style={{ margin: 0, fontSize: 20 }}>Apertura de caja</h2>
      <p className="sub" style={{ margin: 0 }}>
        Antes de vender, registra con cuánto efectivo (billetes y monedas) empiezas. Así, al cerrar,
        sabrás cuánto debería haber en la caja.
      </p>
      <label className="l" htmlFor="efectivoInicial" style={{ alignSelf: "stretch", textAlign: "left", marginTop: 6 }}>Efectivo inicial (Bs)</label>
      <input className="f num apertura-input" id="efectivoInicial" inputMode="decimal" placeholder="0,00" autoFocus
        value={monto} onChange={(e) => setMonto(e.target.value)} />
      <div className="quick" style={{ justifyContent: "center", marginTop: 0 }}>
        {[0, 50, 100, 200, 500].map((v) => (
          <button type="button" key={v} onClick={() => setMonto(String(v))}>{v === 0 ? "Sin efectivo" : dineroCorto(v)}</button>
        ))}
      </div>
      <button type="submit" className="btn primary big" style={{ alignSelf: "stretch" }} disabled={abriendo}>
        {abriendo ? <span className="spin" /> : <>Abrir caja <Tecla>Enter</Tecla></>}
      </button>
    </form>
  );
}

/** Pantalla de venta para computadora: lector USB + teclado, carrito en tabla y cobro con recibo impreso. */
export default function Caja({ carrito, setCarrito }) {
  const { avisar, confirmar } = useAvisos();
  const config = useConfig();
  const productos = useLiveQuery(() => db.productos.toArray(), [], []);
  const porId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);
  const turno = useLiveQuery(async () => {
    const apertura = await aperturaActual();
    return { apertura, ventas: apertura ? await ventasDelTurno(apertura) : [] };
  }, [], null);

  const buscador = useRef(null);
  const [seleccion, setSeleccion] = useState(null);
  const [aviso, setAviso] = useState(null);           // resultado de la última lectura
  const [cobrando, setCobrando] = useState(false);
  const [registrar, setRegistrar] = useState(null);   // código no registrado → formulario
  const [ultima, setUltima] = useState(null);         // última venta (para reimprimir)

  const apertura = turno?.apertura;
  const abierta = !!apertura;
  const libre = abierta && !cobrando && !registrar;   // sin ventanas abiertas

  // El lector USB escribe aunque el cursor esté en otro lado; al cerrar una ventana vuelve al buscador
  useEnfocarAlEscribir(buscador, libre);
  useEffect(() => { if (libre) buscador.current?.focus(); }, [libre]);

  const totales = useMemo(() => ({
    total: Math.round(carrito.reduce((a, i) => a + i.precio * i.cantidad, 0) * 100) / 100,
    unidades: carrito.reduce((a, i) => a + i.cantidad, 0),
  }), [carrito]);

  function agregar(p, cantidad = 1) {
    setCarrito((c) => {
      const i = c.findIndex((x) => x.productoId === p.id);
      const item = i >= 0 ? { ...c[i], cantidad: c[i].cantidad + cantidad }
        : { productoId: p.id, codigo: p.codigo, nombre: p.nombre, categoria: p.categoria, precio: p.precio, costo: p.costo || 0, cantidad };
      // el último producto leído queda arriba
      return [{ ...item, flash: Date.now() }, ...c.filter((x) => x.productoId !== p.id)];
    });
    setSeleccion(p.id);
    setAviso({ tipo: "ok", texto: `${cantidad > 1 ? cantidad + " × " : "+1 "}${p.nombre}`, monto: p.precio * cantidad, n: Date.now() });
  }

  async function porCodigo(codigo, cantidad = 1) {
    const p = await buscarPorCodigo(codigo);
    if (p) return agregar(p, cantidad);
    pitido(true);
    setAviso({ tipo: "error", texto: "Producto no registrado", codigo, n: Date.now() });
  }

  const cambiarCantidad = (id, delta) =>
    setCarrito((c) => c.map((x) => (x.productoId === id ? { ...x, cantidad: x.cantidad + delta, flash: 0 } : x)).filter((x) => x.cantidad > 0));
  const quitar = (id) => setCarrito((c) => c.filter((x) => x.productoId !== id));

  // Teclas con el buscador vacío: ↑ ↓ eligen fila, + − cambian la cantidad, Supr la quita
  function teclaSinTexto(e) {
    if (!carrito.length) return;
    const idx = Math.max(0, carrito.findIndex((x) => x.productoId === seleccion));
    const mover = (k) => setSeleccion(carrito[Math.min(carrito.length - 1, Math.max(0, k))].productoId);
    const actual = carrito[idx]?.productoId;
    if (e.key === "ArrowDown") { e.preventDefault(); mover(seleccion == null ? 0 : idx + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); mover(idx - 1); }
    else if (e.key === "+") { e.preventDefault(); cambiarCantidad(actual, 1); }
    else if (e.key === "-") { e.preventDefault(); cambiarCantidad(actual, -1); }
    else if (e.key === "Delete") { e.preventDefault(); quitar(actual); setSeleccion(carrito[idx + 1]?.productoId ?? carrito[idx - 1]?.productoId ?? null); }
  }

  async function vaciar() {
    if (!carrito.length) return;
    if (await confirmar("¿Cancelar esta venta?", "Se quitarán todos los productos del carrito.", { boton: "Vaciar carrito", peligro: true })) {
      setCarrito([]); setAviso(null);
    }
  }

  async function reimprimir(v = ultima) {
    if (!v) return avisar("Todavía no hay ventas en este turno.");
    try { await imprimirRecibo(v, { copia: true }); }
    catch (e) { avisar("No se pudo imprimir: " + e.message, 4000); }
  }

  useAtajos({
    F2: () => buscador.current?.focus(),
    F4: vaciar,
    F9: () => reimprimir(),
    F12: () => carrito.length && setCobrando(true),
  }, libre);

  async function confirmarVenta(metodo, recibido, imprimir) {
    try {
      const v = await registrarVenta(carrito, metodo, recibido);
      setCarrito([]); setCobrando(false); setUltima(v); setAviso(null); setSeleccion(null);
      avisar(`Venta N.º ${numeroVenta(v.id)} · ${dinero(v.total)}${v.cambio > 0 ? ` · Cambio ${dinero(v.cambio)}` : ""}`, 3500);
      if (imprimir) imprimirRecibo(v).catch((e) => avisar("La venta se guardó, pero no se pudo imprimir: " + e.message, 4500));
    } catch (e) {
      avisar("No se pudo guardar la venta: " + e.message, 4000);
      throw e;
    }
  }

  // La última venta del turno (también después de recargar la página)
  const ultimaVenta = ultima || (turno?.ventas || []).reduce((a, v) => (!a || v.ts > a.ts ? v : a), null);
  const vendido = (turno?.ventas || []).reduce((a, v) => a + v.total, 0);

  if (!turno) return <EsqueletoCaja />;
  if (!abierta) return <section className="view on"><div className="caja-sola"><AperturaCaja /></div></section>;

  return (
    <section className="view on">
      <div className="pos">
        <div className="card pos-izq">
          <div className="pos-busca">
            <BuscadorProducto ref={buscador} productos={productos} alto={58} autoFocus className="pos-search"
              icono={<ScanBarcode size={22} />} placeholder="Escanea el código o escribe el nombre del producto…"
              onElegir={agregar} onCodigo={porCodigo} onTeclaSinTexto={teclaSinTexto} />
            {aviso && (
              <div key={aviso.n} className={"pos-aviso " + aviso.tipo} role="status">
                {aviso.tipo === "ok" ? (
                  <><span className="grow">{aviso.texto}</span><b className="num">{dinero(aviso.monto)}</b></>
                ) : (
                  <>
                    <span className="grow"><b>{aviso.texto}</b> · <span className="num">{aviso.codigo}</span></span>
                    <button className="btn" onClick={() => setRegistrar(aviso.codigo)}>Registrar producto</button>
                    <button className="btn ghost icon" aria-label="Cerrar aviso" onClick={() => setAviso(null)}><X size={16} /></button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="pos-lista">
            <TablaCarrito carrito={carrito} seleccion={seleccion} setSeleccion={setSeleccion}
              cambiarCantidad={cambiarCantidad} quitar={quitar} porId={porId} />
          </div>
          <div className="pos-ayuda sub">
            <span><Tecla>3*</Tecla> + código = 3 unidades</span>
            <span><Tecla>↑</Tecla><Tecla>↓</Tecla> elegir</span>
            <span><Tecla>+</Tecla><Tecla>−</Tecla> cantidad</span>
            <span><Tecla>Supr</Tecla> quitar</span>
            <span><Tecla>F2</Tecla> buscar</span>
          </div>
        </div>

        <div className="pos-der">
          <div className="card pad pos-total">
            <div className="sub">Total a cobrar</div>
            <div className="amt num">{dinero(totales.total)}</div>
            <div className="sub">{totales.unidades} {totales.unidades === 1 ? "artículo" : "artículos"} · {carrito.length} {carrito.length === 1 ? "producto" : "productos"}</div>
            <button className="btn primary big pos-cobrar" disabled={!carrito.length} onClick={() => setCobrando(true)}>
              Cobrar <Tecla>F12</Tecla>
            </button>
            <button className="btn" disabled={!carrito.length} onClick={vaciar}><Trash2 size={16} /> Cancelar venta <Tecla>F4</Tecla></button>
          </div>

          <div className="card pad">
            <h2 style={{ marginBottom: 8 }}>Última venta</h2>
            {ultimaVenta ? (
              <>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="num">N.º {numeroVenta(ultimaVenta.id)} · {new Date(ultimaVenta.ts).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}</span>
                  <b className="num">{dinero(ultimaVenta.total)}</b>
                </div>
                <div className="sub num" style={{ marginTop: 2 }}>
                  {METODOS[ultimaVenta.metodo]?.nombre}{ultimaVenta.metodo === "efectivo" ? ` · Cambio ${dinero(ultimaVenta.cambio)}` : ""}
                </div>
                <button className="btn mt" style={{ width: "100%" }} onClick={() => reimprimir(ultimaVenta)}><Printer size={16} /> Reimprimir recibo <Tecla>F9</Tecla></button>
              </>
            ) : <p className="sub" style={{ margin: 0 }}>Todavía no hay ventas en este turno.</p>}
          </div>

          <div className="card pad">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div><div className="sub">Vendido en este turno</div><div className="num" style={{ fontSize: 20, fontWeight: 700 }}>{dinero(vendido)}</div></div>
              <div style={{ textAlign: "right" }}><div className="sub">Ventas</div><div className="num" style={{ fontSize: 20, fontWeight: 700 }}>{turno.ventas.length}</div></div>
            </div>
            <p className="sub num" style={{ margin: "8px 0 0" }}>
              Caja abierta a las {new Date(apertura.ts).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })} con {dinero(apertura.efectivoInicial)}.
              {config.imprimirAuto ? " Recibo automático activado." : " Recibo automático desactivado."}
            </p>
          </div>
        </div>
      </div>

      {cobrando && <Cobro total={totales.total} unidades={totales.unidades} imprimirInicial={config.imprimirAuto}
        onCerrar={() => setCobrando(false)} onConfirmar={confirmarVenta} />}
      {registrar && (
        <ProductoForm producto={{ codigo: registrar }} titulo="Registrar producto" textoGuardar="Guardar y agregar"
          nota="Este código no está en el inventario. Completa los datos y se agregará a la venta."
          onCerrar={() => setRegistrar(null)}
          onGuardado={(p) => { agregar(p); avisar("Producto registrado"); }} />
      )}
    </section>
  );
}
