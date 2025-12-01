import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import toastr from "toastr";
import VeterinarioCard from "../components/veterinarios/VeterinarioCard";
import VeterinarioForm from "../components/veterinarios/VeterinarioForm";

export default function Veterinarios() {
  const [showForm, setShowForm] = useState(false);
  const [editingVeterinario, setEditingVeterinario] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 6;
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
      if (!res.ok) throw new Error('No fue posible registrar al veterinario');
      return res.json();
    },
    onSuccess: () => {
      toastr.success("Veterinario registrado correctamente.");
      queryClient.invalidateQueries({ queryKey: ['veterinarios_api'] });
      setShowForm(false);
      setEditingVeterinario(null);
    },
    onError: (err) => {
      toastr.error(err.message || "No se pudo crear el veterinario.");
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
      if (!res.ok) throw new Error('No fue posible actualizar el veterinario');
      return res.json();
    },
    onSuccess: () => {
      toastr.success("Veterinario actualizado correctamente.");
      queryClient.invalidateQueries({ queryKey: ['veterinarios_api'] });
      setShowForm(false);
      setEditingVeterinario(null);
    },
    onError: (err) => {
      toastr.error(err.message || "No se pudo actualizar el veterinario.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return Promise.resolve();
    },
    onSuccess: () => {
      toastr.success("Veterinario eliminado correctamente.");
      queryClient.invalidateQueries({ queryKey: ['veterinarios_api'] });
    },
    onError: (err) => {
      toastr.error(err.message || "No se pudo eliminar el veterinario.");
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

  const totalPages = Math.max(1, Math.ceil(filteredVeterinarios.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const pagedVeterinarios = filteredVeterinarios.slice(start, start + perPage);
  React.useEffect(() => { setPage(1); }, [searchTerm]);

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
              {pagedVeterinarios.map((veterinario) => (
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
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">Página {currentPage} de {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
                <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
