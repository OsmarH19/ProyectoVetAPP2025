import { apiUrl } from "@/lib/api";
﻿import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, PawPrint, Calendar, TrendingUp, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [user] = useState(() => {
    const u = localStorage.getItem("auth_user");
    return u ? JSON.parse(u) : null;
  });

  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ["api_clientes"],
    queryFn: async () => {
      try {
        const res = await fetch(apiUrl("/clientes"));
        const json = await res.json();
        return Array.isArray(json?.data) ? json.data : [];
      } catch (_) {
        return [];
      }
    },
  });

  const { data: mascotas = [], isLoading: loadingMascotas } = useQuery({
    queryKey: ["api_mascotas"],
    queryFn: async () => {
      try {
        const res = await fetch(apiUrl("/mascotas"));
        const json = await res.json();
        return Array.isArray(json?.data) ? json.data : [];
      } catch (_) {
        return [];
      }
    },
  });

  const { data: citas = [], isLoading: loadingCitas } = useQuery({
    queryKey: ["api_citas"],
    queryFn: async () => {
      try {
        const res = await fetch(apiUrl("/citas"));
        const json = await res.json();
        const items = json?.data || [];
        return items.map((item) => ({
          id: item?.cita_id,
          fecha: item?.fecha,
          hora: item?.hora,
          motivo: item?.motivo,
          estado: item?.estados?.nombre || item?.estado,
          estado_id: item?.estados?.MaeestroID
            ? Number(item.estados.MaeestroID)
            : item?.estado && !Number.isNaN(Number(item.estado))
              ? Number(item.estado)
              : undefined,
          mascota_id: item?.mascota_id ? Number(item.mascota_id) : item?.mascota?.mascota_id,
          cliente_id: item?.cliente_id ? Number(item.cliente_id) : item?.cliente?.cliente_id,
        }));
      } catch (_) {
        return [];
      }
    },
  });

  const { data: tratamientos = [], isLoading: loadingTratamientos } = useQuery({
    queryKey: ["api_tratamientos"],
    queryFn: async () => {
      try {
        const res = await fetch(apiUrl("/tratamientos"));
        const json = await res.json();
        return Array.isArray(json?.data) ? json.data : [];
      } catch (_) {
        return [];
      }
    },
  });

  const citasPendientes = useMemo(() => {
    return citas.filter((c) => {
      if (typeof c.estado === "string") return c.estado === "Pendiente" || c.estado === "Confirmada";
      if (typeof c.estado_id === "number") return [47, 48].includes(c.estado_id);
      return false;
    }).length;
  }, [citas]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    []
  );

  const citasHoy = useMemo(() => {
    return citas.filter((c) => {
      if (!c.fecha) return false;
      const norm = String(c.fecha).includes("/") ? String(c.fecha).replace(/\//g, "-") : String(c.fecha);
      return norm === todayStr;
    }).length;
  }, [citas, todayStr]);

  const especiesData = mascotas.reduce((acc, m) => {
    const especie = m?.especie?.nombre || "Otro";
    acc[especie] = (acc[especie] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(especiesData).map(([name, value]) => ({ name, value }));
  const COLORS = ["#5E56A3", "#2D6CDF", "#F4B740", "#2EAE6B", "#2D9CDB", "#E24A4A"];

  const estadoNombre = (c) => {
    if (typeof c.estado === "string" && c.estado) return c.estado;
    const map = { 47: "Pendiente", 48: "Confirmada", 49: "Completada", 50: "Cancelada" };
    return map[c.estado_id] || "Desconocido";
  };

  const citasPorEstado = citas.reduce((acc, c) => {
    const name = estadoNombre(c);
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.entries(citasPorEstado).map(([name, value]) => ({ name, value }));

  const citasPorMes = citas.reduce((acc, c) => {
    if (c.fecha) {
      const norm = String(c.fecha).includes("/") ? String(c.fecha).replace(/\//g, "-") : String(c.fecha);
      const d = new Date(norm);
      const mes = Number.isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("es-ES", { month: "short" });
      acc[mes] = (acc[mes] || 0) + 1;
    }
    return acc;
  }, {});

  const lineData = Object.entries(citasPorMes).map(([name, value]) => ({ name, value }));

  const proximasCitas = useMemo(() => {
    const now = new Date();

    const toDateTime = (c) => {
      if (!c.fecha || !c.hora) return null;
      const f = String(c.fecha).includes("/") ? String(c.fecha).replace(/\//g, "-") : String(c.fecha);
      const dt = new Date(`${f}T${c.hora}:00`);
      return Number.isNaN(dt.getTime()) ? null : dt;
    };

    return citas
      .map((c) => ({ ...c, dt: toDateTime(c) }))
      .filter((c) => c.dt && c.dt >= now)
      .sort((a, b) => a.dt - b.dt)
      .slice(0, 5);
  }, [citas]);

  const getMascotaNombre = (id) => {
    const m = mascotas.find((mm) => Number(mm.mascota_id) === Number(id));
    return m?.nombre || "";
  };

  const getClienteNombre = (c) => {
    const m = mascotas.find((mm) => Number(mm.mascota_id) === Number(c.mascota_id));
    if (m?.cliente?.nombre_completo) return m.cliente.nombre_completo;
    const cli = clientes.find((cc) => Number(cc.cliente_id) === Number(c.cliente_id));
    return cli?.nombre_completo || `${cli?.nombres || ""} ${cli?.apellidos || ""}`.trim();
  };

  const isLoadingDashboard = loadingClientes || loadingMascotas || loadingCitas || loadingTratamientos;
  const totalCitas = citas.length;

  const citasCompletadas = useMemo(() => {
    return citas.filter((c) => {
      if (typeof c.estado === "string") return c.estado.toLowerCase() === "completada";
      if (typeof c.estado_id === "number") return c.estado_id === 49;
      return false;
    }).length;
  }, [citas]);

  const tasaAtencion = totalCitas > 0 ? Math.round((citasCompletadas / totalCitas) * 100) : 0;

  const statusList = Object.entries(citasPorEstado)
    .map(([estado, cantidad]) => ({ estado, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);

  if (!user) {
    return (
      <div className="p-8">
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-2xl border border-border bg-white p-5 md:p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Dashboard Administrativo</h1>
              <p className="text-gray-600">Prioriza agenda, monitorea carga operativa y revisa rendimiento del dia.</p>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
              Actualizado: {todayLabel}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border border-border bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Citas Hoy</CardTitle>
              <Activity className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{citasHoy}</div>
              <p className="text-xs text-muted-foreground mt-1">Programadas para {todayLabel}</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Citas Pendientes</CardTitle>
              <Calendar className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{citasPendientes}</div>
              <p className="text-xs text-muted-foreground mt-1">Requieren atencion o confirmacion</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clientes</CardTitle>
              <Users className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{clientes.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Clientes registrados</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Mascotas</CardTitle>
              <PawPrint className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{mascotas.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Mascotas registradas</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Agenda Prioritaria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Fecha</TableHead>
                      <TableHead className="text-center">Hora</TableHead>
                      <TableHead className="text-center">Mascota</TableHead>
                      <TableHead className="text-center">Cliente</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proximasCitas.map((c) => (
                      <TableRow key={`${c.id}-${c.hora}`}>
                        <TableCell>{String(c.fecha).replace(/\//g, "-")}</TableCell>
                        <TableCell>{c.hora}</TableCell>
                        <TableCell>{getMascotaNombre(c.mascota_id)}</TableCell>
                        <TableCell>{getClienteNombre(c)}</TableCell>
                        <TableCell>{estadoNombre(c)}</TableCell>
                      </TableRow>
                    ))}
                    {proximasCitas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                          Sin citas proximas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Estado Operativo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Tasa de atencion</span>
                    <span className="font-semibold text-gray-900">{tasaAtencion}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${tasaAtencion}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {citasCompletadas} de {totalCitas} citas completadas
                  </p>
                </div>

                <div className="space-y-2">
                  {statusList.length > 0 ? (
                    statusList.map((status) => (
                      <div
                        key={status.estado}
                        className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                      >
                        <span className="text-sm text-gray-700">{status.estado}</span>
                        <Badge variant="outline" className="font-semibold">
                          {status.cantidad}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin estado de citas disponible.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border">
              <CardHeader>
                <CardTitle className="text-base">Produccion Clinica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span className="text-sm text-muted-foreground">Tratamientos registrados</span>
                  <span className="text-lg font-bold text-gray-900">{tratamientos.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Citas por Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDashboard ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#5E56A3" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-secondary" />
                Distribucion por Especie
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDashboard ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Evolucion de Citas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDashboard ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#5E56A3" strokeWidth={3} name="Citas" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
