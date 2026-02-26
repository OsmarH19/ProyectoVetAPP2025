import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "Inicio", to: "/" },
  { label: "Soluciones", to: "/soluciones" },
  { label: "Precios", to: "/precios" },
  { label: "Casos", to: "/casos" },
  { label: "Contacto", to: "/contacto" },
];

function navItemClass({ isActive }) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-primary/15 text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;
}

export default function SiteLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[radial-gradient(70%_55%_at_50%_0%,rgba(14,165,233,0.10),transparent)] bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center" aria-label="Inicio VetApp">
            <span className="inline-flex h-10 w-36 items-center justify-center overflow-hidden">
              <img src="/logos/logoVetApp.png" alt="Logo VetApp" className="h-full w-full object-contain" />
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navegacion principal">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={navItemClass} end={item.to === "/"}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Iniciar sesion
            </Link>
            <Link
              to="/contacto"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              Solicitar demo
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-site-nav"
            aria-label={mobileOpen ? "Cerrar menu" : "Abrir menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div id="mobile-site-nav" className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Navegacion movil">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={navItemClass} end={item.to === "/"}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/login" className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700">
                Ingresar
              </Link>
              <Link to="/contacto" className="rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-white">
                Demo
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 text-sm sm:px-6 md:grid-cols-3">
          <div>
            <div className="inline-flex h-12 w-44 items-center justify-center overflow-hidden">
              <img src="/logos/logoVetApp.png" alt="Logo VetApp" className="h-full w-full object-contain" />
            </div>
            <p className="mt-2 text-slate-600">
              Plataforma de gestion veterinaria para citas, historial clinico y experiencia del cliente.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Navegacion</p>
            <ul className="mt-2 space-y-1 text-slate-600">
              {NAV_ITEMS.map((item) => (
                <li key={`foot-${item.to}`}>
                  <Link to={item.to} className="hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Contacto</p>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li>soporte@mivetapp.com</li>
              <li>+51 999 999 999</li>
              <li>Lun - Vie / 8:00 a 18:00</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
