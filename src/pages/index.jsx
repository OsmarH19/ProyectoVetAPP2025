import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./Layout.jsx";
import Dashboard from "./Dashboard";
import Clientes from "./Clientes";
import Mascotas from "./Mascotas";
import Citas from "./Citas";
import Tratamientos from "./Tratamientos";
import ClienteDashboard from "./ClienteDashboard";
import MisMascotas from "./MisMascotas";
import MisCitas from "./MisCitas";
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
  ClienteDashboard,
  MisMascotas,
  MisCitas,
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
  const user = getAuthUser();
  if (!user) return "/login";
  return Number(user?.profileID) === 1 ? "/dashboard" : "/clientedashboard";
}

function ProtectedRoute({ element, allowIncompleteProfile = false }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  const incomplete = needsClienteCompletion();
  if (!allowIncompleteProfile && incomplete) {
    return <Navigate to="/completar-cliente" replace />;
  }
  if (allowIncompleteProfile && !incomplete) {
    return <Navigate to={getDefaultRouteForUser()} replace />;
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
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/clientes" element={<ProtectedRoute element={<Clientes />} />} />
        <Route path="/mascotas" element={<ProtectedRoute element={<Mascotas />} />} />
        <Route path="/citas" element={<ProtectedRoute element={<Citas />} />} />
        <Route path="/tratamientos" element={<ProtectedRoute element={<Tratamientos />} />} />
        <Route
          path="/clientedashboard"
          element={<ProtectedRoute element={<ClienteDashboard />} />}
        />
        <Route path="/mismascotas" element={<ProtectedRoute element={<MisMascotas />} />} />
        <Route path="/miscitas" element={<ProtectedRoute element={<MisCitas />} />} />
        <Route path="/veterinarios" element={<ProtectedRoute element={<Veterinarios />} />} />
        <Route path="/usuarios" element={<ProtectedRoute element={<Usuarios />} />} />
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

