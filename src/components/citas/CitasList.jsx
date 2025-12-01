import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Calendar, Clock, User, PawPrint } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function CitasList({ citas, mascotas, clientes, onEdit, onDelete, onChangeStatus }) {
  const [filterEstado, setFilterEstado] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const estadoColors = {
    "Pendiente": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Confirmada": "bg-blue-100 text-blue-800 border-blue-300",
    "Completada": "bg-green-100 text-green-800 border-green-300",
    "Cancelada": "bg-red-100 text-red-800 border-red-300",
  };

  const filteredCitas = filterEstado === "all" 
    ? citas 
    : citas.filter(c => c.estado === filterEstado);

  const totalPages = Math.max(1, Math.ceil(filteredCitas.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const pagedCitas = filteredCitas.slice(start, start + perPage);
  
  React.useEffect(() => { setPage(1); }, [filterEstado]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Lista de Citas ({filteredCitas.length})</CardTitle>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Pendiente">Pendientes</SelectItem>
              <SelectItem value="Confirmada">Confirmadas</SelectItem>
              <SelectItem value="Completada">Completadas</SelectItem>
              <SelectItem value="Cancelada">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Mascota</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedCitas.map((cita) => {
                const mascota = mascotas.find(m => m.id === cita.mascota_id);
                const cliente = clientes.find(c => c.id === cita.cliente_id);
                const mascotaNombre = mascota?.nombre ?? cita?.mascota?.nombre;
                const clienteNombre = cliente ? `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim() : `${cita?.cliente?.nombres || ''} ${cita?.cliente?.apellidos || ''}`.trim();

                return (
                  <TableRow key={cita.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-semibold text-gray-900">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          {cita.fecha && format(new Date(cita.fecha), "dd MMM yyyy", { locale: es })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {cita.hora}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PawPrint className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="font-semibold">{mascotaNombre}</p>
                          {mascota?.especie && (
                            <p className="text-sm text-gray-500">{mascota.especie}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{clienteNombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{cita.motivo}</p>
                      {cita.veterinario && (
                        <p className="text-xs text-gray-500 mt-1">Dr. {cita.veterinario}</p>
                      )}
                    </TableCell>
                    <TableCell>
                    <Select
                      value={cita.estado}
                      onValueChange={(value) => onChangeStatus(cita.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <Badge className={estadoColors[cita.estado]} variant="outline">
                          {cita.estado}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          <SelectItem value="Confirmada">Confirmada</SelectItem>
                          <SelectItem value="Completada">Completada</SelectItem>
                          <SelectItem value="Cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(cita)}
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(cita.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredCitas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No se encontraron citas
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
  );
}
