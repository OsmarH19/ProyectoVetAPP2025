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
    queryKey: ['tratamientos'],
    queryFn: () => base44.entities.Tratamiento.list('-created_date'),
  });

  const { data: citas = [] } = useQuery({
    queryKey: ['citas'],
    queryFn: () => base44.entities.Cita.list(),
  });

  const { data: mascotas = [] } = useQuery({
    queryKey: ['mascotas'],
    queryFn: () => base44.entities.Mascota.list(),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tratamiento.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tratamientos'] });
      setShowForm(false);
      setEditingTratamiento(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tratamiento.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tratamientos'] });
      setShowForm(false);
      setEditingTratamiento(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Tratamiento.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tratamientos'] });
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
    const mascota = mascotas.find(m => m.id === t.mascota_id);
    const cliente = clientes.find(c => c.id === t.cliente_id);
    const searchMatch = 
      mascota?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.diagnostico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente?.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
                  mascota={mascotas.find(m => m.id === tratamiento.mascota_id)}
                  cliente={clientes.find(c => c.id === tratamiento.cliente_id)}
                  cita={citas.find(c => c.id === tratamiento.cita_id)}
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