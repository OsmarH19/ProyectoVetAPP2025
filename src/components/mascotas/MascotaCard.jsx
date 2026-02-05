import React from "react";
import { useQuery } from "@tanstack/react-query";
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

  const especieLabel = typeof mascota.especie === "string" ? mascota.especie : mascota.especie?.nombre;
  const sexoLabel = typeof mascota.sexo === "string" ? mascota.sexo : mascota.sexo?.nombre;
  const mascotaId = mascota.id ?? mascota.mascota_id;

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
          <div className="w-full h-48 bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-6xl text-white">
              {especieLabel === 'Perro' ? '🐕' : especieLabel === 'Gato' ? '🐈' : '🐾'}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-2xl font-bold text-gray-900">{mascota.nombre}</h3>
          <Badge className={especieColors[especieLabel] || especieColors["Otro"]}>
            {especieLabel}
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
          {sexoLabel && (
            <p><span className="font-semibold">Sexo:</span> {sexoLabel}</p>
          )}
          {mascota.color && (
            <p><span className="font-semibold">Color:</span> {mascota.color}</p>
          )}
          {cliente && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <User className="w-4 h-4" />
              <span className="font-semibold">Dueño:</span> {clientDisplayName(cliente)}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 bg-gray-50 p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit?.(mascota)}
        >
          <Edit className="w-4 h-4 mr-1" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete?.(mascotaId)}
          className="text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Eliminar
        </Button>
      </CardFooter>
    </Card>
  );
}

function clientDisplayName(cliente) {
  if (cliente?.nombres || cliente?.apellidos) {
    return `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim();
  }
  return cliente?.nombre_completo || '';
}

export function MascotasApiCards({ onEdit, onDelete, searchTerm = "" }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["mascotas_api"],
    queryFn: async () => {
      const res = await fetch("https://apivet.strategtic.com/api/mascotas");
      if (!res.ok) {
        throw new Error("Error al cargar mascotas");
      }
      const json = await res.json();
      return json?.data || [];
    },
  });
  const normalize = (item) => ({
    id: item?.mascota_id,
    nombre: item?.nombre,
    especie: item?.especie?.nombre,
    raza: item?.raza,
    edad: item?.edad,
    sexo: item?.sexo?.nombre,
    peso: item?.peso ? parseFloat(item.peso) : undefined,
    color: item?.color,
    foto_url: item?.foto_url,
    observaciones: item?.observaciones,
    cliente_id: item?.cliente?.cliente_id,
  });

  const normalizeCliente = (item) => ({
    nombre_completo: item?.cliente?.nombre_completo,
  });

  const [page, setPage] = React.useState(1);
  const perPage = 6;

  const filtered = (data || []).filter((item) => {
    const nombre = item?.nombre || "";
    const especieNombre = item?.especie?.nombre || "";
    const clienteNombre = item?.cliente?.nombre_completo || "";
    const s = searchTerm.toLowerCase();
    return (
      nombre.toLowerCase().includes(s) ||
      especieNombre.toLowerCase().includes(s) ||
      clienteNombre.toLowerCase().includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const paged = filtered.slice(start, start + perPage);
  React.useEffect(() => { setPage(1); }, [searchTerm]);

  if (isLoading) {
    return <div className="p-4 text-center text-gray-600">Cargando mascotas...</div>;
  }

  if (isError) {
    return <div className="p-4 text-center text-red-600">Error al cargar mascotas</div>;
  }

  return (
    <>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {paged.map((m) => (
        <MascotaCard
          key={m.mascota_id}
          mascota={normalize(m)}
          cliente={normalizeCliente(m)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      {filtered.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">No se encontraron mascotas</div>
      )}
    </div>
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-600">Página {currentPage} de {totalPages}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
        <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente</Button>
      </div>
    </div>
    </>
  );
}
