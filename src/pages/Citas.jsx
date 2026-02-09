import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import toastr from "toastr";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CitasList from "../components/citas/CitasList";
import CitasCalendar from "../components/citas/CitasCalendar";
import CitaForm from "../components/citas/CitaForm";

export default function Citas() {
  const [showForm, setShowForm] = useState(false);
  const [editingCita, setEditingCita] = useState(null);
  const [activeTab, setActiveTab] = useState("lista");
  const queryClient = useQueryClient();

  const { data: citas = [] } = useQuery({
    queryKey: ['api_citas'],
    queryFn: async () => {
      const res = await fetch('https://apivet.strategtic.com/api/citas');
      const json = await res.json();
      const items = json?.data || [];
      return items.map((item) => ({
        id: item?.cita_id,
        fecha: item?.fecha,
        hora: item?.hora,
        motivo: item?.motivo,
        estado: item?.estados?.nombre || item?.estado,
        estado_id: item?.estados?.MaeestroID ? Number(item.estados.MaeestroID) : (item?.estado && !isNaN(Number(item.estado)) ? Number(item.estado) : undefined),
        mascota_id: item?.mascota_id ? Number(item.mascota_id) : item?.mascota?.mascota_id,
        cliente_id: item?.cliente_id ? Number(item.cliente_id) : item?.cliente?.cliente_id,
        veterinario: item?.veterinario ? `${item.veterinario?.nombres || ''} ${item.veterinario?.apellidos || ''}`.trim() : '',
        veterinario_id: item?.veterinario_id ? Number(item.veterinario_id) : (item?.veterinario?.veterinario_id ?? undefined),
        observaciones: item?.observaciones || '',
        mascota: item?.mascota || null,
        cliente: item?.cliente || null,
      }));
    },
  });


  const { data: mascotas = [] } = useQuery({
    queryKey: ['mascotas'],
    queryFn: () => base44.entities.Mascota.list(),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: veterinarios = [] } = useQuery({
    queryKey: ['veterinarios'],
    queryFn: () => base44.entities.Veterinario.list(),
  });

const createMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        fecha: data.fecha,
        hora: data.hora,
        motivo: data.motivo,
        estado: isNaN(Number(data.estado_id)) ? data.estado_id : Number(data.estado_id),
        mascota_id: isNaN(Number(data.mascota_id)) ? data.mascota_id : Number(data.mascota_id),
        cliente_id: isNaN(Number(data.cliente_id)) ? data.cliente_id : Number(data.cliente_id),
        veterinario_id: isNaN(Number(data.veterinario_id)) ? data.veterinario_id : Number(data.veterinario_id),
        observaciones: data.observaciones || '',
        activo: 1,
      }
      const res = await fetch('https://apivet.strategtic.com/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('No fue posible crear la cita')
      return res.json()
    },
    onSuccess: async () => {
      toastr.success("Cita registrada correctamente.");
      await queryClient.invalidateQueries({ queryKey: ['api_citas'] });
      setShowForm(false);
      setEditingCita(null);
    },
    onError: (err) => {
      toastr.error(err.message || "No se pudo crear la cita.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const payload = {
        fecha: data.fecha,
        hora: data.hora,
        motivo: data.motivo,
        estado: isNaN(Number(data.estado_id)) ? data.estado_id : Number(data.estado_id),
        mascota_id: isNaN(Number(data.mascota_id)) ? data.mascota_id : Number(data.mascota_id),
        cliente_id: isNaN(Number(data.cliente_id)) ? data.cliente_id : Number(data.cliente_id),
        veterinario_id: isNaN(Number(data.veterinario_id)) ? data.veterinario_id : Number(data.veterinario_id),
        observaciones: data.observaciones || '',
      }
      const res = await fetch(`https://apivet.strategtic.com/api/citas/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('No fue posible actualizar la cita')
      return res.json()
    },
    onSuccess: async () => {
      toastr.success("Cita actualizada correctamente.");
      await queryClient.invalidateQueries({ queryKey: ['api_citas'] });
      setShowForm(false);
      setEditingCita(null);
    },
    onError: (err) => {
      toastr.error(err.message || "No se pudo actualizar la cita.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cita.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['api_citas'] });
      toastr.success("Cita eliminada correctamente.");
    },
    onError: (err) => {
      toastr.error(err.message || "No se pudo eliminar la cita.");
    },
  });

  const handleSubmit = (data) => {
    const isConflict = citas.some(c => 
      c.id !== editingCita?.id &&
      c.fecha === data.fecha &&
      c.hora === data.hora &&
      (c.estado === 'Pendiente' || c.estado === 'Confirmada')
    );

    if (isConflict) {
      toastr.warning('Ya existe una cita en ese horario. Por favor seleccione otro horario.');
      return;
    }

    if (editingCita) {
      updateMutation.mutate({ id: editingCita.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (cita) => {
    setEditingCita(cita);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta cita?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleChangeStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`https://apivet.strategtic.com/api/citas/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus }),
      });
      if (!res.ok) {
        throw new Error('Error actualizando estado');
      }
      await queryClient.invalidateQueries({ queryKey: ['api_citas'] });
    } catch (e) {
      console.error(e);
      toastr.error('No se pudo actualizar el estado de la cita');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Citas</h1>
            <p className="text-gray-600 mt-1">Administra las citas veterinarias</p>
          </div>
          <Button
            onClick={() => {
              setEditingCita(null);
              setShowForm(true);
            }}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cita
          </Button>
        </div>
{/*  */}
        {showForm ? (
          <CitaForm
            cita={editingCita}
            mascotas={mascotas}
            clientes={clientes}
            veterinarios={veterinarios}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingCita(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-white shadow-sm">
              <TabsTrigger value="lista">Lista</TabsTrigger>
              <TabsTrigger value="calendario">Calendario</TabsTrigger>
            </TabsList>

              <TabsContent value="lista">
                <CitasList
                  citas={citas}
                  mascotas={mascotas}
                  clientes={clientes}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onChangeStatus={handleChangeStatus}
                />
              </TabsContent>

            <TabsContent value="calendario">
              <CitasCalendar
                citas={citas}
                mascotas={mascotas}
                clientes={clientes}
                onEdit={handleEdit}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

// 