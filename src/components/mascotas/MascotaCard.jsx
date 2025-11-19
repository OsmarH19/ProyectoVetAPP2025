import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, User, Calendar, Weight } from "lucide-react";

export default function MascotaCard({ mascota, cliente, onEdit, onDelete }) {
  const especieColors = {
    "Perro": "bg-blue-100 text-blue-800",
    "Gato": "bg-orange-100 text-orange-800",
    "Ave": "bg-yellow-100 text-yellow-800",
    "Conejo": "bg-pink-100 text-pink-800",
    "Hamster": "bg-purple-100 text-purple-800",
    "Reptil": "bg-green-100 text-green-800",
    "Otro": "bg-gray-100 text-gray-800"
  };

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="p-0">
        {mascota.foto_url ? (
          <img
            src={mascota.foto_url}
            alt={mascota.nombre}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
            <span className="text-6xl text-white">
              {mascota.especie === 'Perro' ? '🐕' : mascota.especie === 'Gato' ? '🐈' : '🐾'}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-2xl font-bold text-gray-900">{mascota.nombre}</h3>
          <Badge className={especieColors[mascota.especie] || especieColors["Otro"]}>
            {mascota.especie}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          {mascota.raza && (
            <p><span className="font-semibold">Raza:</span> {mascota.raza}</p>
          )}
          <div className="flex items-center gap-4">
            {mascota.edad && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {mascota.edad} {mascota.edad === 1 ? 'año' : 'años'}
              </div>
            )}
            {mascota.peso && (
              <div className="flex items-center gap-1">
                <Weight className="w-4 h-4" />
                {mascota.peso} kg
              </div>
            )}
          </div>
          {mascota.sexo && (
            <p><span className="font-semibold">Sexo:</span> {mascota.sexo}</p>
          )}
          {mascota.color && (
            <p><span className="font-semibold">Color:</span> {mascota.color}</p>
          )}
          {cliente && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <User className="w-4 h-4" />
              <span className="font-semibold">Dueño:</span> {cliente.nombres} {cliente.apellidos}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 bg-gray-50 p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(mascota)}
        >
          <Edit className="w-4 h-4 mr-1" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(mascota.id)}
          className="text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Eliminar
        </Button>
      </CardFooter>
    </Card>
  );
}