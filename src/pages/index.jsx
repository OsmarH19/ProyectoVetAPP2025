import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./Layout.jsx";
import Dashboard from "./Dashboard";
import Clientes from "./Clientes";
import Mascotas from "./Mascotas";
import Citas from "./Citas";
import Tratamientos from "./Tratamientos";
import MisMascotas from "./MisMascotas";
import MisCitas from "./MisCitas";
import MisTratamientos from "./MisTratamientos";
import Veterinarios from "./Veterinarios";
import Usuarios from "./Usuarios";
import Login from "./Login.jsx";
import CompletarCliente from "./CompletarCliente.jsx";

const PAGES = {
  Dashboard,
  Clientes,
  Mascotas,
  Citas,
  Tratamientos,
  MisMascotas,
  MisCitas,
  MisTratamientos,
  Veterinarios,
  Usuarios,
  CompletarCliente,
};

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
  const lowerPath = location.pathname.toLowerCase();

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
          path="/"
          element={<Navigate to={isAuthenticated() ? getDefaultRouteForUser() : "/login"} replace />}
        />
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
