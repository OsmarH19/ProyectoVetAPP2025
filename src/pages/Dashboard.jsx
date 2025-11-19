import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, PawPrint, Calendar, TrendingUp, Activity } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'admin') {
          window.location.href = '/ClienteDashboard';
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
    loadUser();
  }, []);

  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: mascotas = [], isLoading: loadingMascotas } = useQuery({
    queryKey: ['mascotas'],
    queryFn: () => base44.entities.Mascota.list(),
  });

  const { data: citas = [], isLoading: loadingCitas } = useQuery({
    queryKey: ['citas'],
    queryFn: () => base44.entities.Cita.list('-fecha'),
  });

  const { data: tratamientos = [], isLoading: loadingTratamientos } = useQuery({
    queryKey: ['tratamientos'],
    queryFn: () => base44.entities.Tratamiento.list(),
  });

  const citasPendientes = citas.filter(c => c.estado === 'Pendiente' || c.estado === 'Confirmada').length;
  const citasHoy = citas.filter(c => c.fecha === new Date().toISOString().split('T')[0]).length;

  const especiesData = mascotas.reduce((acc, m) => {
    const especie = m.especie || 'Otro';
    acc[especie] = (acc[especie] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(especiesData).map(([name, value]) => ({ name, value }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const citasPorEstado = citas.reduce((acc, c) => {
    acc[c.estado] = (acc[c.estado] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.entries(citasPorEstado).map(([name, value]) => ({ name, value }));

  const citasPorMes = citas.reduce((acc, c) => {
    if (c.fecha) {
      const mes = new Date(c.fecha).toLocaleDateString('es-ES', { month: 'short' });
      acc[mes] = (acc[mes] || 0) + 1;
    }
    return acc;
  }, {});

  const lineData = Object.entries(citasPorMes).map(([name, value]) => ({ name, value }));

  if (!user || user.role !== 'admin') {
    return <div className="p-8"><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Dashboard Administrativo
          </h1>
          <p className="text-gray-600">Vista general del sistema veterinario</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Total Clientes
              </CardTitle>
              <Users className="h-5 w-5 text-blue-100" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{clientes.length}</div>
              <p className="text-xs text-blue-100 mt-1">
                Clientes registrados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                Total Mascotas
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

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">
                Citas Pendientes
              </CardTitle>
              <Calendar className="h-5 w-5 text-orange-100" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{citasPendientes}</div>
              <p className="text-xs text-orange-100 mt-1">
                Por atender
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                Citas Hoy
              </CardTitle>
              <Activity className="h-5 w-5 text-purple-100" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{citasHoy}</div>
              <p className="text-xs text-purple-100 mt-1">
                Para hoy
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Citas por Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-blue-600" />
                Distribución por Especie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Evolución de Citas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  name="Citas"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}