
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LayoutDashboard, 
  Users, 
  PawPrint, 
  Calendar, 
  Stethoscope,
  LogOut,
  Menu,
  X,
  Heart,
  UserCog,
  UserPlus
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { clearAuthData } from "@/lib/session";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('auth_user')
    return u ? JSON.parse(u) : null
  });
  const [isAdmin, setIsAdmin] = useState(() => (user?.profileID === 1));
  const [isStaff, setIsStaff] = useState(() => {
    const id = Number(user?.profileID ?? user?.profile_id);
    return id === 1 || id === 2 || id === 3 || id === 4;
  });

  useEffect(() => {
    const u = localStorage.getItem('auth_user')
    const parsed = u ? JSON.parse(u) : null
    setUser(parsed)
    setIsAdmin(parsed ? parsed?.profileID === 1 : false)
    const id = Number(parsed?.profileID ?? parsed?.profile_id);
    setIsStaff(id === 1 || id === 2 || id === 3 || id === 4)
  }, [])

  useEffect(() => {
    if (user && location.pathname.toLowerCase() !== '/login') {
      localStorage.setItem('last_route', location.pathname)
    }
  }, [user, location.pathname])

  const adminNavigation = [
    {
      title: "Dashboard",
      url: createPageUrl("Dashboard"),
      icon: LayoutDashboard,
    },
    {
      title: "Clientes",
      url: createPageUrl("Clientes"),
      icon: Users,
    },
    {
      title: "Mascotas",
      url: createPageUrl("Mascotas"),
      icon: PawPrint,
    },
    {
      title: "Citas",
      url: createPageUrl("Citas"),
      icon: Calendar,
    },
    {
      title: "Tratamientos",
      url: createPageUrl("Tratamientos"),
      icon: Stethoscope,
    },
    {
      title: "Veterinarios",
      url: createPageUrl("Veterinarios"),
      icon: UserCog,
    },
    {
      title: "Usuarios",
      url: createPageUrl("Usuarios"),
      icon: UserPlus,
    },
  ];

  const clientNavigation = [
    {
      title: "Mis Mascotas",
      url: createPageUrl("MisMascotas"),
      icon: PawPrint,
    },
    {
      title: "Mis Citas",
      url: createPageUrl("MisCitas"),
      icon: Calendar,
    },
    {
      title: "Mis Tratamientos",
      url: createPageUrl("MisTratamientos"),
      icon: Stethoscope,
    },
  ];

  const navigation = isStaff ? adminNavigation : clientNavigation;

  const handleLogout = () => {
    try {
      clearAuthData()
    } finally {
      navigate('/login', { replace: true })
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-white">
        <Sidebar className="border-r border-border bg-sidebar/80 backdrop-blur-sm">
          <SidebarHeader className="border-b border-border p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/90 ring-1 ring-black/5 shadow-md flex items-center justify-center">
                <img
                  src="/logos/logoico.png"
                  alt="Logo VetApp"
                  className="w-9 h-9 object-contain"
                />
              </div>
              <div>
                <h2 className="font-bold text-xl text-gray-900">VetApp</h2>
                <p className="text-xs text-gray-500">Sistema Veterinario</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                {isAdmin ? "Administración" : "Mi Cuenta"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url ? 'bg-primary/15 text-primary shadow-sm' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-border p-4">
            <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-10 h-10 bg-gradient-to-br from-primary to-secondary">
                  <AvatarFallback className="bg-transparent text-white font-semibold">
                  {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {user?.name || "Usuario"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                {user && (
                  <p className="text-xs text-primary font-medium">
                    {isAdmin ? 'Administrador' : 'Usuario'}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          <header className="bg-card/80 backdrop-blur-sm border-b border-border px-6 py-4 lg:hidden shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200" />
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-primary fill-primary" />
                <h1 className="text-xl font-bold text-gray-900">VetApp</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-white">
            {children}
          </div>
        </main>
      </div>

    </SidebarProvider>
  );
}
