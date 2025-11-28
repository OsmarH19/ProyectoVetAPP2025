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

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Login from "./Login.jsx";

const PAGES = {
    
    Dashboard: Dashboard,
    
    Clientes: Clientes,
    
    Mascotas: Mascotas,
    
    Citas: Citas,
    
    Tratamientos: Tratamientos,
    
    ClienteDashboard: ClienteDashboard,
    
    MisMascotas: MisMascotas,
    
    MisCitas: MisCitas,
    
    Veterinarios: Veterinarios,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function isAuthenticated() {
  const u = localStorage.getItem('auth_user')
  const t = localStorage.getItem('auth_token')
  return !!(u || t)
}

function ProtectedRoute({ element }) {
  return isAuthenticated() ? element : <Navigate to="/Login" replace />
}

function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);
  
  if (location.pathname.toLowerCase() === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    )
  }

  return (
    <Layout currentPageName={currentPage}>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/clientes" element={<ProtectedRoute element={<Clientes />} />} />
        <Route path="/mascotas" element={<ProtectedRoute element={<Mascotas />} />} />
        <Route path="/citas" element={<ProtectedRoute element={<Citas />} />} />
        <Route path="/tratamientos" element={<ProtectedRoute element={<Tratamientos />} />} />
        <Route path="/clientedashboard" element={<ProtectedRoute element={<ClienteDashboard />} />} />
        <Route path="/mismascotas" element={<ProtectedRoute element={<MisMascotas />} />} />
        <Route path="/miscitas" element={<ProtectedRoute element={<MisCitas />} />} />
        <Route path="/veterinarios" element={<ProtectedRoute element={<Veterinarios />} />} />
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
