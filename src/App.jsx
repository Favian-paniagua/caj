import { lazy, Suspense, useEffect, useState } from "react";
import { HashRouter, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AvisosProvider } from "./components/Avisos";
import Caja from "./pages/Caja";
import Productos from "./pages/Productos";
import Cierre from "./pages/Cierre";
import Configuracion from "./pages/Configuracion";
import { useConfig } from "./lib/config";
import { ReceiptText, Package, ChartColumn, LockKeyhole, ScanBarcode, Settings } from "lucide-react";
import { EsqueletoDashboard } from "./components/Esqueletos";

// Los gráficos (Recharts) se cargan solo al abrir el Dashboard
const Dashboard = lazy(() => import("./pages/Dashboard"));

const SECCIONES = [
  { ruta: "/caja", nombre: "Caja", Icono: ReceiptText },
  { ruta: "/productos", nombre: "Productos", Icono: Package },
  { ruta: "/dashboard", nombre: "Dashboard", Icono: ChartColumn },
  { ruta: "/cierre", nombre: "Cierre", Icono: LockKeyhole },
  { ruta: "/configuracion", nombre: "Configuración", Icono: Settings },
];

/** Fecha y hora en la barra superior. */
function Reloj() {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setAhora(new Date()), 15000); return () => clearInterval(t); }, []);
  return (
    <span className="reloj num">
      {ahora.toLocaleDateString("es-BO", { weekday: "short", day: "numeric", month: "short" })} · {ahora.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

function Layout() {
  // El carrito vive aquí para no perderse al cambiar de pantalla
  const [carrito, setCarrito] = useState([]);
  const { pathname } = useLocation();
  const { negocio } = useConfig();

  useEffect(() => {
    document.body.classList.toggle("v-caja", pathname === "/caja");
  }, [pathname]);

  return (
    <>
      <header className="top">
        <div className="top-in">
          <div className="brand"><span className="brand-dot"><ScanBarcode size={16} strokeWidth={2.2} /></span>{negocio || "Mi Caja"}</div>
          <nav className="tabs" aria-label="Secciones">
            {SECCIONES.map((s) => <NavLink key={s.ruta} to={s.ruta}><s.Icono size={16} strokeWidth={2} />{s.nombre}</NavLink>)}
          </nav>
          <div className="top-der">
            <Reloj />
            <div className="conn ok" title="Los datos se guardan en esta computadora"><i /><span>Guardado en esta computadora</span></div>
          </div>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/caja" element={<Caja carrito={carrito} setCarrito={setCarrito} />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/dashboard" element={<Suspense fallback={<EsqueletoDashboard />}><Dashboard /></Suspense>} />
          <Route path="/cierre" element={<Cierre />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/respaldo" element={<Navigate to="/cierre" replace />} />
          <Route path="*" element={<Navigate to="/caja" replace />} />
        </Routes>
      </main>
      <nav className="bottom" aria-label="Secciones">
        {SECCIONES.map((s) => <NavLink key={s.ruta} to={s.ruta}><span className="i"><s.Icono size={22} strokeWidth={1.9} /></span>{s.nombre}</NavLink>)}
      </nav>
    </>
  );
}

export default function App() {
  return (
    <AvisosProvider>
      <HashRouter>
        <Layout />
      </HashRouter>
    </AvisosProvider>
  );
}
