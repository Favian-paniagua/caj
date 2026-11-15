/**
 * Categorías fijas de productos. Para agregar o renombrar una, cámbiala aquí
 * (y su ícono en components/MiniaturaProducto.jsx).
 * Un producto sin categoría, o con una que ya no está en la lista, aparece como "Sin categoría".
 */
export const CATEGORIAS = [
  "Sodas",
  "Jugos",
  "Beb. Energizantes",
  "Beb. Hidratante",
  "Aguas",
  "Snacks",
];

export const OTROS = "Sin categoría";

/** Categoría válida de un producto o de un producto vendido. */
export const categoriaDe = (x) => (x && CATEGORIAS.includes(x.categoria) ? x.categoria : OTROS);
