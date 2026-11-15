import { Citrus, Cookie, CupSoda, Droplets, GlassWater, Package, Zap } from "lucide-react";
import { categoriaDe } from "../lib/categorias";

/** Ícono que representa cada categoría cuando el producto no tiene foto. */
const ICONOS = {
  "Sodas": CupSoda,
  "Jugos": Citrus,
  "Beb. Energizantes": Zap,
  "Beb. Hidratante": Droplets,
  "Aguas": GlassWater,
  "Snacks": Cookie,
};

// URLs de fotos ya preparadas (por producto y versión), para no recrearlas en cada actualización
const cache = new Map();
function urlDe(producto) {
  const img = producto?.imagen;
  if (!(img instanceof Blob)) return null;
  const clave = producto.id != null ? `${producto.id}:${producto.actualizado ?? ""}:${img.size}` : null;
  if (clave && cache.has(clave)) return cache.get(clave);
  const url = URL.createObjectURL(img);
  if (clave) cache.set(clave, url);
  return url;
}

/** Foto pequeña del producto, o el ícono de su categoría si no tiene foto. */
export default function MiniaturaProducto({ producto, tam = 48, className = "" }) {
  const url = urlDe(producto);
  const Icono = ICONOS[categoriaDe(producto)] || Package;
  return (
    <span className={"mini-prod" + (url ? " con-foto" : "") + (className ? " " + className : "")} style={{ width: tam, height: tam }} aria-hidden="true">
      {url ? <img src={url} alt="" loading="lazy" /> : <Icono size={Math.round(tam * 0.46)} strokeWidth={1.7} />}
    </span>
  );
}
