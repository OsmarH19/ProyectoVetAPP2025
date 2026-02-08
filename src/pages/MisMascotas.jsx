import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, PawPrint, Weight } from "lucide-react";
import HistorialClinico from "../components/tratamientos/HistorialClinico";

export default function MisMascotas() {
  const [clienteId, setClienteId] = useState(null);
  const [selectedMascotaId, setSelectedMascotaId] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return;

    let email = "";
    let id = null;
    try {
      const parsed = JSON.parse(raw);
      email = parsed?.email || "";
      const rawId = parsed?.cliente_id ?? parsed?.cliente?.cliente_id;
      const numId = Number(rawId);
      if (Number.isFinite(numId) && numId > 0) id = numId;
    } catch {
      return;
    }

    if (id) {
      setClienteId(id);
      return;
    }

    if (!email) return;

    const loadClienteId = async () => {
      try {
        const res = await fetch("https://apivet.strategtic.com/api/clientes");
        const json = await res.json();
        const items = Array.isArray(json?.data) ? json.data : [];
        const found = items.find(
          (c) => String(c?.email || "").trim().toLowerCase() === email.trim().toLowerCase()
        );
        const resolvedId = Number(found?.cliente_id ?? found?.id ?? 0) || null;
        setClienteId(resolvedId);
      } catch {
        setClienteId(null);
      }
    };

    loadClienteId();
  }, []);

  const normalizedClienteId = useMemo(() => Number(clienteId ?? 0) || null, [clienteId]);

  const { data: mascotas = [] } = useQuery({
    queryKey: ["mis-mascotas", normalizedClienteId],
    queryFn: async () => {
      if (!normalizedClienteId) return [];
      const res = await fetch(
        `https://apivet.strategtic.com/api/mascotas/filtrar?cliente_id=${normalizedClienteId}`
      );
      const json = await res.json();
      const items = Array.isArray(json?.data) ? json.data : [];
      return items.map((m) => ({
        id: m?.mascota_id ?? m?.id,
        nombre: m?.nombre,
        especie: typeof m?.especie === "object" ? m?.especie?.nombre : m?.especie,
        raza: m?.raza,
        edad: m?.edad,
        sexo: typeof m?.sexo === "object" ? m?.sexo?.nombre : m?.sexo,
        peso: m?.peso,
        color: m?.color,
        foto_url: m?.foto_url_completa || m?.foto_url,
        observaciones: m?.observaciones,
        cliente: m?.cliente || null,
      }));
    },
    enabled: !!normalizedClienteId,
  });

  const { data: tratamientos = [] } = useQuery({
    queryKey: ["mis-tratamientos", normalizedClienteId],
    queryFn: async () => {
      if (!normalizedClienteId) return [];
      const res = await fetch(
        `https://apivet.strategtic.com/api/tratamientos?cliente_id=${normalizedClienteId}`
      );
      const json = await res.json();
      return Array.isArray(json?.data) ? json.data : [];
    },
    enabled: !!normalizedClienteId,
  });

  const especieColors = {
    Perro: "bg-blue-100 text-blue-800",
    Gato: "bg-orange-100 text-orange-800",
    Ave: "bg-yellow-100 text-yellow-800",
    Conejo: "bg-pink-100 text-pink-800",
    Hamster: "bg-purple-100 text-purple-800",
    Reptil: "bg-green-100 text-green-800",
    Otro: "bg-gray-100 text-gray-800",
  };

  const getTratamientosCount = (mascotaId) =>
    (tratamientos || []).filter(
      (t) => Number(t?.mascota_id ?? t?.mascota?.mascota_id ?? 0) === mascotaId
    ).length;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Mascotas</h1>
          <p className="text-gray-600 mt-1">Lista de tus mascotas registradas</p>
        </div>

        <div
          className={`grid gap-6 items-start ${
            selectedMascotaId
              ? "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_520px]"
              : "grid-cols-1"
          }`}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Mascotas ({mascotas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Mascota</TableHead>
                      <TableHead className="text-center">Especie / Raza</TableHead>
                      <TableHead className="text-center">Edad / Sexo</TableHead>
                      <TableHead className="text-center">Peso / Color</TableHead>
                      <TableHead className="text-center">Observaciones</TableHead>
                      <TableHead className="text-center">Tratamientos</TableHead>
                      <TableHead className="text-center">Historial</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mascotas.map((mascota) => (
                      <TableRow key={mascota.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {mascota.foto_url ? (
                              <img
                                src={mascota.foto_url}
                                alt={mascota.nombre}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <PawPrint className="w-4 h-4" />
                              </div>
                            )}
                            <span className="font-semibold text-gray-900">{mascota.nombre || "â€”"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm text-gray-700">
                            <Badge className={especieColors[mascota.especie] || especieColors.Otro}>
                              {mascota.especie || "â€”"}
                            </Badge>
                            <span className="text-gray-600">{mascota.raza || "â€”"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-700">
                            <div>{mascota.edad ?? "â€”"}</div>
                            <div className="text-gray-600">{mascota.sexo || "â€”"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Weight className="w-4 h-4 text-gray-400" />
                            <div>
                              <div>{mascota.peso ? `${mascota.peso} kg` : "â€”"}</div>
                              <div className="text-gray-600">{mascota.color || "â€”"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {mascota.observaciones ? (
                            <div
                              className="text-sm text-gray-700 max-w-[260px]"
                              dangerouslySetInnerHTML={{ __html: mascota.observaciones }}
                            />
                          ) : (
                            <span className="text-sm text-gray-500">â€”</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {getTratamientosCount(mascota.id)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedMascotaId(mascota.id)}
                            title="Ver historial clinico"
                          >
                            <FileText className="w-4 h-4 text-secondary" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {mascotas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                          No tienes mascotas registradas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {selectedMascotaId && (
            <div className="xl:sticky xl:top-24">
              <HistorialClinico
                mascotaId={selectedMascotaId}
                onClose={() => setSelectedMascotaId(null)}
                className="h-[70vh] xl:h-[calc(100vh-220px)] min-h-[480px]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
