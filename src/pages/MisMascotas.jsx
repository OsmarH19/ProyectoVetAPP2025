import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Weight, Heart } from "lucide-react";

export default function MisMascotas() {
  const [user, setUser] = useState(null);
  const [cliente, setCliente] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const clientes = await base44.entities.Cliente.list();
        const myCliente = clientes.find(c => c.email === currentUser.email);
        setCliente(myCliente);
      } catch (error) {
        console.error("Error:", error);
      }
    }
    loadUser();
  }, []);

  const { data: mascotas = [] } = useQuery({
    queryKey: ['mis-mascotas', cliente?.id],
    queryFn: async () => {
      if (!cliente?.id) return [];
      const all = await base44.entities.Mascota.list();
      return all.filter(m => m.cliente_id === cliente.id);
    },
    enabled: !!cliente?.id,
  });

  const { data: tratamientos = [] } = useQuery({
    queryKey: ['mis-tratamientos', cliente?.id],
    queryFn: async () => {
      if (!cliente?.id) return [];
      const all = await base44.entities.Tratamiento.list('-created_date');
      return all.filter(t => t.cliente_id === cliente.id);
    },
    enabled: !!cliente?.id,
  });

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
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Mascotas</h1>
          <p className="text-gray-600 mt-1">Información de tus mascotas y sus tratamientos</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mascotas.map((mascota) => {
            const mascotaTratamientos = tratamientos.filter(t => t.mascota_id === mascota.id);
            
            return (
              <Card key={mascota.id} className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <CardHeader className="p-0">
                  {mascota.foto_url ? (
                    <img
                      src={mascota.foto_url}
                      alt={mascota.nombre}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
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

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
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
                  </div>

                  {mascotaTratamientos.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        Últimos Tratamientos
                      </h4>
                      <div className="space-y-2">
                        {mascotaTratamientos.slice(0, 2).map(t => (
                        <div key={t.id} className="text-sm bg-secondary/5 p-2 rounded">
                          <p className="font-semibold text-gray-900">{t.diagnostico}</p>
                          <p className="text-gray-600 text-xs mt-1">{t.tratamiento_indicado}</p>
                        </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {mascota.observaciones && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Observaciones:</span> {mascota.observaciones}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          
          {mascotas.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No tienes mascotas registradas
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
