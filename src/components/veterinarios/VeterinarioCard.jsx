import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Power, Mail, Phone, Stethoscope, Clock } from "lucide-react";

export default function VeterinarioCard({ veterinario, onEdit, onToggleActive }) {
  const { data: diasMaestros = [] } = useQuery({
    queryKey: ["dias_maestros"],
    queryFn: async () => {
      const res = await fetch("https://apivet.strategtic.com/api/mascotas/datos-maestros/14");
      const json = await res.json();
      return json?.data || [];
    },
  });

  const { data: turnos = [] } = useQuery({
    queryKey: ["turnos_veterinario", veterinario.id],
    queryFn: async () => {
      const res = await fetch(`https://apivet.strategtic.com/api/turnos-veterinarios/veterinario/${veterinario.id}`);
      const json = await res.json();
      return json?.data || [];
    },
    enabled: !!veterinario?.id,
  });

  const dayName = (id) => {
    const item = diasMaestros.find(d => String(d.MaeestroID) === String(id));
    return item?.nombre || id;
  };

  const normalizedTurnos = (turnos || []).map(t => ({
    diaNombre: dayName(t.dia),
    hora_inicio: (t.hora_inicio || "").slice(0, 5),
    hora_fin: (t.hora_fin || "").slice(0, 5),
  }));

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
        <CardTitle className="text-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-secondary" />
            <span>Dr. {veterinario.nombres} {veterinario.apellidos}</span>
          </div>
          <Badge variant={veterinario.activo ? "default" : "secondary"} className={veterinario.activo ? "bg-primary text-primary-foreground" : ""}>
            {veterinario.activo ? "Activo" : "Inactivo"}
          </Badge>
        </CardTitle>
        {veterinario.especialidad && (
          <p className="text-sm text-gray-600 mt-1">{veterinario.especialidad}</p>
        )}
      </CardHeader>
      
      <CardContent className="p-6 space-y-3">
        {veterinario.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            {veterinario.email}
          </div>
        )}
        {veterinario.telefono && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            {veterinario.telefono}
          </div>
        )}

        {normalizedTurnos.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Turnos</h4>
            </div>
            <div className="space-y-2">
              {normalizedTurnos.map((turno, index) => (
                <div key={index} className="bg-primary/5 p-2 rounded text-sm">
                  <p className="font-semibold text-gray-900">{turno.diaNombre}</p>
                  <p className="text-gray-600">
                    {turno.hora_inicio} - {turno.hora_fin}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end gap-2 bg-gray-50 p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(veterinario)}
        >
          <Edit className="w-4 h-4 mr-1" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleActive(veterinario)}
          className={veterinario.activo ? "text-red-600 hover:bg-red-50" : "text-primary hover:bg-primary/10"}
        >
          <Power className="w-4 h-4 mr-1" />
          {veterinario.activo ? "Desactivar" : "Activar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
