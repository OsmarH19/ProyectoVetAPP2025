import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, PawPrint, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
    queryKey: ['mis-citas', normalizedClienteId],
    queryFn: async () => {
      if (!normalizedClienteId) return [];
      const res = await fetch(`https://apivet.strategtic.com/api/citas?cliente_id=${normalizedClienteId}`);
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
              edad: c?.mascota?.edad,
              sexo: typeof c?.mascota?.sexo === "object" ? c?.mascota?.sexo?.nombre : c?.mascota?.sexo,
              peso: c?.mascota?.peso,
              color: c?.mascota?.color,
              foto_url: c?.mascota?.foto_url_completa || c?.mascota?.foto_url,
              observaciones: c?.mascota?.observaciones,
            }
          : null,
        cliente: c?.cliente || null,
        veterinario: c?.veterinario || null,
      }));
    },
    enabled: !!normalizedClienteId,
  });

  const { data: mascotas = [] } = useQuery({
    queryKey: ['mis-mascotas', normalizedClienteId],
    queryFn: async () => {
      if (!normalizedClienteId) return [];
      const res = await fetch(`https://apivet.strategtic.com/api/mascotas/filtrar?cliente_id=${normalizedClienteId}`);
      const json = await res.json();
      const items = Array.isArray(json?.data) ? json.data : [];
      return items.map((m) => ({
        id: m?.mascota_id ?? m?.id,
        nombre: m?.nombre,
        especie: typeof m?.especie === "object" ? m?.especie?.nombre : m?.especie,
        raza: m?.raza,
        edad: m?.edad,
        sexo: typeof m?.sexo === "object" ? m?.sexo?.nombre : m?.sexo,
        peso: m?.peso,
        color: m?.color,
        foto_url: m?.foto_url_completa || m?.foto_url,
        observaciones: m?.observaciones,
      }));
    },
    enabled: !!normalizedClienteId,
  });

  const { data: tratamientos = [] } = useQuery({
    queryKey: ['mis-tratamientos', normalizedClienteId],
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
    "Pendiente": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Confirmada": "bg-blue-100 text-blue-800 border-blue-300",
    "Completada": "bg-green-100 text-green-800 border-green-300",
    "Cancelada": "bg-red-100 text-red-800 border-red-300",
  };

  const citasPendientes = citas.filter(c => c.estado === 'Pendiente' || c.estado === 'Confirmada');
  const citasCompletadas = citas.filter(c => c.estado === 'Completada');
  const citasCanceladas = citas.filter(c => c.estado === 'Cancelada');

  const CitaCard = ({ cita }) => {
    const mascota = cita?.mascota || mascotas.find(m => m.id === cita.mascota_id);
    const tratamientosDeCita = Array.isArray(cita?.tratamientos) && cita.tratamientos.length > 0
      ? cita.tratamientos
      : tratamientos.filter(t => t.cita_id === cita.id);
    const tratamiento = tratamientosDeCita[0];
    const medicamentos = tratamiento && Array.isArray(tratamiento.medicamentos) ? tratamiento.medicamentos : [];

    return (
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {format(new Date(cita.fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {cita.hora}
              </p>
            </div>
            <Badge className={estadoColors[cita.estado]} variant="outline">
              {cita.estado}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PawPrint className="w-4 h-4 text-primary" />
              <p className="font-semibold text-gray-900">{mascota?.nombre}</p>
            </div>
            <p className="text-sm text-gray-600">{mascota?.especie} - {mascota?.raza}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 mb-1">Motivo</p>
            <p className="text-gray-700">{cita.motivo}</p>
          </div>

          {cita.veterinario && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>
                Dr. {typeof cita.veterinario === "object"
                  ? `${cita.veterinario?.nombres || ""} ${cita.veterinario?.apellidos || ""}`.trim()
                  : cita.veterinario}
              </span>
            </div>
          )}

          {tratamiento && (
            <div className="mt-4 pt-4 border-t bg-primary/5 -m-6 p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-gray-900">Tratamiento</h4>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Diagnóstico</p>
                  <p className="text-sm text-gray-700">{tratamiento.diagnostico}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">Tratamiento</p>
                  <p className="text-sm text-gray-700">{tratamiento.tratamiento_indicado}</p>
                </div>

                {medicamentos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-900">Medicamentos</p>
                    {medicamentos.map((med, idx) => (
                      <div key={med?.medicamento_id || `${med.nombre}-${idx}`} className="bg-white p-2 rounded border border-primary/20 text-sm">
                        <p className="font-semibold text-gray-900">{med.nombre}</p>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-gray-600">
                          {med.dosis && (
                            <div>
                              <span className="font-semibold">Dosis:</span> {med.dosis}
                            </div>
                          )}
                          {med.duracion && (
                            <div>
                              <span className="font-semibold">Duración:</span> {med.duracion}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {tratamiento.recomendaciones && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Recomendaciones</p>
                    <p className="text-sm text-gray-700">{tratamiento.recomendaciones}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {cita.observaciones && (
            <div>
              <p className="font-semibold text-gray-900 mb-1">Observaciones</p>
              <p className="text-sm text-gray-600">{cita.observaciones}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Citas</h1>
          <p className="text-gray-600 mt-1">Historial de citas y tratamientos</p>
        </div>

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

          <TabsContent value="pendientes">
            <div className="grid md:grid-cols-2 gap-6">
              {citasPendientes.map(cita => (
                <CitaCard key={cita.id} cita={cita} />
              ))}
              {citasPendientes.length === 0 && (
                <p className="col-span-full text-center text-gray-500 py-12">
                  No tienes citas pendientes
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completadas">
            <div className="grid md:grid-cols-2 gap-6">
              {citasCompletadas.map(cita => (
                <CitaCard key={cita.id} cita={cita} />
              ))}
              {citasCompletadas.length === 0 && (
                <p className="col-span-full text-center text-gray-500 py-12">
                  No tienes citas completadas
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="canceladas">
            <div className="grid md:grid-cols-2 gap-6">
              {citasCanceladas.map(cita => (
                <CitaCard key={cita.id} cita={cita} />
              ))}
              {citasCanceladas.length === 0 && (
                <p className="col-span-full text-center text-gray-500 py-12">
                  No tienes citas canceladas
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="todas">
            <div className="grid md:grid-cols-2 gap-6">
              {citas.map(cita => (
                <CitaCard key={cita.id} cita={cita} />
              ))}
              {citas.length === 0 && (
                <p className="col-span-full text-center text-gray-500 py-12">
                  No tienes citas registradas
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
