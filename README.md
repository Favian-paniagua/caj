# Mi Caja – Demostración

Versión de demostración del sistema de caja, con **datos simulados** (31 productos, 60 días de ventas, cierres y caja abierta). Los datos se reinician cada vez que se abre. El escáner se simula tocando la imagen de la cámara.

Es una **PWA**: se puede instalar en el celular y se abre a pantalla completa, sin la barra del navegador.

- **Android (Chrome):** menú ⋮ → *Instalar app* o *Agregar a pantalla principal*.
- **iPhone (Safari):** Compartir → *Agregar a pantalla de inicio*.

## Publicar con GitHub Pages

Settings → Pages → *Build and deployment* → Source: **Deploy from a branch** → Branch: **main** / **(root)** → Save.

## Archivos

- `index.html` – la app completa en un solo archivo.
- `manifest.webmanifest` – nombre, colores e íconos de la app instalada.
- `sw.js` – service worker (permite instalarla y abrirla sin internet).
- `icons/` – íconos de la app.
