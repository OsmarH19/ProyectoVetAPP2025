import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

const getDiaSemana = (fecha) => {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[new Date(fecha).getDay()];
};

export default function CitaForm({ cita, mascotas, clientes, veterinarios, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(cita || {
    fecha: "",
    hora: "",
    motivo: "",
    veterinario: "",
    estado: "Pendiente",
    mascota_id: "",
    cliente_id: "",
    observaciones: "",
  });

  const timeSlots = generateTimeSlots();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'mascota_id' && value) {
        const mascota = mascotas.find(m => m.id === value);
        if (mascota) {
          newData.cliente_id = mascota.cliente_id;
        }
      }
      
      return newData;
    });
  };

  const selectedMascota = mascotas.find(m => m.id === formData.mascota_id);
  const selectedCliente = clientes.find(c => c.id === formData.cliente_id);

  const veterinariosDisponibles = veterinarios.filter(v => {
    if (!v.activo || !formData.fecha || !formData.hora) return false;
    
    const diaSemana = getDiaSemana(formData.fecha);
    const horaSeleccionada = formData.hora;
    
    return v.turnos?.some(turno => {
      if (turno.dia !== diaSemana) return false;
      
      const horaInicio = turno.hora_inicio || '00:00';
      const horaFin = turno.hora_fin || '23:59';
      
      return horaSeleccionada >= horaInicio && horaSeleccionada <= horaFin;
    });
  });

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle>
          {cita ? "Editar Cita" : "Nueva Cita"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mascota_id">Mascota *</Label>
              <Select
                value={formData.mascota_id}
                onValueChange={(value) => handleChange('mascota_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mascota" />
                </SelectTrigger>
                <SelectContent>
                  {mascotas.map(m => {
                    const cliente = clientes.find(c => c.id === m.cliente_id);
                    return (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nombre} ({m.especie}) - {cliente?.nombres} {cliente?.apellidos}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {selectedCliente && (
              <div className="space-y-2">
                <Label>Dueño</Label>
                <Input
                  value={`${selectedCliente.nombres} ${selectedCliente.apellidos}`}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => handleChange('fecha', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Hora *</Label>
              <Select
                value={formData.hora}
                onValueChange={(value) => handleChange('hora', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar hora" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(slot => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => handleChange('estado', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Confirmada">Confirmada</SelectItem>
                  <SelectItem value="Completada">Completada</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de la Consulta *</Label>
              <Input
                id="motivo"
                value={formData.motivo}
                onChange={(e) => handleChange('motivo', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="veterinario">Veterinario</Label>
              <Select
                value={formData.veterinario}
                onValueChange={(value) => handleChange('veterinario', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar veterinario" />
                </SelectTrigger>
                <SelectContent>
                  {formData.fecha && formData.hora ? (
                    veterinariosDisponibles.length > 0 ? (
                      veterinariosDisponibles.map(v => (
                        <SelectItem key={v.id} value={`${v.nombres} ${v.apellidos}`}>
                          Dr. {v.nombres} {v.apellidos} {v.especialidad ? `- ${v.especialidad}` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value={null} disabled>No hay veterinarios disponibles en este horario</SelectItem>
                    )
                  ) : (
                    <SelectItem value={null} disabled>Seleccione fecha y hora primero</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {formData.fecha && formData.hora && (
                <p className="text-xs text-gray-500 mt-1">
                  {veterinariosDisponibles.length} veterinario(s) disponible(s) el {getDiaSemana(formData.fecha)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700"
            disabled={isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {cita ? "Actualizar" : "Guardar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}