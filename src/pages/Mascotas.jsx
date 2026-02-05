import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { MascotasApiCards } from "../components/mascotas/MascotaCard";
import MascotaForm from "../components/mascotas/MascotaForm";

export default function Mascotas() {
  const [showForm, setShowForm] = useState(false);
  const [editingMascota, setEditingMascota] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Mascota.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mascotas_api'] });
      setShowForm(false);
      setEditingMascota(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Mascota.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mascotas_api'] });
      setShowForm(false);
      setEditingMascota(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Mascota.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mascotas_api'] });
    },
  });

  const handleSubmit = (data) => {
    if (editingMascota) {
      updateMutation.mutate({ id: editingMascota.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (mascota) => {
    setEditingMascota(mascota);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta mascota?')) {
      deleteMutation.mutate(id);
    }
  };

  

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Mascotas</h1>
            <p className="text-gray-600 mt-1">Administra la información de las mascotas</p>
          </div>
          <Button
            onClick={() => {
              setEditingMascota(null);
              setShowForm(true);
            }}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Mascota
          </Button>
        </div>

        {showForm ? (
          <MascotaForm
            mascota={editingMascota}
            clientes={clientes}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingMascota(null);
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
                    placeholder="Buscar por nombre, especie o dueño..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              </CardHeader>
            </Card>

            <MascotasApiCards
              onEdit={handleEdit}
              onDelete={handleDelete}
              searchTerm={searchTerm}
            />
          </>
        )}
      </div>
    </div>
  );
}
