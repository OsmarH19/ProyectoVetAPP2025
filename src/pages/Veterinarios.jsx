import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import VeterinarioCard from "../components/veterinarios/VeterinarioCard";
import VeterinarioForm from "../components/veterinarios/VeterinarioForm";

export default function Veterinarios() {
  const [showForm, setShowForm] = useState(false);
  const [editingVeterinario, setEditingVeterinario] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: veterinarios = [] } = useQuery({
    queryKey: ['veterinarios_api'],
    queryFn: async () => {
      const res = await fetch('https://apivet.strategtic.com/api/veterinarios');
      const json = await res.json();
      const arr = json?.data || [];
      return arr.map(v => ({
        id: v.veterinario_id,
        nombres: v.nombres,
        apellidos: v.apellidos,
        especialidad: v.especialidad,
        telefono: v.telefono,
        email: v.email,
        activo: !!v.activo,
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        nombres: data.nombres,
        apellidos: data.apellidos,
        especialidad: data.especialidad,
        telefono: data.telefono,
        email: data.email,
        activo: data.activo ? '1' : '0',
      };
      const res = await fetch('https://apivet.strategtic.com/api/veterinarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error creando veterinario');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veterinarios_api'] });
      setShowForm(false);
      setEditingVeterinario(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const payload = {
        nombres: data.nombres,
        apellidos: data.apellidos,
        especialidad: data.especialidad,
        telefono: data.telefono,
        email: data.email,
        activo: data.activo ? '1' : '0',
      };
      const res = await fetch(`https://apivet.strategtic.com/api/veterinarios/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error actualizando veterinario');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veterinarios_api'] });
      setShowForm(false);
      setEditingVeterinario(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veterinarios_api'] });
    },
  });

  const handleSubmit = (data) => {
    if (editingVeterinario) {
      updateMutation.mutate({ id: editingVeterinario.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (veterinario) => {
    setEditingVeterinario(veterinario);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este veterinario?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredVeterinarios = veterinarios.filter(v =>
    v.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.especialidad?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Veterinarios</h1>
            <p className="text-gray-600 mt-1">Gestiona los veterinarios y sus turnos</p>
          </div>
          <Button
            onClick={() => {
              setEditingVeterinario(null);
              setShowForm(true);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Veterinario
          </Button>
        </div>

        {showForm ? (
          <VeterinarioForm
            veterinario={editingVeterinario}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingVeterinario(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        ) : (
          <>
            <Card className="shadow-lg mb-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre o especialidad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              </CardHeader>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVeterinarios.map((veterinario) => (
                <VeterinarioCard
                  key={veterinario.id}
                  veterinario={veterinario}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
              {filteredVeterinarios.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No se encontraron veterinarios
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
