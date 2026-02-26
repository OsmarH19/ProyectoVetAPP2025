import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./Layout.jsx";
import Dashboard from "./Dashboard";
import Clientes from "./Clientes";
import Mascotas from "./Mascotas";
import Citas from "./Citas";
import Servicios from "./Servicios";
import Tratamientos from "./Tratamientos";
import MisMascotas from "./MisMascotas";
import MisCitas from "./MisCitas";
import MisTratamientos from "./MisTratamientos";
import Veterinarios from "./Veterinarios";
import Usuarios from "./Usuarios";
import Login from "./Login.jsx";
import CompletarCliente from "./CompletarCliente.jsx";
import SiteLayout from "./site/SiteLayout.jsx";
import HomePage from "./site/HomePage.jsx";
import SolutionsPage from "./site/SolutionsPage.jsx";
import PricingPage from "./site/PricingPage.jsx";
import CaseStudiesPage from "./site/CaseStudiesPage.jsx";
import ContactPage from "./site/ContactPage.jsx";

const PAGES = {
  Dashboard,
  Clientes,
  Mascotas,
  Citas,
  Servicios,
  Tratamientos,
  MisMascotas,
  MisCitas,
  MisTratamientos,
  Veterinarios,
  Usuarios,
  CompletarCliente,
};

const SITE_ROUTE_PATHS = ["/", "/soluciones", "/precios", "/casos", "/contacto"];

function getCurrentPage(url) {
  let normalizedUrl = url;
  if (normalizedUrl.endsWith("/")) {
    normalizedUrl = normalizedUrl.slice(0, -1);
  }
  let urlLastPart = normalizedUrl.split("/").pop();
  if (urlLastPart.includes("?")) {
    urlLastPart = urlLastPart.split("?")[0];
  }
  const pageName = Object.keys(PAGES).find(
    (page) => page.toLowerCase() === urlLastPart.toLowerCase()
  );
  return pageName || Object.keys(PAGES)[0];
}

function normalizePath(path = "/") {
  const lowered = String(path || "/").toLowerCase();
  if (lowered.length > 1 && lowered.endsWith("/")) {
    return lowered.slice(0, -1);
  }
  return lowered;
}

function isPublicSiteRoute(path) {
  return SITE_ROUTE_PATHS.includes(path);
}

function getAuthUser() {
  const raw = localStorage.getItem("auth_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getProfileId() {
  const user = getAuthUser();
  const rawId = user?.profileID ?? user?.profile_id;
  const id = Number(rawId);
  return Number.isFinite(id) ? id : null;
}

function isClientUser() {
  const id = getProfileId();
  if (!id) return true;
  return id === 5;
}

function isStaffUser() {
  const id = getProfileId();
  return id === 1 || id === 2 || id === 3 || id === 4;
}

function isAuthenticated() {
  const user = getAuthUser();
  const token = localStorage.getItem("auth_token");
  return Boolean(user || token);
}

function needsClienteCompletion() {
  const user = getAuthUser();
  if (!user) return false;
  return Boolean(
    user?.needs_cliente_profile || user?.cliente_profile_completed === false
  );
}

function getDefaultRouteForUser() {
  if (!isAuthenticated()) return "/login";
  return isStaffUser() ? "/dashboard" : "/mismascotas";
}

function ProtectedRoute({
  element,
  allowIncompleteProfile = false,
  clientOnly = false,
  denyClients = false,
}) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  const incomplete = needsClienteCompletion();
  if (!allowIncompleteProfile && incomplete) {
    return <Navigate to="/completar-cliente" replace />;
  }
  if (allowIncompleteProfile && !incomplete) {
    return <Navigate to={getDefaultRouteForUser()} replace />;
  }

  if (clientOnly && !isClientUser()) {
    return <Navigate to={getDefaultRouteForUser()} replace />;
  }
  if (denyClients && isClientUser()) {
    return <Navigate to="/clientedashboard" replace />;
  }

  return element;
}

function PagesContent() {
  const location = useLocation();
  const currentPage = getCurrentPage(location.pathname);
  const lowerPath = normalizePath(location.pathname);

  if (isPublicSiteRoute(lowerPath)) {
    if (lowerPath === "/" && isAuthenticated()) {
      return <Navigate to={getDefaultRouteForUser()} replace />;
    }

    return (
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/soluciones" element={<SolutionsPage />} />
          <Route path="/precios" element={<PricingPage />} />
          <Route path="/casos" element={<CaseStudiesPage />} />
          <Route path="/contacto" element={<ContactPage />} />
        </Route>
      </Routes>
    );
  }

  if (lowerPath === "/login") {
    if (isAuthenticated()) {
      return (
        <Navigate
          to={needsClienteCompletion() ? "/completar-cliente" : getDefaultRouteForUser()}
          replace
        />
      );
    }
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Layout currentPageName={currentPage}>
      <Routes>
        <Route
          path="/completar-cliente"
          element={<ProtectedRoute element={<CompletarCliente />} allowIncompleteProfile />}
        />
        <Route
          path="/dashboard"
          element={<ProtectedRoute element={<Dashboard />} denyClients />}
        />
        <Route
          path="/clientes"
          element={<ProtectedRoute element={<Clientes />} denyClients />}
        />
        <Route
          path="/mascotas"
          element={<ProtectedRoute element={<Mascotas />} denyClients />}
        />
        <Route
          path="/citas"
          element={<ProtectedRoute element={<Citas />} denyClients />}
        />
        <Route
          path="/servicios"
          element={<ProtectedRoute element={<Servicios />} />}
        />
        <Route
          path="/tratamientos"
          element={<ProtectedRoute element={<Tratamientos />} denyClients />}
        />
        <Route path="/clientedashboard" element={<Navigate to="/mismascotas" replace />} />
        <Route
          path="/mismascotas"
          element={<ProtectedRoute element={<MisMascotas />} clientOnly />}
        />
        <Route
          path="/miscitas"
          element={<ProtectedRoute element={<MisCitas />} clientOnly />}
        />
        <Route
          path="/mistratamientos"
          element={<ProtectedRoute element={<MisTratamientos />} clientOnly />}
        />
        <Route
          path="/veterinarios"
          element={<ProtectedRoute element={<Veterinarios />} denyClients />}
        />
        <Route
          path="/usuarios"
          element={<ProtectedRoute element={<Usuarios />} denyClients />}
        />
        <Route
          path="*"
          element={<Navigate to={isAuthenticated() ? getDefaultRouteForUser() : "/"} replace />}
        />
      </Routes>
    </Layout>
  );
}

export default function Pages() {
  return (
    <Router>
      <PagesContent />
    </Router>
  );
}
