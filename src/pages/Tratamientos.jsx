import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import TratamientoCard from "../components/tratamientos/TratamientoCard";
import TratamientoForm from "../components/tratamientos/TratamientoForm";
import HistorialClinico from "../components/tratamientos/HistorialClinico";

export default function Tratamientos() {
  const [showForm, setShowForm] = useState(false);
  const [editingTratamiento, setEditingTratamiento] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMascotaId, setSelectedMascotaId] = useState(null);
  const queryClient = useQueryClient();

  const { data: tratamientos = [] } = useQuery({
    queryKey: ['api_tratamientos'],
    queryFn: async () => {
      try {
        const res = await fetch('https://apivet.strategtic.com/api/tratamientos')
        const json = await res.json()
        const items = Array.isArray(json?.data) ? json.data : []
        return items.map(item => ({
          id: item?.tratamiento_id,
          cita_id: item?.cita_id ? Number(item.cita_id) : (item?.cita?.cita_id ?? undefined),
          diagnostico: item?.diagnostico,
          tratamiento_indicado: item?.tratamiento_indicado,
          recomendaciones: item?.recomendaciones,
          veterinario_id: item?.veterinario_id ? Number(item.veterinario_id) : (item?.veterinario?.veterinario_id ?? undefined),
          cliente_id: item?.cliente_id ? Number(item.cliente_id) : (item?.cliente?.cliente_id ?? undefined),
          mascota_id: item?.mascota_id ? Number(item.mascota_id) : (item?.mascota?.mascota_id ?? undefined),
          veterinario: item?.veterinario ? `${item.veterinario.nombres} ${item.veterinario.apellidos}` : '',
          cliente: item?.cliente || null,
          mascota: item?.mascota || null,
          cita: item?.cita || null,
        }))
      } catch (_) {
        return []
      }
    },
  });

  const { data: citas = [] } = useQuery({
    queryKey: ['api_citas'],
    queryFn: async () => {
      try {
        const res = await fetch('https://apivet.strategtic.com/api/citas')
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
          veterinario_id: item?.veterinario_id ? Number(item.veterinario_id) : (item?.veterinario?.veterinario_id ?? undefined),
          observaciones: item?.observaciones || '',
          mascota: item?.mascota || null,
          cliente: item?.cliente || null,
        }))
      } catch (_) {
        return []
      }
    },
  });

  const { data: mascotas = [] } = useQuery({
    queryKey: ['api_mascotas'],
    queryFn: async () => {
      try {
        const res = await fetch('https://apivet.strategtic.com/api/mascotas')
        const json = await res.json()
        return Array.isArray(json?.data) ? json.data : []
      } catch (_) {
        return []
      }
    },
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['api_clientes'],
    queryFn: async () => {
      try {
        const res = await fetch('https://apivet.strategtic.com/api/clientes')
        const json = await res.json()
        return Array.isArray(json?.data) ? json.data : []
      } catch (_) {
        return []
      }
    },
  });

  const { data: veterinarios = [] } = useQuery({
    queryKey: ['api_veterinarios'],
    queryFn: async () => {
      try {
        const res = await fetch('https://apivet.strategtic.com/api/veterinarios')
        const json = await res.json()
        return Array.isArray(json?.data) ? json.data : []
      } catch (_) {
        return []
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const body = {
        cita_id: Number(data.cita_id),
        diagnostico: data.diagnostico,
        tratamiento_indicado: data.tratamiento_indicado,
        recomendaciones: data.recomendaciones || '',
        veterinario_id: Number(data.veterinario_id),
        cliente_id: Number(data.cliente_id),
        mascota_id: Number(data.mascota_id),
      };

      const res = await fetch('https://apivet.strategtic.com/api/tratamientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      const created = json?.data || json;
      const tratamientoId = created?.tratamiento_id || created?.id || created?.data?.tratamiento_id;

      if (!tratamientoId) throw new Error('No se obtuvo tratamiento_id tras crear tratamiento');

      const meds = Array.isArray(data.medicamentos) ? data.medicamentos.filter(m => (m.nombre || '').trim() !== '') : [];
      await Promise.all(meds.map(async (m) => {
        const medBody = {
          tratamiento_id: Number(tratamientoId),
          nombre: m.nombre,
          dosis: m.dosis || '',
          duracion: m.duracion || '',
        };
        await fetch('https://apivet.strategtic.com/api/medicamentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(medBody),
        });
      }));

      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_tratamientos'] });
      setShowForm(false);
      setEditingTratamiento(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const body = {
        cita_id: Number(data.cita_id),
        diagnostico: data.diagnostico,
        tratamiento_indicado: data.tratamiento_indicado,
        recomendaciones: data.recomendaciones || '',
        veterinario_id: Number(data.veterinario_id),
        cliente_id: Number(data.cliente_id),
        mascota_id: Number(data.mascota_id),
      };

      const res = await fetch(`https://apivet.strategtic.com/api/tratamientos/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      await res.json();

      const meds = Array.isArray(data.medicamentos) ? data.medicamentos.filter(m => (m.nombre || '').trim() !== '') : [];
      await Promise.all(meds.map(async (m) => {
        const medBody = {
          tratamiento_id: Number(id),
          nombre: m.nombre,
          dosis: m.dosis || '',
          duracion: m.duracion || '',
        };
        if (m.medicamento_id || m.id) {
          const medId = m.medicamento_id || m.id;
          await fetch(`https://apivet.strategtic.com/api/medicamentos/${medId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(medBody),
          });
        } else {
          await fetch('https://apivet.strategtic.com/api/medicamentos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...medBody }),
          });
        }
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_tratamientos'] });
      setShowForm(false);
      setEditingTratamiento(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Tratamiento.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_tratamientos'] });
    },
  });

  const handleSubmit = (data) => {
    if (editingTratamiento) {
      updateMutation.mutate({ id: editingTratamiento.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (tratamiento) => {
    setEditingTratamiento(tratamiento);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este tratamiento?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredTratamientos = tratamientos.filter(t => {
    const mascotaNombre = t?.mascota?.nombre || ''
    const clienteNombre = `${t?.cliente?.nombres || ''} ${t?.cliente?.apellidos || ''}`.trim()
    const searchMatch = 
      mascotaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.diagnostico || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      clienteNombre.toLowerCase().includes(searchTerm.toLowerCase());
    return searchMatch;
  });

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tratamientos y Recetas</h1>
            <p className="text-gray-600 mt-1">Gestiona los tratamientos médicos</p>
          </div>
          <Button
            onClick={() => {
              setEditingTratamiento(null);
              setShowForm(true);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Tratamiento
          </Button>
        </div>

        {showForm ? (
          <TratamientoForm
            tratamiento={editingTratamiento}
            citas={citas}
            mascotas={mascotas}
            clientes={clientes}
            veterinarios={veterinarios}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingTratamiento(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        ) : (
          <>
            {selectedMascotaId && (
              <HistorialClinico
                mascotaId={selectedMascotaId}
                onClose={() => setSelectedMascotaId(null)}
              />
            )}

            <Card className="shadow-lg mb-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Buscar por mascota, diagnóstico o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              </CardHeader>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {filteredTratamientos.map((tratamiento) => (
                <TratamientoCard
                  key={tratamiento.id}
                  tratamiento={tratamiento}
                  mascota={tratamiento.mascota}
                  cliente={tratamiento.cliente}
                  cita={tratamiento.cita}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewHistorial={() => setSelectedMascotaId(tratamiento.mascota_id)}
                />
              ))}
              {filteredTratamientos.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No se encontraron tratamientos
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
