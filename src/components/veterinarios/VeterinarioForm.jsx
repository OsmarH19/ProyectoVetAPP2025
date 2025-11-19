import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function VeterinarioForm({ veterinario, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(veterinario || {
    nombres: "",
    apellidos: "",
    especialidad: "",
    telefono: "",
    email: "",
    turnos: [{ dia: "Lunes", hora_inicio: "08:00", hora_fin: "12:00" }],
    activo: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
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
      turnos: [...prev.turnos, { dia: "Lunes", hora_inicio: "08:00", hora_fin: "12:00" }]
    }));
  };

  const removeTurno = (index) => {
    setFormData(prev => ({
      ...prev,
      turnos: prev.turnos.filter((_, i) => i !== index)
    }));
  };

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

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
                        value={turno.dia}
                        onValueChange={(value) => handleTurnoChange(index, 'dia', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {diasSemana.map(dia => (
                            <SelectItem key={dia} value={dia}>{dia}</SelectItem>
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
            className="bg-green-600 hover:bg-green-700"
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