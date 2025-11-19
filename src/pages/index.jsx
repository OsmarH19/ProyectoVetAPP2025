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

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

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
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Clientes" element={<Clientes />} />
                
                <Route path="/Mascotas" element={<Mascotas />} />
                
                <Route path="/Citas" element={<Citas />} />
                
                <Route path="/Tratamientos" element={<Tratamientos />} />
                
                <Route path="/ClienteDashboard" element={<ClienteDashboard />} />
                
                <Route path="/MisMascotas" element={<MisMascotas />} />
                
                <Route path="/MisCitas" element={<MisCitas />} />
                
                <Route path="/Veterinarios" element={<Veterinarios />} />
                
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