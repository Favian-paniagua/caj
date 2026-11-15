import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/database";
import { CATEGORIAS, OTROS, categoriaDe } from "../lib/categorias";
import { dinero } from "../lib/formato";
import { useAvisos } from "../components/Avisos";
import ProductoForm from "../components/ProductoForm";
import { Package, PackagePlus, TriangleAlert } from "lucide-react";
import { EsqueletoFilasProductos, Sk } from "../components/Esqueletos";
import MiniaturaProducto from "../components/MiniaturaProducto";
import { useEnfocarAlEscribir } from "../lib/teclado";


/** Inventario: lista con filtro por categoría y búsqueda; alta y edición de productos. */
export default function Productos() {
  const { avisar } = useAvisos();
  const productos = useLiveQuery(() => db.productos.orderBy("nombre").toArray(), [], null);
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [editando, setEditando] = useState(null);   // {} = nuevo, {id…} = editar
  const busca = useRef(null);
  useEnfocarAlEscribir(busca, !editando);
  useEffect(() => { if (!editando) busca.current?.focus(); }, [editando]);

  // Con el lector USB: Enter con un código abre ese producto, o el formulario de alta si no existe
  function enterBuscar(e) {
    if (e.key !== "Enter") return;
    const v = q.trim();
    if (!v || !productos) return;
    const p = productos.find((x) => String(x.codigo) === v);
    if (p) { setEditando(p); setQ(""); }
    else if (/^\d{4,}$/.test(v)) { setEditando({ codigo: v }); setQ(""); }
  }

  // Todas las categorías fijas, con su cantidad de productos
  // Las categorías fijas con su cantidad; "Sin categoría" solo aparece si hay productos así
  const categorias = useMemo(() => {
    const cuenta = (c) => (productos || []).filter((p) => categoriaDe(p) === c).length;
    const lista = CATEGORIAS.map((c) => [c, cuenta(c)]);
    const sin = cuenta(OTROS);
    return sin ? [...lista, [OTROS, sin]] : lista;
  }, [productos]);
  const catFiltro = categoria;

  const lista = (productos || []).filter((p) => {
    const t = q.trim().toLowerCase();
    const okTexto = !t || p.nombre.toLowerCase().includes(t) || String(p.codigo).includes(t);
    return okTexto && (catFiltro === "todas" || categoriaDe(p) === catFiltro);
  });

  const fila = (p) => {
    const bajo = (p.stock || 0) <= (p.minimo || 0);
    return (
      <li key={p.id} onClick={() => setEditando(p)}>
        <MiniaturaProducto producto={p} />
        <div className="pi-nombre">{p.nombre}</div>
        <b className="num pi-precio">{dinero(p.precio)}</b>
        <div className="sub num">{p.costo ? `Costo ${dinero(p.costo)}` : ""}</div>
        <span className={"badge pi-stock" + (bajo ? " low" : "")}>{bajo && <TriangleAlert size={12} strokeWidth={2.4} />}{p.stock || 0} u</span>
      </li>
    );
  };

  return (
    <section className="view on">
      <div className="barra-productos">
        <input ref={busca} className="f" placeholder="Buscar por nombre o pasar el lector…" value={q} autoFocus autoComplete="off"
          onChange={(e) => setQ(e.target.value)} onKeyDown={enterBuscar} aria-label="Buscar producto" />
        <button className="btn primary" onClick={() => setEditando({})} aria-label="Nuevo producto">
          <PackagePlus size={18} /><span className="txt-largo">Nuevo producto</span><span className="txt-corto">Nuevo</span>
        </button>
      </div>

      {productos && (
        <div className="chips mt" role="tablist" aria-label="Categorías">
          <button role="tab" aria-selected={catFiltro === "todas"} className={"chip" + (catFiltro === "todas" ? " on" : "")} onClick={() => setCategoria("todas")}>
            Todas <span className="chip-n">{productos.length}</span>
          </button>
          {categorias.map(([c, n]) => (
            <button key={c} role="tab" aria-selected={catFiltro === c} className={"chip" + (catFiltro === c ? " on" : "")} onClick={() => setCategoria(c)}>
              {c} <span className="chip-n">{n}</span>
            </button>
          ))}
        </div>
      )}

      <div className="card pad mt">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
          <h2 style={{ margin: 0 }}>Inventario</h2>
          {productos ? <span className="sub">{`${lista.length} ${lista.length === 1 ? "producto" : "productos"}`}</span> : <Sk w={80} h={12} />}
        </div>
        {productos === null ? (
          <ul className="plist"><EsqueletoFilasProductos /></ul>
        ) : productos.length === 0 ? (
          <div className="empty"><div className="ico"><Package size={34} strokeWidth={1.5} /></div>
            Aún no hay productos.<br />Haz clic en “Nuevo producto” o pasa el lector por un código para registrar el primero, con su categoría.</div>
        ) : lista.length === 0 ? (
          <div className="empty">{q ? <>Nada coincide con “{q}”.</> : "No hay productos en esta categoría."}</div>
        ) : (
          <ul className="plist">{lista.map(fila)}</ul>
        )}
      </div>

      {editando && (
        <ProductoForm producto={editando} onCerrar={() => setEditando(null)}
          onGuardado={() => avisar(editando.id ? "Cambios guardados" : "Producto guardado")}
          nota={!editando.id && editando.codigo ? "Este código no está registrado. Completa los datos del producto." : undefined} />
      )}
    </section>
  );
}
