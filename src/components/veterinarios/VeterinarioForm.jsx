import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function VeterinarioForm({ veterinario, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    especialidad: "",
    telefono: "",
    email: "",
    turnos: [{ dia: "", hora_inicio: "08:00", hora_fin: "12:00" }],
    activo: true,
  });
  const [savingTurnoIndex, setSavingTurnoIndex] = useState(null);
  const queryClient = useQueryClient();

  const { data: diasMaestros = [] } = useQuery({
    queryKey: ["dias_maestros"],
    queryFn: async () => {
      const res = await fetch("https://apivet.strategtic.com/api/mascotas/datos-maestros/14");
      const json = await res.json();
      return json?.data || [];
    },
  });

  const { data: turnosApi = [] } = useQuery({
    queryKey: ["turnos_veterinario", veterinario?.id],
    queryFn: async () => {
      if (!veterinario?.id) return [];
      const res = await fetch(`https://apivet.strategtic.com/api/turnos-veterinarios/veterinario/${veterinario.id}`);
      const json = await res.json();
      return json?.data || [];
    },
    enabled: !!veterinario?.id,
  });

  useEffect(() => {
    if (veterinario) {
      setFormData(prev => ({
        ...prev,
        nombres: veterinario.nombres || prev.nombres,
        apellidos: veterinario.apellidos || prev.apellidos,
        especialidad: veterinario.especialidad || prev.especialidad,
        telefono: veterinario.telefono || prev.telefono,
        email: veterinario.email || prev.email,
        activo: typeof veterinario.activo === 'boolean' ? veterinario.activo : prev.activo,
        turnos: Array.isArray(prev.turnos) ? prev.turnos : [{ dia: "", hora_inicio: "08:00", hora_fin: "12:00" }],
      }));
    }
    if (turnosApi.length > 0) {
      const normalized = turnosApi.map(t => ({
        turno_id: t.turno_id,
        dia: String(t.dia),
        hora_inicio: (t.hora_inicio || "").slice(0, 5),
        hora_fin: (t.hora_fin || "").slice(0, 5),
      }));
      setFormData(prev => ({ ...prev, turnos: normalized }));
    }
  }, [veterinario, turnosApi]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      especialidad: formData.especialidad,
      telefono: formData.telefono,
      email: formData.email,
      activo: formData.activo,
      turnos: formData.turnos,
    };
    onSubmit(payload);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTurnoChange = (index, field, value) => {
    setFormData(prev => {
      const newTurnos = [...prev.turnos];
      newTurnos[index] = { ...newTurnos[index], [field]: value };
      return { ...prev, turnos: newTurnos };
    });
  };

  const addTurno = () => {
    setFormData(prev => ({
      ...prev,
      turnos: [...prev.turnos, { dia: "", hora_inicio: "08:00", hora_fin: "12:00" }]
    }));
  };

  const removeTurno = (index) => {
    setFormData(prev => ({
      ...prev,
      turnos: prev.turnos.filter((_, i) => i !== index)
    }));
  };

  const diasSemana = diasMaestros.map(d => ({ id: String(d.MaeestroID), nombre: d.nombre }));

  const saveTurno = async (index) => {
    const turno = formData.turnos[index];
    if (!veterinario?.id) return;
    if (!turno.dia || !turno.hora_inicio || !turno.hora_fin) return;
    setSavingTurnoIndex(index);
    try {
      const payload = {
        veterinario_id: veterinario.id,
        dia: parseInt(turno.dia),
        hora_inicio: turno.hora_inicio,
        hora_fin: turno.hora_fin,
      };
      const url = turno.turno_id
        ? `https://apivet.strategtic.com/api/turnos-veterinarios/${turno.turno_id}`
        : `https://apivet.strategtic.com/api/turnos-veterinarios`;
      const method = turno.turno_id ? 'POST' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error guardando turno');
      await res.json();
      queryClient.invalidateQueries({ queryKey: ["turnos_veterinario", veterinario.id] });
    } finally {
      setSavingTurnoIndex(null);
    }
  };

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle>
          {veterinario ? "Editar Veterinario" : "Nuevo Veterinario"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres *</Label>
              <Input
                id="nombres"
                value={formData.nombres}
                onChange={(e) => handleChange('nombres', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input
                id="apellidos"
                value={formData.apellidos}
                onChange={(e) => handleChange('apellidos', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="especialidad">Especialidad</Label>
            <Input
              id="especialidad"
              value={formData.especialidad}
              onChange={(e) => handleChange('especialidad', e.target.value)}
              placeholder="Ej: Cirugía, Pediatría, etc."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="activo"
              checked={formData.activo}
              onCheckedChange={(checked) => handleChange('activo', checked)}
            />
            <Label htmlFor="activo" className="cursor-pointer">Veterinario Activo</Label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Turnos de Trabajo</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTurno}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar Turno
              </Button>
            </div>
            
            {formData.turnos.map((turno, index) => (
              <Card key={index} className="p-4 bg-gray-50">
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-sm">Turno {index + 1}</h4>
                    {formData.turnos.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTurno(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`turno-dia-${index}`}>Día</Label>
                      <Select
                        value={turno.dia ? String(turno.dia) : ""}
                        onValueChange={(value) => handleTurnoChange(index, 'dia', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {diasSemana.map(dia => (
                            <SelectItem key={dia.id} value={dia.id}>{dia.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`turno-inicio-${index}`}>Hora Inicio</Label>
                      <Input
                        id={`turno-inicio-${index}`}
                        type="time"
                        value={turno.hora_inicio}
                        onChange={(e) => handleTurnoChange(index, 'hora_inicio', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`turno-fin-${index}`}>Hora Fin</Label>
                      <Input
                        id={`turno-fin-${index}`}
                        type="time"
                        value={turno.hora_fin}
                        onChange={(e) => handleTurnoChange(index, 'hora_fin', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => saveTurno(index)}
                    disabled={savingTurnoIndex === index || !veterinario?.id}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Guardar turno
                  </Button>
                </div>
              </Card>
            ))}
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
            className="bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {veterinario ? "Actualizar" : "Guardar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

