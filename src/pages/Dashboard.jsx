import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, PawPrint, Calendar, TrendingUp, Activity } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [user] = useState(() => {
    const u = localStorage.getItem('auth_user')
    return u ? JSON.parse(u) : null
  })

  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ['api_clientes'],
    queryFn: async () => {
      try {
        const res = await fetch('http://localhost:8000/api/clientes')
        const json = await res.json()
        return Array.isArray(json?.data) ? json.data : []
      } catch (_) {
        return []
      }
    },
  });

  const { data: mascotas = [], isLoading: loadingMascotas } = useQuery({
    queryKey: ['api_mascotas'],
    queryFn: async () => {
      try {
        const res = await fetch('http://localhost:8000/api/mascotas')
        const json = await res.json()
        return Array.isArray(json?.data) ? json.data : []
      } catch (_) {
        return []
      }
    },
  });

  const { data: citas = [], isLoading: loadingCitas } = useQuery({
    queryKey: ['api_citas'],
    queryFn: async () => {
      try {
        const res = await fetch('http://localhost:8000/api/citas')
        const json = await res.json()
        const items = json?.data || []
        return items.map((item) => ({
          id: item?.cita_id,
          fecha: item?.fecha,
          hora: item?.hora,
          motivo: item?.motivo,
          estado: item?.estados?.nombre || item?.estado,
          estado_id: item?.estados?.MaeestroID ? Number(item.estados.MaeestroID) : (item?.estado && !isNaN(Number(item.estado)) ? Number(item.estado) : undefined),
          mascota_id: item?.mascota_id ? Number(item.mascota_id) : item?.mascota?.mascota_id,
          cliente_id: item?.cliente_id ? Number(item.cliente_id) : item?.cliente?.cliente_id,
        }))
      } catch (_) {
        return []
      }
    },
  });

  const { data: tratamientos = [], isLoading: loadingTratamientos } = useQuery({
    queryKey: ['api_tratamientos'],
    queryFn: async () => {
      try {
        const res = await fetch('http://localhost:8000/api/tratamientos')
        const json = await res.json()
        return Array.isArray(json?.data) ? json.data : []
      } catch (_) {
        return []
      }
    },
  });

  const citasPendientes = useMemo(() => {
    return citas.filter(c => {
      if (typeof c.estado === 'string') return c.estado === 'Pendiente' || c.estado === 'Confirmada'
      if (typeof c.estado_id === 'number') return [47, 48].includes(c.estado_id)
      return false
    }).length
  }, [citas])

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const citasHoy = useMemo(() => {
    return citas.filter(c => {
      if (!c.fecha) return false
      const norm = String(c.fecha).includes('/') ? String(c.fecha).replace(/\//g, '-') : String(c.fecha)
      return norm === todayStr
    }).length
  }, [citas, todayStr])

  const especiesData = mascotas.reduce((acc, m) => {
    const especie = m?.especie?.nombre || 'Otro';
    acc[especie] = (acc[especie] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(especiesData).map(([name, value]) => ({ name, value }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const estadoNombre = (c) => {
    if (typeof c.estado === 'string' && c.estado) return c.estado
    const map = { 47: 'Pendiente', 48: 'Confirmada', 49: 'Completada', 50: 'Cancelada' }
    return map[c.estado_id] || 'Desconocido'
  }
  const citasPorEstado = citas.reduce((acc, c) => {
    const name = estadoNombre(c)
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {})

  const barData = Object.entries(citasPorEstado).map(([name, value]) => ({ name, value }));

  const citasPorMes = citas.reduce((acc, c) => {
    if (c.fecha) {
      const norm = String(c.fecha).includes('/') ? String(c.fecha).replace(/\//g, '-') : String(c.fecha)
      const d = new Date(norm)
      const mes = isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('es-ES', { month: 'short' })
      acc[mes] = (acc[mes] || 0) + 1
    }
    return acc
  }, {})

  const proximasCitas = useMemo(() => {
    const now = new Date()
    const toDateTime = (c) => {
      if (!c.fecha || !c.hora) return null
      const f = String(c.fecha).includes('/') ? String(c.fecha).replace(/\//g, '-') : String(c.fecha)
      const dt = new Date(`${f}T${c.hora}:00`)
      return isNaN(dt.getTime()) ? null : dt
    }
    return citas
      .map(c => ({ ...c, dt: toDateTime(c) }))
      .filter(c => c.dt && c.dt >= now)
      .sort((a, b) => a.dt - b.dt)
      .slice(0, 5)
  }, [citas])

  const getMascotaNombre = (id) => {
    const m = mascotas.find(mm => Number(mm.mascota_id) === Number(id))
    return m?.nombre || ''
  }
  const getClienteNombre = (c) => {
    const m = mascotas.find(mm => Number(mm.mascota_id) === Number(c.mascota_id))
    if (m?.cliente?.nombre_completo) return m.cliente.nombre_completo
    const cli = clientes.find(cc => Number(cc.cliente_id) === Number(c.cliente_id))
    return cli?.nombre_completo || `${cli?.nombres || ''} ${cli?.apellidos || ''}`.trim()
  }

  const lineData = Object.entries(citasPorMes).map(([name, value]) => ({ name, value }));

  if (!user) {
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

        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Próximas Citas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Mascota</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proximasCitas.map((c) => (
                    <TableRow key={`${c.id}-${c.hora}`}>
                      <TableCell>{String(c.fecha).replace(/\//g, '-')}</TableCell>
                      <TableCell>{c.hora}</TableCell>
                      <TableCell>{getMascotaNombre(c.mascota_id)}</TableCell>
                      <TableCell>{getClienteNombre(c)}</TableCell>
                      <TableCell>{estadoNombre(c)}</TableCell>
                    </TableRow>
                  ))}
                  {proximasCitas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-gray-500">Sin citas próximas</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

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
