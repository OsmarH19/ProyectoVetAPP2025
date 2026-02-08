import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, FileText, Edit, Trash2, User, PawPrint, Stethoscope, Calendar } from "lucide-react";
import TratamientoForm from "../components/tratamientos/TratamientoForm";
import HistorialClinico from "../components/tratamientos/HistorialClinico";
import { setHistorialPdfUrl } from "@/lib/historialPdf";

export default function Tratamientos() {
  const [showForm, setShowForm] = useState(false);
  const [editingTratamiento, setEditingTratamiento] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 6;
  const [selectedMascotaId, setSelectedMascotaId] = useState(null);
  const [autoPdfMascotaId, setAutoPdfMascotaId] = useState(null);
  const queryClient = useQueryClient();
  const apiBase = import.meta.env.VITE_API_URL || "https://apivet.strategtic.com";

  const generateHistorialPdf = async (mascotaId) => {
    if (!mascotaId) return;
    try {
      const res = await fetch(`${apiBase}/api/mascotas/${mascotaId}/historial-pdf`);
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.data?.url) {
        setHistorialPdfUrl(mascotaId, json.data.url);
      }
    } catch {
      // ignore pdf generation failures
    }
  };

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

  const generateTratamientoPDF = async ({ cita_id, diagnostico, tratamiento_indicado, recomendaciones, veterinario_id, cliente_id, mascota_id, medicamentos }) => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF('p', 'mm', 'a4');

      const cita = (citas || []).find(c => c.id === Number(cita_id));
      const mascota = cita?.mascota || (mascotas || []).find(m => (m.mascota_id || m.id) === (cita?.mascota_id || mascota_id));
      const cliente = cita?.cliente || (clientes || []).find(cl => (cl.cliente_id || cl.id) === (cita?.cliente_id || cliente_id));
      const veterinario = (veterinarios || []).find(v => (v.veterinario_id || v.id) === Number(veterinario_id));

      const primario = '#5d55a3';
      const negro = '#111111';
      const gris = '#666666';

      const margin = 14;
      let y = margin;

      doc.setTextColor(primario);
      doc.setFontSize(18);
      doc.text('Tratamiento Médico', margin, y);
      y += 8;

      doc.setTextColor(gris);
      doc.setFontSize(11);
      const fechaStr = cita?.fecha ? String(cita.fecha) : '';
      const horaStr = cita?.hora ? String(cita.hora) : '';
      doc.text(`Fecha: ${fechaStr || '-'}  ${horaStr ? 'Hora: ' + horaStr : ''}`, margin, y);
      y += 10;

      // Paciente y cliente
      doc.setDrawColor(primario);
      doc.setLineWidth(0.4);
      doc.line(margin, y, 210 - margin, y);
      y += 6;

      doc.setTextColor(negro);
      doc.setFontSize(12);
      doc.text('Paciente', margin, y);
      doc.text('Cliente', 110, y);
      y += 6;

      doc.setTextColor(gris);
      doc.setFontSize(11);
      doc.text(`Nombre: ${mascota?.nombre || '-'}`, margin, y);
      doc.text(`Nombre: ${(cliente ? `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim() : '-')}`, 110, y);
      y += 6;
      doc.text(`Raza: ${mascota?.raza || '-'}`, margin, y);
      doc.text(`Teléfono: ${cliente?.telefono || '-'}`, 110, y);
      y += 10;

      // Veterinario
      doc.setTextColor(negro);
      doc.setFontSize(12);
      doc.text('Veterinario', margin, y);
      y += 6;
      doc.setTextColor(gris);
      doc.setFontSize(11);
      const vetNombre = veterinario ? `Dr. ${veterinario.nombres || ''} ${veterinario.apellidos || ''}`.trim() : '-';
      doc.text(vetNombre, margin, y);
      y += 10;

      // Diagnóstico
      doc.setTextColor(negro);
      doc.setFontSize(12);
      doc.text('Diagnóstico', margin, y);
      y += 6;
      doc.setTextColor(gris);
      doc.setFontSize(11);
      const diagLines = doc.splitTextToSize(diagnostico || '-', 210 - margin * 2);
      doc.text(diagLines, margin, y);
      y += Math.max(10, diagLines.length * 6);

      // Tratamiento indicado
      doc.setTextColor(negro);
      doc.setFontSize(12);
      doc.text('Tratamiento Indicado', margin, y);
      y += 6;
      doc.setTextColor(gris);
      doc.setFontSize(11);
      const tratLines = doc.splitTextToSize(tratamiento_indicado || '-', 210 - margin * 2);
      doc.text(tratLines, margin, y);
      y += Math.max(10, tratLines.length * 6);

      // Medicamentos
      const meds = Array.isArray(medicamentos) ? medicamentos.filter(m => (m.nombre || '').trim() !== '') : [];
      if (meds.length > 0) {
        doc.setTextColor(negro);
        doc.setFontSize(12);
        doc.text('Medicamentos', margin, y);
        y += 6;
        doc.setTextColor(gris);
        doc.setFontSize(11);
        meds.forEach((m, idx) => {
          const linea = `${idx + 1}. ${m.nombre || '-'} | Dosis: ${m.dosis || '-'} | Duración: ${m.duracion || '-'}`;
          const lns = doc.splitTextToSize(linea, 210 - margin * 2);
          doc.text(lns, margin, y);
          y += Math.max(8, lns.length * 6);
        });
      }

      // Recomendaciones
      doc.setTextColor(negro);
      doc.setFontSize(12);
      doc.text('Recomendaciones', margin, y);
      y += 6;
      doc.setTextColor(gris);
      doc.setFontSize(11);
      const recLines = doc.splitTextToSize(recomendaciones || '-', 210 - margin * 2);
      doc.text(recLines, margin, y);
      y += Math.max(10, recLines.length * 6);

      const nombreMascota = mascota?.nombre || 'Mascota';
      const nombreArchivo = `Tratamiento_${nombreMascota}_${fechaStr || ''}.pdf`;
      doc.save(nombreArchivo);
    } catch (e) {
      console.error('PDF error', e);
    }
  };

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

      return { created, mascotaId: Number(data.mascota_id) || Number(created?.mascota_id) };
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['api_tratamientos'] });
      setShowForm(false);
      setEditingTratamiento(null);
      if (result?.mascotaId) {
        await generateHistorialPdf(result.mascotaId);
      }
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
      return { mascotaId: Number(data.mascota_id) || Number(editingTratamiento?.mascota_id) };
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['api_tratamientos'] });
      setShowForm(false);
      setEditingTratamiento(null);
      if (result?.mascotaId) {
        await generateHistorialPdf(result.mascotaId);
      }
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

  const totalPages = Math.max(1, Math.ceil(filteredTratamientos.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const pagedTratamientos = filteredTratamientos.slice(start, start + perPage);
  React.useEffect(() => { setPage(1); }, [searchTerm]);

  const formatVeterinario = (value) => {
    if (!value) return '—';
    if (typeof value === 'string') return value.trim() || '—';
    if (typeof value === 'object') {
      const nombres = value.nombres ?? '';
      const apellidos = value.apellidos ?? '';
      const full = `${nombres} ${apellidos}`.trim();
      return full || '—';
    }
    return String(value);
  };

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
            className="bg-primary hover:bg-primary/90"
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
            <div
              className={`grid gap-6 items-start ${
                selectedMascotaId
                  ? "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_520px]"
                  : "grid-cols-1"
              }`}
            >
              <div className="space-y-6">
                <Card className="shadow-lg">
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

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Lista de Tratamientos ({filteredTratamientos.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-center">Mascota</TableHead>
                            <TableHead className="text-center">Cliente</TableHead>
                            <TableHead className="text-center">Diagnóstico</TableHead>
                            <TableHead className="text-center">Tratamiento</TableHead>
                            <TableHead className="text-center">Veterinario</TableHead>
                            <TableHead className="text-center">Fecha</TableHead>
                            <TableHead className="text-center">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagedTratamientos.map((tratamiento) => {
                            const mascotaNombre = tratamiento?.mascota?.nombre || '—';
                            const clienteNombre = `${tratamiento?.cliente?.nombres || ''} ${tratamiento?.cliente?.apellidos || ''}`.trim() || '—';
                            const vetNombre = formatVeterinario(tratamiento?.veterinario);
                            const fechaCita = tratamiento?.cita?.fecha || '—';
                            return (
                              <TableRow key={tratamiento.id} className="hover:bg-gray-50">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <PawPrint className="w-4 h-4 text-primary" />
                                    <span className="font-semibold text-gray-900">{mascotaNombre}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span>{clienteNombre}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm text-gray-700 truncate max-w-[240px]">
                                    {tratamiento.diagnostico || '—'}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-sm text-gray-700 truncate max-w-[240px]">
                                    <Stethoscope className="w-4 h-4 text-secondary" />
                                    <span>{tratamiento.tratamiento_indicado || '—'}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span>{vetNombre}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>{fechaCita}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => { setSelectedMascotaId(tratamiento.mascota_id); setAutoPdfMascotaId(tratamiento.mascota_id); }}
                                      title="Ver historial"
                                    >
                                      <FileText className="w-4 h-4 text-secondary" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(tratamiento)}
                                    >
                                      <Edit className="w-4 h-4 text-secondary" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(tratamiento.id)}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {filteredTratamientos.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                                No se encontraron tratamientos
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
              </div>

              {selectedMascotaId && (
                <div className="xl:sticky xl:top-24">
                  <HistorialClinico
                    mascotaId={selectedMascotaId}
                    autoGeneratePdf={autoPdfMascotaId === selectedMascotaId}
                    onClose={() => { setSelectedMascotaId(null); setAutoPdfMascotaId(null); }}
                    className="h-[70vh] xl:h-[calc(100vh-220px)] min-h-[480px]"
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}





