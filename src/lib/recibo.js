import { METODOS } from "./estadisticas";
import { productosVendidos } from "./reporteCierre";
import { leerConfig } from "./config";

/**
 * Recibos para impresora térmica (rollo de 80 mm o 58 mm).
 * Se imprimen con la impresora predeterminada de Windows/macOS/Linux a través del navegador.
 * Para imprimir sin que aparezca el cuadro de diálogo, abre Chrome con --kiosk-printing (ver README).
 */

const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (n) => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const bs = (n) => "Bs " + num(n);
const fecha = (ts) => new Date(ts).toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" });
const hora = (ts) => new Date(ts).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const numeroVenta = (id) => String(id ?? 0).padStart(6, "0");

/** Estilos del ticket. El ancho útil de un rollo de 80 mm es ~72 mm; el de 58 mm, ~48 mm. */
function estilos(papel) {
  const ancho = papel === "58" ? 48 : 72;
  const letra = papel === "58" ? 11 : 12.5;
  return `
@page{margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff;color:#000}
body{width:${ancho}mm;padding:2mm 0 6mm;margin:0 auto;font:${letra}px/1.3 Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.c{text-align:center}
.neg{font-weight:700}
.titulo{font-size:1.45em;font-weight:800;letter-spacing:.01em;line-height:1.15}
.peq{font-size:.88em}
hr{border:0;border-top:1px dashed #000;margin:5px 0}
.f{display:flex;justify-content:space-between;gap:6px}
.f span:last-child{text-align:right;white-space:nowrap}
.item{margin:3px 0}
.item .n{word-break:break-word}
.total{font-size:1.5em;font-weight:800;margin:3px 0}
.pie{margin-top:8px}
`;
}

function encabezado(c) {
  return `
<div class="c">
  <div class="titulo">${esc(c.negocio || "Mi Caja")}</div>
  ${c.direccion ? `<div class="peq">${esc(c.direccion)}</div>` : ""}
  ${c.telefono ? `<div class="peq">Tel. ${esc(c.telefono)}</div>` : ""}
  ${c.nit ? `<div class="peq">NIT ${esc(c.nit)}</div>` : ""}
</div>`;
}

