import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PawPrint, Calendar, Heart, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClienteDashboard() {
  const [user, setUser] = useState(null);
  const [cliente, setCliente] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.role === 'admin') {
          window.location.href = '/Dashboard';
          return;
        }

        const clientes = await base44.entities.Cliente.list();
        const myCliente = clientes.find(c => c.email === currentUser.email);
        setCliente(myCliente);
      } catch (error) {
        console.error("Error:", error);
      }
    }
    loadUser();
  }, []);

  const { data: mascotas = [] } = useQuery({
    queryKey: ['mis-mascotas', cliente?.id],
    queryFn: async () => {
      if (!cliente?.id) return [];
      const all = await base44.entities.Mascota.list();
      return all.filter(m => m.cliente_id === cliente.id);
    },
    enabled: !!cliente?.id,
  });

  const { data: citas = [] } = useQuery({
    queryKey: ['mis-citas', cliente?.id],
    queryFn: async () => {
      if (!cliente?.id) return [];
      const all = await base44.entities.Cita.list('-fecha');
      return all.filter(c => c.cliente_id === cliente.id);
    },
    enabled: !!cliente?.id,
  });

  const citasPendientes = citas.filter(c => c.estado === 'Pendiente' || c.estado === 'Confirmada');
  const proximaCita = citasPendientes[0];

  if (!user) {
    return (
      <div className="p-8">
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Bienvenido, {user.full_name}
          </h1>
          <p className="text-gray-600">Panel de control de tu cuenta</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                Mis Mascotas
              </CardTitle>
              <PawPrint className="h-5 w-5 text-green-100" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mascotas.length}</div>
              <p className="text-xs text-green-100 mt-1">
                Mascotas registradas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Citas Totales
              </CardTitle>
              <Calendar className="h-5 w-5 text-blue-100" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{citas.length}</div>
              <p className="text-xs text-blue-100 mt-1">
                Historial de citas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">
                Citas Pendientes
              </CardTitle>
              <Activity className="h-5 w-5 text-orange-100" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{citasPendientes.length}</div>
              <p className="text-xs text-orange-100 mt-1">
                Por atender
              </p>
            </CardContent>
          </Card>
        </div>

        {proximaCita && (
          <Card className="mb-6 shadow-lg border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Próxima Cita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-semibold text-lg">{proximaCita.fecha}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hora</p>
                  <p className="font-semibold text-lg">{proximaCita.hora}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mascota</p>
                  <p className="font-semibold">{mascotas.find(m => m.id === proximaCita.mascota_id)?.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Motivo</p>
                  <p className="font-semibold">{proximaCita.motivo}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-green-600" />
                Mis Mascotas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mascotas.length > 0 ? (
                <div className="space-y-3">
                  {mascotas.map(mascota => (
                    <div key={mascota.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xl">
                        {mascota.especie === 'Perro' ? '🐕' : mascota.especie === 'Gato' ? '🐈' : '🐾'}
                      </div>
                      <div>
                        <p className="font-semibold">{mascota.nombre}</p>
                        <p className="text-sm text-gray-600">{mascota.especie} - {mascota.raza}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No tienes mascotas registradas
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Últimas Citas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {citas.length > 0 ? (
                <div className="space-y-3">
                  {citas.slice(0, 5).map(cita => {
                    const mascota = mascotas.find(m => m.id === cita.mascota_id);
                    return (
                      <div key={cita.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{mascota?.nombre}</p>
                            <p className="text-sm text-gray-600">{cita.motivo}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            cita.estado === 'Completada' ? 'bg-green-100 text-green-800' :
                            cita.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {cita.estado}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{cita.fecha} - {cita.hora}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No tienes citas registradas
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}