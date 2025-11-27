import React, { useEffect, useMemo, useState } from "react";
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
  const [formData, setFormData] = useState(() => {
    const initial = {
      fecha: "",
      hora: "",
      motivo: "",
      estado_id: "",
      mascota_id: "",
      cliente_id: "",
      veterinario_id: "",
      observaciones: "",
    }
    if (!cita) return initial
    return {
      ...initial,
      ...cita,
      veterinario_id: cita.veterinario_id || "",
      estado_id: cita.estado_id || "",
    }
  });

  const [mascotasApi, setMascotasApi] = useState([])
  const [estadosMaestros, setEstadosMaestros] = useState([])
  const [veterinariosApi, setVeterinariosApi] = useState([])
  const [turnosApi, setTurnosApi] = useState([])

  useEffect(() => {
    const loadMascotasYEstados = async () => {
      try {
        const [resMascotas, resEstados] = await Promise.all([
          fetch('http://localhost:8000/api/mascotas'),
          fetch('http://localhost:8000/api/mascotas/datos-maestros/13')
        ])
        const jsonMascotas = await resMascotas.json()
        const jsonEstados = await resEstados.json()
        setMascotasApi(Array.isArray(jsonMascotas?.data) ? jsonMascotas.data : [])
        const maestros = Array.isArray(jsonEstados?.data) ? jsonEstados.data : []
        setEstadosMaestros(maestros)
        if (!cita && !formData.estado_id) {
          const pendiente = maestros.find(m => m.nombre === 'Pendiente')
          if (pendiente) setFormData(prev => ({ ...prev, estado_id: pendiente.MaeestroID }))
        }
      } catch (e) {
        setMascotasApi([])
        setEstadosMaestros([])
      }
    }
    loadMascotasYEstados()
  }, [])

  useEffect(() => {
    const loadVeterinariosYTurnos = async () => {
      try {
        const [resVets, resTurnos] = await Promise.all([
          fetch('http://localhost:8000/api/veterinarios'),
          fetch('http://localhost:8000/api/turnos-veterinarios')
        ])
        const jsonVets = await resVets.json()
        const jsonTurnos = await resTurnos.json()
        setVeterinariosApi(Array.isArray(jsonVets?.data) ? jsonVets.data : [])
        setTurnosApi(Array.isArray(jsonTurnos?.data) ? jsonTurnos.data : [])
      } catch (e) {
        setVeterinariosApi([])
        setTurnosApi([])
      }
    }
    loadVeterinariosYTurnos()
  }, [])

  const timeSlots = generateTimeSlots();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'mascota_id' && value) {
        const mascota = mascotasApi.find(m => Number(m.mascota_id) === Number(value));
        if (mascota) {
          newData.cliente_id = mascota?.cliente?.cliente_id;
        }
      }
      
      return newData;
    });
  };

  const selectedMascota = useMemo(() => mascotasApi.find(m => Number(m.mascota_id) === Number(formData.mascota_id)), [mascotasApi, formData.mascota_id])
  const selectedClienteNombre = selectedMascota?.cliente?.nombre_completo || ''

  const veterinariosDisponibles = useMemo(() => {
    if (!formData.hora) return []
    const horaSeleccionada = formData.hora
    const turnosPorVet = turnosApi.reduce((acc, t) => {
      const vid = Number(t.veterinario_id)
      if (!acc[vid]) acc[vid] = []
      acc[vid].push(t)
      return acc
    }, {})
    return veterinariosApi.filter(v => {
      if (!v.activo) return false
      const vid = Number(v.veterinario_id)
      const turnos = turnosPorVet[vid] || []
      return turnos.some(turno => {
        const hi = turno.hora_inicio || '00:00'
        const hf = turno.hora_fin || '23:59'
        return horaSeleccionada >= hi && horaSeleccionada <= hf
      })
    })
  }, [veterinariosApi, turnosApi, formData.hora])

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
                  {mascotasApi.map(m => (
                    <SelectItem key={m.mascota_id} value={m.mascota_id}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedMascota && (
              <div className="space-y-2">
                <Label>Dueño</Label>
                <Input
                  value={selectedClienteNombre}
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
              <Label htmlFor="estado_id">Estado</Label>
              <Select
                value={formData.estado_id}
                onValueChange={(value) => handleChange('estado_id', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {estadosMaestros.map(e => (
                    <SelectItem key={e.MaeestroID} value={e.MaeestroID}>
                      {e.nombre}
                    </SelectItem>
                  ))}
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
              <Label htmlFor="veterinario_id">Veterinario</Label>
              <Select
                value={formData.veterinario_id}
                onValueChange={(value) => handleChange('veterinario_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar veterinario" />
                </SelectTrigger>
                <SelectContent>
                  {formData.hora ? (
                    veterinariosDisponibles.length > 0 ? (
                      veterinariosDisponibles.map(v => (
                        <SelectItem key={v.veterinario_id} value={v.veterinario_id}>
                          Dr. {v.nombres} {v.apellidos} {v.especialidad ? `- ${v.especialidad}` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value={null} disabled>No hay veterinarios disponibles en este horario</SelectItem>
                    )
                  ) : (
                    <SelectItem value={null} disabled>Seleccione hora primero</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {formData.hora && (
                <p className="text-xs text-gray-500 mt-1">
                  {veterinariosDisponibles.length} veterinario(s) disponible(s)
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
