import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Download, FileText, User, Mail, Phone, MapPin, PawPrint, Calendar, Stethoscope, Pill } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function HistorialClinico({ mascotaId, onClose }) {
  const printRef = useRef();
  const [downloading, setDownloading] = useState(false);

  const { data: mascota } = useQuery({
    queryKey: ['mascota', mascotaId],
    queryFn: async () => {
      const mascotas = await base44.entities.Mascota.list();
      return mascotas.find(m => m.id === mascotaId);
    },
  });

  const { data: cliente } = useQuery({
    queryKey: ['cliente', mascota?.cliente_id],
    queryFn: async () => {
      if (!mascota?.cliente_id) return null;
      const clientes = await base44.entities.Cliente.list();
      return clientes.find(c => c.id === mascota.cliente_id);
    },
    enabled: !!mascota?.cliente_id,
  });

  const { data: citas = [] } = useQuery({
    queryKey: ['citas', mascotaId],
    queryFn: async () => {
      const allCitas = await base44.entities.Cita.list('-fecha');
      return allCitas.filter(c => c.mascota_id === mascotaId);
    },
  });

  const { data: tratamientos = [] } = useQuery({
    queryKey: ['tratamientos', mascotaId],
    queryFn: async () => {
      const allTratamientos = await base44.entities.Tratamiento.list('-created_date');
      return allTratamientos.filter(t => t.mascota_id === mascotaId);
    },
  });

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Historial_Clinico_${mascota?.nombre}_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    } finally {
      setDownloading(false);
    }
  };

  const estadoColors = {
    "Pendiente": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Confirmada": "bg-blue-100 text-blue-800 border-blue-300",
    "Completada": "bg-green-100 text-green-800 border-green-300",
    "Cancelada": "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto">
      <Card className="w-full max-w-6xl bg-white shadow-2xl my-8 max-h-[92vh] flex flex-col">
        <CardHeader className="bg-gradient-to-r from-green-600 via-green-500 to-blue-600 text-white flex-shrink-0 border-b-4 border-green-700">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-3">
                <FileText className="w-8 h-8" />
                Historial Clínico
              </CardTitle>
              <p className="text-sm mt-2 opacity-90 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Generado el {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="bg-white hover:bg-gray-100 text-green-700 font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                {downloading ? 'Generando...' : 'Descargar PDF'}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-6 overflow-auto flex-1 bg-gray-50">
          <div ref={printRef} className="bg-white p-8 rounded-lg shadow-sm">
            {/* Header con logo */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8 rounded-t-xl mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">VetCare</h1>
                  <p className="text-lg opacity-90">Historial Clínico Veterinario</p>
                </div>
                <div className="text-right text-sm opacity-90">
                  <p className="font-semibold">Fecha de generación:</p>
                  <p>{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}</p>
                </div>
              </div>
            </div>

            {/* Información en dos columnas */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Información del Cliente */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-blue-300">
                  <User className="w-6 h-6 text-blue-700" />
                  <h3 className="text-xl font-bold text-blue-900">Información del Cliente</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-blue-700 font-semibold">Nombre Completo</p>
                      <p className="text-gray-900 font-semibold">{cliente?.nombres} {cliente?.apellidos}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-blue-700 font-semibold">DNI</p>
                      <p className="text-gray-900">{cliente?.dni}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-blue-700 font-semibold">Teléfono</p>
                      <p className="text-gray-900">{cliente?.telefono}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-blue-700 font-semibold">Email</p>
                      <p className="text-gray-900">{cliente?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-blue-700 font-semibold">Dirección</p>
                      <p className="text-gray-900">{cliente?.direccion}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de la Mascota */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-green-300">
                  <PawPrint className="w-6 h-6 text-green-700" />
                  <h3 className="text-xl font-bold text-green-900">Información de la Mascota</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-green-700 font-semibold">Nombre</p>
                    <p className="text-gray-900 font-bold text-lg">{mascota?.nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 font-semibold">Especie</p>
                    <p className="text-gray-900">{mascota?.especie}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 font-semibold">Raza</p>
                    <p className="text-gray-900">{mascota?.raza}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 font-semibold">Edad</p>
                    <p className="text-gray-900">{mascota?.edad} años</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 font-semibold">Sexo</p>
                    <p className="text-gray-900">{mascota?.sexo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 font-semibold">Peso</p>
                    <p className="text-gray-900">{mascota?.peso} kg</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-green-700 font-semibold">Color/Descripción</p>
                    <p className="text-gray-900">{mascota?.color}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Historial Cronológico */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-gray-300">
                <Stethoscope className="w-7 h-7 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Historial Cronológico de Consultas</h2>
              </div>
              
              <div className="space-y-6">
                {citas.map((cita, index) => {
                  const tratamiento = tratamientos.find(t => t.cita_id === cita.id);
                  const medicamentos = tratamiento && Array.isArray(tratamiento.medicamentos) ? tratamiento.medicamentos : [];
                  
                  return (
                    <div key={cita.id} className="border-l-4 border-green-500 pl-6 relative">
                      {/* Número de consulta */}
                      <div className="absolute -left-8 top-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                        {index + 1}
                      </div>

                      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                        {/* Header de la cita */}
                        <div className="flex justify-between items-start mb-4 pb-4 border-b-2 border-gray-200">
                          <div>
                            <div className="flex items-center gap-2 text-green-700 font-bold text-lg mb-1">
                              <Calendar className="w-5 h-5" />
                              {format(new Date(cita.fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                            </div>
                            <p className="text-gray-600 text-sm">Hora: {cita.hora}</p>
                          </div>
                          <Badge className={`${estadoColors[cita.estado]} font-semibold px-3 py-1`} variant="outline">
                            {cita.estado}
                          </Badge>
                        </div>

                        {/* Contenido de la cita */}
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Columna izquierda - Información de la cita */}
                          <div className="space-y-4">
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                              <p className="text-xs text-amber-700 font-semibold mb-1">MOTIVO DE CONSULTA</p>
                              <p className="text-gray-900 font-medium">{cita.motivo}</p>
                            </div>
                            
                            {cita.veterinario && (
                              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-xs text-blue-700 font-semibold mb-1">VETERINARIO RESPONSABLE</p>
                                <p className="text-gray-900 font-medium">Dr. {cita.veterinario}</p>
                              </div>
                            )}

                            {cita.observaciones && (
                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-700 font-semibold mb-1">OBSERVACIONES</p>
                                <p className="text-gray-900 text-sm">{cita.observaciones}</p>
                              </div>
                            )}
                          </div>

                          {/* Columna derecha - Tratamiento */}
                          {tratamiento && (
                            <div className="space-y-4">
                              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                                <div className="flex items-center gap-2 mb-2">
                                  <Stethoscope className="w-5 h-5 text-red-600" />
                                  <p className="text-xs text-red-700 font-bold uppercase">Diagnóstico</p>
                                </div>
                                <p className="text-gray-900 font-semibold">{tratamiento.diagnostico}</p>
                              </div>

                              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                                <p className="text-xs text-green-700 font-bold mb-2 uppercase">Tratamiento Indicado</p>
                                <p className="text-gray-900">{tratamiento.tratamiento_indicado}</p>
                              </div>

                              {medicamentos.length > 0 && (
                                <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-300">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Pill className="w-5 h-5 text-purple-600" />
                                    <p className="text-xs text-purple-700 font-bold uppercase">Medicamentos Recetados</p>
                                  </div>
                                  <div className="space-y-2">
                                    {medicamentos.map((med, idx) => (
                                      <div key={idx} className="bg-white p-3 rounded-lg border border-purple-200">
                                        <p className="font-bold text-purple-900 mb-1">{med.nombre}</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                                          {med.dosis && (
                                            <div>
                                              <span className="font-semibold text-purple-700">Dosis:</span> {med.dosis}
                                            </div>
                                          )}
                                          {med.duracion && (
                                            <div>
                                              <span className="font-semibold text-purple-700">Duración:</span> {med.duracion}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {tratamiento.recomendaciones && (
                                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                  <p className="text-xs text-indigo-700 font-bold mb-2 uppercase">Recomendaciones</p>
                                  <p className="text-gray-900 text-sm">{tratamiento.recomendaciones}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {citas.length === 0 && (
                  <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-semibold">No hay registros en el historial clínico</p>
                    <p className="text-gray-400 text-sm mt-2">Las consultas aparecerán aquí una vez sean registradas</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer con firma */}
            <div className="mt-12 pt-8 border-t-2 border-gray-300">
              <div className="flex justify-between items-end">
                <div className="text-center">
                  <div className="w-64 border-t-2 border-gray-800 mb-2"></div>
                  <p className="font-bold text-gray-900">Firma del Veterinario</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-700 text-lg">VetCare</p>
                  <p className="text-gray-600 text-sm">Sistema Veterinario Profesional</p>
                  <p className="text-gray-500 text-xs">www.vetcare.com</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}