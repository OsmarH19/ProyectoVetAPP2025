import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, FileText, Stethoscope, User } from "lucide-react";

export default function MisTratamientos() {
  const [cliente, setCliente] = useState(null);
  const formatVeterinario = (value) => {
    if (!value) return "—";
    if (typeof value === "string") return value.trim() || "—";
    if (typeof value === "object") {
      const nombres = value?.nombres ?? "";
      const apellidos = value?.apellidos ?? "";
      const full = `${nombres} ${apellidos}`.trim();
      return full || "—";
    }
    return String(value);
  };

  useEffect(() => {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return;
    let email = "";
    try {
      const parsed = JSON.parse(raw);
      email = parsed?.email || "";
    } catch {
      return;
    }

    if (!email) return;

    const loadCliente = async () => {
      try {
        const res = await fetch("https://apivet.strategtic.com/api/clientes");
        const json = await res.json();
        const items = Array.isArray(json?.data) ? json.data : [];
        const found = items.find(
          (c) => String(c?.email || "").trim().toLowerCase() === email.trim().toLowerCase()
        );
        setCliente(found || null);
      } catch {
        setCliente(null);
      }
    };

    loadCliente();
  }, []);

  const clienteId = useMemo(
    () => Number(cliente?.cliente_id ?? cliente?.id ?? 0) || null,
    [cliente]
  );

  const { data: tratamientos = [] } = useQuery({
    queryKey: ["mis-tratamientos", clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const res = await fetch(
        `https://apivet.strategtic.com/api/tratamientos?cliente_id=${clienteId}`
      );
      const json = await res.json();
      const items = Array.isArray(json?.data) ? json.data : [];

      return items.map((item) => ({
        id: item?.tratamiento_id ?? item?.id,
        cita_id: item?.cita_id ?? item?.cita?.cita_id,
        cliente_id: Number(item?.cliente_id ?? item?.cliente?.cliente_id ?? 0),
        diagnostico: item?.diagnostico || "",
        tratamiento_indicado: item?.tratamiento_indicado || "",
        recomendaciones: item?.recomendaciones || "",
        veterinario: item?.veterinario || "",
        mascota: item?.mascota || null,
        fecha: item?.cita?.fecha || "",
      }));
    },
  });

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Tratamientos</h1>
          <p className="text-gray-600 mt-1">Historial de tratamientos registrados</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Tratamientos ({tratamientos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Mascota</TableHead>
                    <TableHead className="text-center">Diagnostico</TableHead>
                    <TableHead className="text-center">Tratamiento</TableHead>
                    <TableHead className="text-center">Veterinario</TableHead>
                    <TableHead className="text-center">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tratamientos.map((tratamiento) => (
                    <TableRow key={tratamiento.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-gray-900">
                            {tratamiento.mascota?.nombre || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Stethoscope className="w-4 h-4 text-secondary" />
                          <span className="truncate max-w-[220px]">
                            {tratamiento.diagnostico || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700 truncate max-w-[240px]">
                          {tratamiento.tratamiento_indicado || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{formatVeterinario(tratamiento.veterinario)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{tratamiento.fecha || "—"}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tratamientos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                        No tienes tratamientos registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
