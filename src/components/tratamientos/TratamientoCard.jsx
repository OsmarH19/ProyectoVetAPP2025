import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, FileText, Calendar, Pill, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function TratamientoCard({ tratamiento, mascota, cliente, cita, onEdit, onDelete, onViewHistorial }) {
  const medicamentos = Array.isArray(tratamiento.medicamentos) ? tratamiento.medicamentos : [];
  
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              {mascota?.nombre}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Cliente: {cliente?.nombres} {cliente?.apellidos}
            </p>
          </div>
          {cita && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(cita.fecha), "dd MMM yyyy", { locale: es })}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h4 className="font-semibold text-gray-900">Diagnóstico</h4>
          </div>
          <p className="text-gray-700 bg-red-50 p-3 rounded-lg">{tratamiento.diagnostico}</p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Tratamiento Indicado</h4>
          <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{tratamiento.tratamiento_indicado}</p>
        </div>

        {medicamentos.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4 text-green-600" />
              <h4 className="font-semibold text-gray-900">Medicamentos Recetados</h4>
            </div>
            <div className="space-y-3">
              {medicamentos.map((med, index) => (
                <div key={index} className="bg-white p-3 rounded border border-green-200">
                  <p className="font-semibold text-gray-900">{med.nombre}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                    {med.dosis && (
                      <div>
                        <span className="font-semibold">Dosis:</span> {med.dosis}
                      </div>
                    )}
                    {med.duracion && (
                      <div>
                        <span className="font-semibold">Duración:</span> {med.duracion}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tratamiento.recomendaciones && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Recomendaciones</h4>
            <p className="text-sm text-gray-600">{tratamiento.recomendaciones}</p>
          </div>
        )}

        {tratamiento.veterinario && (
          <div className="border-t pt-3">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Veterinario:</span> Dr. {tratamiento.veterinario}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between bg-gray-50 p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onViewHistorial}
          className="text-blue-600"
        >
          <FileText className="w-4 h-4 mr-1" />
          Ver Historial
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(tratamiento)}
          >
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(tratamiento.id)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Eliminar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}