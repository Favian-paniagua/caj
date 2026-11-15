# Mi Caja – versión para computadora

Punto de venta para una computadora con **lector de códigos de barras USB** e **impresora de recibos térmica** (rollo de 80 mm o 58 mm). Se cobra con el teclado, sale el recibo impreso y en un dashboard ves cuánto vendes.

Es una adaptación del proyecto [Sistema-de-cajero](https://github.com/Favian-paniagua/Sistema-de-cajero), que es la versión para celular con cámara.

## Funciones

- **Caja**: primero la **apertura de caja** (con cuánto efectivo se empieza). Después, el buscador queda siempre listo: pasas el lector y el producto entra al carrito al instante, aunque el cursor esté en otro lado. También puedes escribir el nombre. Los códigos no registrados muestran un aviso rojo con un botón para **registrar el producto en ese momento** y sumarlo a la venta. El carrito es una tabla con precio, cantidad e importe, y a la derecha está el total grande con el botón **Cobrar**.
- **Cobro**: efectivo, QR o tarjeta, con cálculo de cambio. Al confirmar se **imprime el recibo** (nota de venta numerada).
- **Productos**: inventario con filtro por categoría y búsqueda. Si pasas el lector, se abre ese producto o, si no existe, el formulario de alta con el código ya escrito. En el formulario, el Enter del lector pasa al campo del nombre (no guarda a medias).
- **Dashboard**: ventas, ganancia, número de ventas y ticket promedio, gráfico, más vendidos, formas de pago, stock bajo y últimas ventas (con **reimprimir recibo** y anular).
- **Cierre**: arqueo de efectivo (total o por billetes y monedas). Al confirmar, se imprime el **ticket del cierre** y se descarga el PDF. **Exportar a Excel** con todas las ventas.
- **Configuración**: nombre del negocio, NIT, dirección, teléfono y mensaje del recibo; ancho del papel (80/58 mm); impresión automática; recibo de prueba y vista previa.

## Atajos de teclado (Caja)

| Tecla | Acción |
|---|---|
| Lector / escribir + `Enter` | Agregar producto |
| `3*` + código o nombre | Agregar 3 unidades |
| `↑` `↓` | Elegir fila del carrito |
| `+` `−` | Sumar / restar una unidad a la fila elegida |
| `Supr` | Quitar la fila elegida |
| `F2` | Ir al buscador |
| `F4` | Cancelar la venta (vaciar carrito) |
| `F9` | Reimprimir el último recibo |
| `F12` | Cobrar |
| En el cobro: `E` `Q` `T` | Efectivo / QR / Tarjeta |
| En el cobro: `Enter` / `Esc` | Confirmar / cancelar |

## Lector de códigos de barras

Cualquier lector **USB o inalámbrico en modo teclado (HID)** sirve: es el modo de fábrica de casi todos. Solo debe enviar **Enter** al final de cada lectura (también viene así de fábrica; si no, se configura escaneando el código "Add CR/Enter suffix" del manual). Para probarlo, abre el Bloc de notas y pasa un código: debe escribirse y saltar de línea.

## Impresora de recibos

Funciona con cualquier impresora térmica instalada en la computadora (Epson TM-T20, Xprinter, 3nStar, Bixolon, etc.), usando su controlador.

1. Instala el controlador de la impresora y ponla como **impresora predeterminada**.
2. En sus preferencias elige el tamaño del rollo (80 mm o 58 mm) y márgenes en 0.
3. En la app: **Configuración → Ancho del rollo** y luego **Imprimir recibo de prueba**.

### Imprimir sin el cuadro de diálogo (recomendado)

Por seguridad, el navegador muestra una ventana para elegir la impresora cada vez. Para que el recibo salga directo:

1. Crea un acceso directo de Google Chrome en el escritorio.
2. Clic derecho → Propiedades → en **Destino**, al final, agrega `--kiosk-printing`. Por ejemplo:
   `"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing https://favian-paniagua.github.io/caj/`
3. Cierra Chrome por completo y ábrelo siempre desde ese acceso directo.

## Tecnologías

| Tecnología | Para qué se usa |
|---|---|
| [React 19](https://react.dev) | Interfaz de usuario (componentes) |
| [Vite](https://vite.dev) | Servidor de desarrollo y compilación |
| [React Router](https://reactrouter.com) | Navegación entre secciones |
| [Dexie.js](https://dexie.org) (IndexedDB) | Base de datos dentro del navegador: funciona sin internet |
| [Recharts](https://recharts.org) | Gráfico de ventas del dashboard |
| [Lucide](https://lucide.dev) | Íconos de la interfaz |
| [ExcelJS](https://github.com/exceljs/exceljs) | Exportación a Excel con formato |
| [jsPDF](https://github.com/parallax/jsPDF) + [AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) | Reporte PDF del cierre de caja |
| CSS propio | Diseño para computadora, modo claro/oscuro automático |

## Cómo ejecutarlo

Necesitas [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install      # instala las dependencias (solo la primera vez)
npm run dev      # abre la app en http://localhost:5173
```

Para generar la versión final (carpeta `dist/`):

```bash
npm run build
npm run preview  # prueba la versión compilada
```

## Publicar con GitHub Pages

El archivo `.github/workflows/deploy.yml` compila la app en GitHub cada vez que subes cambios a `main` y publica `dist/`. Solo hay que activarlo una vez:

1. En el repositorio: **Settings → Pages**.
2. En **Build and deployment → Source**, elige **GitHub Actions**.
3. Ve a la pestaña **Actions** y espera a que termine "Publicar en GitHub Pages" (o ejecútalo con **Run workflow**).
4. La app queda en `https://favian-paniagua.github.io/caj/`.

## Dónde se guardan los datos

Los productos, las ventas y la configuración se guardan **en el navegador de la computadora** (IndexedDB y localStorage). Por eso:

- Funciona sin internet.
- Cada computadora (y cada navegador) tiene sus propios datos: usa siempre el mismo Chrome.
- Si borras los datos del navegador, se pierden. El historial de ventas se puede descargar en **Cierre → Exportar a Excel**.

Para compartir los datos entre varias cajas, reemplaza las funciones de `src/db/repositorio.js` por un servicio en la nube (por ejemplo Supabase o Firebase).

## Estructura del proyecto

```
src/
  main.jsx              punto de entrada
  App.jsx               navegación, reloj y diseño general
  index.css             estilos
  db/
    database.js         esquema de la base de datos (Dexie)
    repositorio.js      todas las operaciones de datos (productos, ventas, cierres)
  lib/
    recibo.js           recibo de venta y ticket de cierre para impresora térmica
    config.js           datos del negocio y opciones de impresión
    teclado.js          lector USB (envía lo tecleado al buscador) y atajos F2, F4, F9, F12
    sonido.js           pitido cuando un código no está registrado
    formato.js          formato de dinero (Bs) y fechas
    arqueo.js           efectivo esperado, conteo por billetes/monedas y diferencia
    categorias.js       lista fija de categorías de productos
    imagen.js           achica las fotos de productos antes de guardarlas
    bloquearScroll.js   congela la página de fondo mientras hay una ventana abierta
    estadisticas.js     cálculos del dashboard
    exportarExcel.js    archivo Excel de ventas e inventario
    reporteCierre.js    resumen y PDF del cierre de caja
  components/
    BuscadorProducto.jsx  buscador por código o nombre (con cantidad 3*)
    Cobro.jsx           ventana de cobro, cambio e impresión
    ProductoForm.jsx    crear/editar producto
    MiniaturaProducto.jsx  foto del producto o ícono de su categoría
    Modal.jsx           ventana emergente
    Avisos.jsx          mensajes y confirmaciones
  pages/
    Caja.jsx  Productos.jsx  Dashboard.jsx  Cierre.jsx  Configuracion.jsx
```
