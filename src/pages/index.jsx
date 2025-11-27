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
        <Route path="/Login" element={<Login />} />
      </Routes>
    )
  }

  return (
    <Layout currentPageName={currentPage}>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated() ? "/Dashboard" : "/Login"} replace />} />
        <Route path="/Dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/Clientes" element={<ProtectedRoute element={<Clientes />} />} />
        <Route path="/Mascotas" element={<ProtectedRoute element={<Mascotas />} />} />
        <Route path="/Citas" element={<ProtectedRoute element={<Citas />} />} />
        <Route path="/Tratamientos" element={<ProtectedRoute element={<Tratamientos />} />} />
        <Route path="/ClienteDashboard" element={<ProtectedRoute element={<ClienteDashboard />} />} />
        <Route path="/MisMascotas" element={<ProtectedRoute element={<MisMascotas />} />} />
        <Route path="/MisCitas" element={<ProtectedRoute element={<MisCitas />} />} />
        <Route path="/Veterinarios" element={<ProtectedRoute element={<Veterinarios />} />} />
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