/** HTML del recibo de una venta. */
export function htmlRecibo(venta, c = leerConfig(), { copia = false } = {}) {
  const items = (venta.items || []).map((i) => `
<div class="item">
  <div class="n">${esc(i.nombre)}</div>
  <div class="f"><span>${i.cantidad} x ${num(i.precio)}</span><span>${num(i.precio * i.cantidad)}</span></div>
</div>`).join("");
  const efectivo = venta.metodo === "efectivo";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Recibo ${numeroVenta(venta.id)}</title><style>${estilos(c.papel)}</style></head><body>
${encabezado(c)}
<hr>
<div class="c neg">NOTA DE VENTA N.º ${numeroVenta(venta.id)}</div>
${copia ? `<div class="c peq">(reimpresión)</div>` : ""}
<div class="f peq"><span>Fecha: ${fecha(venta.ts)}</span><span>Hora: ${hora(venta.ts)}</span></div>
<hr>
<div class="f peq neg"><span>Cant. x P. unit.</span><span>Importe</span></div>
${items}
<hr>
<div class="f total"><span>TOTAL</span><span>${bs(venta.total)}</span></div>
<div class="f"><span>Forma de pago</span><span>${esc(METODOS[venta.metodo]?.nombre || venta.metodo)}</span></div>
${efectivo ? `<div class="f"><span>Recibido</span><span>${bs(venta.recibido)}</span></div>
<div class="f neg"><span>Cambio</span><span>${bs(venta.cambio)}</span></div>` : ""}
<div class="f peq"><span>Artículos</span><span>${venta.unidades}</span></div>
<hr>
${c.mensaje ? `<div class="c pie">${esc(c.mensaje)}</div>` : ""}
</body></html>`;
}

const ETIQUETA = { cuadra: "Cuadra", sobrante: "Sobrante", faltante: "Faltante" };

/** HTML del ticket del cierre de caja (arqueo + resumen del turno). */
export function htmlCierre(cierre, ventas = [], c = leerConfig()) {
  const metodos = Object.entries(METODOS).map(([id, m]) => {
    const pm = cierre.porMetodo?.[id] || { ventas: 0, total: 0 };
    return `<div class="f"><span>${m.nombre} (${pm.ventas})</span><span>${num(pm.total)}</span></div>`;
  }).join("");
  const productos = productosVendidos(ventas).map((p) =>
    `<div class="f"><span>${p.cantidad} x ${esc(p.nombre)}</span><span>${num(p.total)}</span></div>`).join("");
  const arqueo = cierre.efectivoContado != null ? `
<hr>
<div class="c neg">ARQUEO DE EFECTIVO</div>
<div class="f"><span>Efectivo inicial</span><span>${num(cierre.efectivoInicial)}</span></div>
<div class="f"><span>Ventas en efectivo</span><span>${num((cierre.efectivoEsperado || 0) - (cierre.efectivoInicial || 0))}</span></div>
<div class="f neg"><span>Esperado</span><span>${bs(cierre.efectivoEsperado)}</span></div>
<div class="f neg"><span>Contado</span><span>${bs(cierre.efectivoContado)}</span></div>
<div class="f total"><span>${ETIQUETA[cierre.tipoDiferencia] || "Diferencia"}</span><span>${bs(Math.abs(cierre.diferencia || 0))}</span></div>
${cierre.observacion ? `<div class="peq">Obs.: ${esc(cierre.observacion)}</div>` : ""}` : "";

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Cierre de caja</title><style>${estilos(c.papel)}</style></head><body>
${encabezado(c)}
<hr>
<div class="c neg">CIERRE DE CAJA</div>
${cierre.aperturaTs ? `<div class="f peq"><span>Apertura</span><span>${fecha(cierre.aperturaTs)} ${hora(cierre.aperturaTs)}</span></div>` : ""}
<div class="f peq"><span>Cierre</span><span>${fecha(cierre.ts)} ${hora(cierre.ts)}</span></div>
<hr>
<div class="f"><span>N.º de ventas</span><span>${cierre.ventas}</span></div>
<div class="f"><span>Artículos vendidos</span><span>${cierre.unidades}</span></div>
<div class="f total"><span>VENDIDO</span><span>${bs(cierre.total)}</span></div>
${metodos}
${arqueo}
${productos ? `<hr><div class="c neg">PRODUCTOS VENDIDOS</div>${productos}` : ""}
<hr>
<div class="pie c peq">Firma cajero</div>
<div style="height:14mm"></div>
<div class="c peq">_________________________</div>
</body></html>`;
}

/**
 * Imprime un documento HTML con un iframe oculto (no abre ventanas nuevas).
 * Devuelve una promesa que se resuelve cuando se envió a imprimir.
 */
export function imprimirHtml(html) {
  return new Promise((resolve, reject) => {
    const f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true");
    f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    f.onload = () => {
      const previo = document.activeElement;
      try {
        const w = f.contentWindow;
        w.focus();
        w.print();   // en Chrome espera a que el recibo se envíe (o a que se cierre el diálogo)
        resolve();
      } catch (e) { reject(e); }
      finally {
        // devuelve el foco a la caja para que la siguiente lectura del lector no se pierda
        window.focus();
        if (previo?.isConnected) previo.focus();
        setTimeout(() => f.remove(), 1000);
      }
    };
    f.srcdoc = html;
    document.body.appendChild(f);
  });
}

export const imprimirRecibo = (venta, opciones) => imprimirHtml(htmlRecibo(venta, leerConfig(), opciones));
export const imprimirCierre = (cierre, ventas) => imprimirHtml(htmlCierre(cierre, ventas, leerConfig()));

/** Venta de ejemplo para la prueba de impresión y la vista previa. */
export const VENTA_EJEMPLO = {
  id: 123, ts: Date.now(), metodo: "efectivo", total: 31.5, recibido: 50, cambio: 18.5, unidades: 4,
  items: [
    { nombre: "Coca-Cola 2L", cantidad: 1, precio: 15 },
    { nombre: "Pan de batalla", cantidad: 2, precio: 0.75 },
    { nombre: "Leche PIL entera 1L", cantidad: 1, precio: 15 },
  ],
};
