import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, PawPrint, User, Weight } from "lucide-react";
import MascotaForm from "../components/mascotas/MascotaForm";

export default function Mascotas() {
  const [showForm, setShowForm] = useState(false);
  const [editingMascota, setEditingMascota] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 6;
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

  const { data: mascotasApi = [], isLoading: loadingMascotas, isError: errorMascotas } = useQuery({
    queryKey: ["mascotas_api"],
    queryFn: async () => {
      const res = await fetch("https://apivet.strategtic.com/api/mascotas");
      if (!res.ok) {
        throw new Error("Error al cargar mascotas");
      }
      const json = await res.json();
      return json?.data || [];
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

  

  const mascotas = useMemo(() => {
    return (mascotasApi || []).map((item) => ({
      id: item?.mascota_id ?? item?.id,
      nombre: item?.nombre,
      especie: item?.especie?.nombre ?? item?.especie,
      raza: item?.raza,
      edad: item?.edad,
      sexo: item?.sexo?.nombre ?? item?.sexo,
      peso: item?.peso,
      color: item?.color,
      foto_url: item?.foto_url,
      observaciones: item?.observaciones,
      cliente_id: item?.cliente?.cliente_id ?? item?.cliente_id,
      cliente: item?.cliente || null,
      cliente_nombre: item?.cliente?.nombre_completo ||
        `${item?.cliente?.nombres || ''} ${item?.cliente?.apellidos || ''}`.trim(),
    }));
  }, [mascotasApi]);

  const filteredMascotas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return mascotas;
    return mascotas.filter(m => {
      return (
        (m.nombre || '').toLowerCase().includes(term) ||
        (m.especie || '').toLowerCase().includes(term) ||
        (m.cliente_nombre || '').toLowerCase().includes(term)
      );
    });
  }, [mascotas, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredMascotas.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const pagedMascotas = filteredMascotas.slice(start, start + perPage);

  useEffect(() => { setPage(1); }, [searchTerm]);

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

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Lista de Mascotas ({filteredMascotas.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mascota</TableHead>
                        <TableHead>Especie / Raza</TableHead>
                        <TableHead>Dueño</TableHead>
                        <TableHead>Detalles</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingMascotas && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            Cargando mascotas...
                          </TableCell>
                        </TableRow>
                      )}
                      {errorMascotas && !loadingMascotas && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-red-600">
                            Error al cargar mascotas
                          </TableCell>
                        </TableRow>
                      )}
                      {!loadingMascotas && !errorMascotas && pagedMascotas.map((mascota) => (
                        <TableRow key={mascota.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {mascota.foto_url ? (
                                <img
                                  src={mascota.foto_url}
                                  alt={mascota.nombre}
                                  className="w-10 h-10 rounded-full object-cover border border-border"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                                  {mascota.nombre?.[0] || "M"}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">{mascota.nombre}</p>
                                {mascota.sexo && (
                                  <p className="text-sm text-gray-500">{mascota.sexo}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-2">
                              {mascota.especie && (
                                <Badge variant="outline">{mascota.especie}</Badge>
                              )}/
                              {mascota.raza && (
                                <span className="text-sm text-gray-600">{mascota.raza}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>{mascota.cliente_nombre || "Sin dueño"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              {mascota.edad ? (
                                <div className="flex items-center gap-2">
                                  <PawPrint className="w-4 h-4 text-primary" />
                                  <span>{mascota.edad} años</span>
                                </div>
                              ) : (
                                <span>—</span>
                              )}/
                              {mascota.peso && (
                                <div className="flex items-center gap-2">
                                  <Weight className="w-4 h-4 text-gray-400" />
                                  <span>{mascota.peso} kg</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(mascota)}
                              >
                                <Edit className="w-4 h-4 text-secondary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(mascota.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!loadingMascotas && !errorMascotas && filteredMascotas.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            No se encontraron mascotas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">Página {currentPage} de {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
                    <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
