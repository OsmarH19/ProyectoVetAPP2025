import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, FileText, PawPrint, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MisCitas() {
  const [clienteId, setClienteId] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return;

    let email = "";
    let id = null;
    try {
      const parsed = JSON.parse(raw);
      email = parsed?.email || "";
      const rawId = parsed?.cliente_id ?? parsed?.cliente?.cliente_id;
      const numId = Number(rawId);
      if (Number.isFinite(numId) && numId > 0) id = numId;
    } catch {
      return;
    }

    if (id) {
      setClienteId(id);
      return;
    }

    if (!email) return;

    const loadClienteId = async () => {
      try {
        const res = await fetch("https://apivet.strategtic.com/api/clientes");
        const json = await res.json();
        const items = Array.isArray(json?.data) ? json.data : [];
        const found = items.find(
          (c) => String(c?.email || "").trim().toLowerCase() === email.trim().toLowerCase()
        );
        const resolvedId = Number(found?.cliente_id ?? found?.id ?? 0) || null;
        setClienteId(resolvedId);
      } catch {
        setClienteId(null);
      }
    };

    loadClienteId();
  }, []);

  const normalizedClienteId = useMemo(() => Number(clienteId ?? 0) || null, [clienteId]);

  const { data: citas = [] } = useQuery({
    queryKey: ["mis-citas", normalizedClienteId],
    queryFn: async () => {
      if (!normalizedClienteId) return [];
      const res = await fetch(
        `https://apivet.strategtic.com/api/citas?cliente_id=${normalizedClienteId}`
      );
      const json = await res.json();
      const items = Array.isArray(json?.data) ? json.data : [];
      return items.map((c) => ({
        id: c?.cita_id || c?.id,
        fecha: c?.fecha,
        hora: c?.hora,
        motivo: c?.motivo,
        estado: c?.estados?.nombre || c?.estado,
        mascota_id: c?.mascota_id ?? c?.mascota?.mascota_id,
        cliente_id: c?.cliente_id ?? c?.cliente?.cliente_id,
        observaciones: c?.observaciones,
        tratamientos: Array.isArray(c?.tratamientos) ? c.tratamientos : [],
        mascota: c?.mascota
          ? {
              id: c?.mascota?.mascota_id ?? c?.mascota?.id,
              nombre: c?.mascota?.nombre,
              especie: typeof c?.mascota?.especie === "object" ? c?.mascota?.especie?.nombre : c?.mascota?.especie,
              raza: c?.mascota?.raza,
            }
          : null,
        veterinario: c?.veterinario || null,
      }));
    },
    enabled: !!normalizedClienteId,
  });

  const { data: mascotas = [] } = useQuery({
    queryKey: ["mis-mascotas", normalizedClienteId],
    queryFn: async () => {
      if (!normalizedClienteId) return [];
      const res = await fetch(
        `https://apivet.strategtic.com/api/mascotas/filtrar?cliente_id=${normalizedClienteId}`
      );
      const json = await res.json();
      const items = Array.isArray(json?.data) ? json.data : [];
      return items.map((m) => ({
        id: m?.mascota_id ?? m?.id,
        nombre: m?.nombre,
        especie: typeof m?.especie === "object" ? m?.especie?.nombre : m?.especie,
        raza: m?.raza,
      }));
    },
    enabled: !!normalizedClienteId,
  });

  const { data: tratamientos = [] } = useQuery({
    queryKey: ["mis-tratamientos", normalizedClienteId],
    queryFn: async () => {
      if (!normalizedClienteId) return [];
      const res = await fetch(
        `https://apivet.strategtic.com/api/tratamientos?cliente_id=${normalizedClienteId}`
      );
      const json = await res.json();
      return Array.isArray(json?.data) ? json.data : [];
    },
    enabled: !!normalizedClienteId,
  });

  const estadoColors = {
    Pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
    Confirmada: "bg-blue-100 text-blue-800 border-blue-300",
    Completada: "bg-green-100 text-green-800 border-green-300",
    Cancelada: "bg-red-100 text-red-800 border-red-300",
  };

  const formatVeterinario = (value) => {
    if (!value) return "—";
    if (typeof value === "string") return value.trim() || "—";
    if (typeof value === "object") {
      const nombres = value?.nombres ?? "";
      const apellidos = value?.apellidos ?? "";
      const full = `${nombres} ${apellidos}`.trim();
      return full || "—";
    }
    return String(value);
  };

  const getMascota = (cita) =>
    cita?.mascota || mascotas.find((m) => m.id === cita.mascota_id) || null;

  const getTratamientosCount = (cita) => {
    const fromCita = Array.isArray(cita?.tratamientos) ? cita.tratamientos : [];
    if (fromCita.length > 0) return fromCita.length;
    return (tratamientos || []).filter((t) => t?.cita_id === cita.id).length;
  };

  const renderTable = (items) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Fecha</TableHead>
            <TableHead className="text-center">Hora</TableHead>
            <TableHead className="text-center">Mascota</TableHead>
            <TableHead className="text-center">Motivo</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-center">Veterinario</TableHead>
            <TableHead className="text-center">Tratamientos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((cita) => {
            const mascota = getMascota(cita);
            return (
              <TableRow key={cita.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{cita.fecha || "—"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{cita.hora || "—"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <PawPrint className="w-4 h-4 text-primary" />
                    <div>
                      <div className="font-semibold text-gray-900">{mascota?.nombre || "—"}</div>
                      <div className="text-xs text-gray-500">
                        {mascota?.especie || "—"} {mascota?.raza ? `- ${mascota.raza}` : ""}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="truncate max-w-[240px]">{cita.motivo || "—"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={estadoColors[cita.estado] || "bg-gray-100 text-gray-700"} variant="outline">
                    {cita.estado || "—"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{formatVeterinario(cita.veterinario)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">{getTratamientosCount(cita)}</TableCell>
              </TableRow>
            );
          })}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                No tienes citas registradas
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const citasPendientes = citas.filter((c) => c.estado === "Pendiente" || c.estado === "Confirmada");
  const citasCompletadas = citas.filter((c) => c.estado === "Completada");
  const citasCanceladas = citas.filter((c) => c.estado === "Cancelada");

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Citas</h1>
          <p className="text-gray-600 mt-1">Lista de tus citas registradas</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Citas ({citas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pendientes" className="space-y-6">
              <TabsList className="bg-white shadow-sm">
                <TabsTrigger value="pendientes">
                  Pendientes ({citasPendientes.length})
                </TabsTrigger>
                <TabsTrigger value="completadas">
                  Completadas ({citasCompletadas.length})
                </TabsTrigger>
                <TabsTrigger value="canceladas">
                  Canceladas ({citasCanceladas.length})
                </TabsTrigger>
                <TabsTrigger value="todas">
                  Todas ({citas.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pendientes">{renderTable(citasPendientes)}</TabsContent>
              <TabsContent value="completadas">{renderTable(citasCompletadas)}</TabsContent>
              <TabsContent value="canceladas">{renderTable(citasCanceladas)}</TabsContent>
              <TabsContent value="todas">{renderTable(citas)}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
