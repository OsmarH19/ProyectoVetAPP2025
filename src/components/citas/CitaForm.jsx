import { apiUrl } from "@/lib/api";
﻿import React, { useEffect, useMemo, useState } from "react";
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
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push(time);
    }
  }
  return slots;
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
      tiposervicio_id: "",
      veterinario_id: "",
      observaciones: "",
    };

    if (!cita) return initial;

    return {
      ...initial,
      fecha: cita.fecha || "",
      hora: cita.hora || "",
      motivo: cita.motivo || "",
      mascota_id: cita.mascota_id ? String(cita.mascota_id) : "",
      cliente_id: cita.cliente_id ? String(cita.cliente_id) : "",
      tiposervicio_id: cita.tiposervicio_id ? String(cita.tiposervicio_id) : "",
      veterinario_id: cita.veterinario_id ? String(cita.veterinario_id) : "",
      estado_id: cita.estado_id ? String(cita.estado_id) : "",
      observaciones: cita.observaciones ?? "",
    };
  });

  const [mascotasApi, setMascotasApi] = useState([]);
  const [estadosMaestros, setEstadosMaestros] = useState([]);
  const [veterinariosApi, setVeterinariosApi] = useState([]);
  const [turnosApi, setTurnosApi] = useState([]);
  const [serviciosApi, setServiciosApi] = useState([]);

  useEffect(() => {
    const loadMascotasYEstados = async () => {
      try {
        const [resMascotas, resEstados] = await Promise.all([
          fetch(apiUrl("/mascotas")),
          fetch(apiUrl("/mascotas/datos-maestros/13")),
        ]);
        const jsonMascotas = await resMascotas.json();
        const jsonEstados = await resEstados.json();
        setMascotasApi(Array.isArray(jsonMascotas?.data) ? jsonMascotas.data : []);

        const maestros = Array.isArray(jsonEstados?.data) ? jsonEstados.data : [];
        setEstadosMaestros(maestros);
        if (!cita && !formData.estado_id) {
          const pendiente = maestros.find((m) => m.nombre === "Pendiente");
          if (pendiente) {
            setFormData((prev) => ({ ...prev, estado_id: String(pendiente.MaeestroID) }));
          }
        }
      } catch {
        setMascotasApi([]);
        setEstadosMaestros([]);
      }
    };

    loadMascotasYEstados();
  }, []);

  useEffect(() => {
    const loadVeterinariosYTurnos = async () => {
      try {
        const [resVets, resTurnos] = await Promise.all([
          fetch(apiUrl("/veterinarios")),
          fetch(apiUrl("/turnos-veterinarios")),
        ]);
        const jsonVets = await resVets.json();
        const jsonTurnos = await resTurnos.json();
        setVeterinariosApi(Array.isArray(jsonVets?.data) ? jsonVets.data : []);
        setTurnosApi(Array.isArray(jsonTurnos?.data) ? jsonTurnos.data : []);
      } catch {
        setVeterinariosApi([]);
        setTurnosApi([]);
      }
    };

    loadVeterinariosYTurnos();
  }, []);

  useEffect(() => {
    const loadServicios = async () => {
      try {
        const res = await fetch(apiUrl("/servicios"));
        const json = await res.json();
        const items = Array.isArray(json?.data) ? json.data : [];
        setServiciosApi(items);
      } catch {
        setServiciosApi([]);
      }
    };

    loadServicios();
  }, []);

  const timeSlots = generateTimeSlots();

  const fechaValue = useMemo(() => {
    if (!formData.fecha) return "";
    const raw = String(formData.fecha);
    const base = raw.includes("/") ? raw.replace(/\//g, "-") : raw;
    const parts = base.split("T")[0].split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return base;
  }, [formData.fecha]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "mascota_id" && value) {
        const mascota = mascotasApi.find((m) => Number(m.mascota_id) === Number(value));
        if (mascota) {
          next.cliente_id = String(mascota?.cliente?.cliente_id || "");
        }
      }

      return next;
    });
  };

  const selectedMascota = useMemo(
    () => mascotasApi.find((m) => Number(m.mascota_id) === Number(formData.mascota_id)),
    [mascotasApi, formData.mascota_id]
  );

  const selectedClienteNombre = selectedMascota?.cliente?.nombre_completo || "";

  const veterinariosDisponibles = useMemo(() => {
    if (!formData.hora) return [];

    const horaSeleccionada = formData.hora;
    const turnosPorVet = turnosApi.reduce((acc, t) => {
      const vetId = Number(t.veterinario_id);
      if (!acc[vetId]) acc[vetId] = [];
      acc[vetId].push(t);
      return acc;
    }, {});

    return veterinariosApi.filter((v) => {
      if (!v.activo) return false;
      const vetId = Number(v.veterinario_id);
      const turnos = turnosPorVet[vetId] || [];
      return turnos.some((turno) => {
        const hi = turno.hora_inicio || "00:00";
        const hf = turno.hora_fin || "23:59";
        return horaSeleccionada >= hi && horaSeleccionada <= hf;
      });
    });
  }, [veterinariosApi, turnosApi, formData.hora]);

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle>{cita ? "Editar Cita" : "Nueva Cita"}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <section className="rounded-lg border border-border p-4 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900">1. Paciente</h3>
              <p className="text-xs text-muted-foreground">Selecciona la mascota para autocompletar al dueno.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mascota_id">Mascota *</Label>
                <Select value={formData.mascota_id} onValueChange={(value) => handleChange("mascota_id", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar mascota" />
                  </SelectTrigger>
                  <SelectContent>
                    {mascotasApi.map((m) => (
                      <SelectItem key={m.mascota_id} value={String(m.mascota_id)}>
                        {m.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dueno</Label>
                <Input value={selectedClienteNombre || "-"} disabled className="bg-gray-50" />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border p-4 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900">2. Datos de la cita</h3>
              <p className="text-xs text-muted-foreground">Define el servicio, motivo y la programacion.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tiposervicio_id">Servicio *</Label>
                <Select value={formData.tiposervicio_id} onValueChange={(value) => handleChange("tiposervicio_id", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviciosApi.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="motivo">Motivo de la consulta *</Label>
                <Input
                  id="motivo"
                  value={formData.motivo}
                  onChange={(e) => handleChange("motivo", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fechaValue}
                  onChange={(e) => handleChange("fecha", e.target.value)}
                  min={cita ? undefined : new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hora">Hora *</Label>
                <Select value={formData.hora} onValueChange={(value) => handleChange("hora", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="veterinario_id">Veterinario</Label>
                <Select value={formData.veterinario_id} onValueChange={(value) => handleChange("veterinario_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar veterinario" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.hora ? (
                      veterinariosDisponibles.length > 0 ? (
                        veterinariosDisponibles.map((v) => (
                          <SelectItem key={v.veterinario_id} value={String(v.veterinario_id)}>
                            Dr. {v.nombres} {v.apellidos} {v.especialidad ? `- ${v.especialidad}` : ""}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-vet" disabled>
                          No hay veterinarios disponibles en este horario
                        </SelectItem>
                      )
                    ) : (
                      <SelectItem value="pick-hour" disabled>
                        Seleccione hora primero
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formData.hora && (
                  <p className="text-xs text-gray-500 mt-1">
                    {veterinariosDisponibles.length} veterinario(s) disponible(s)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado_id">Estado</Label>
                <Select value={formData.estado_id} onValueChange={(value) => handleChange("estado_id", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {estadosMaestros.map((e) => (
                      <SelectItem key={e.MaeestroID} value={String(e.MaeestroID)}>
                        {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border p-4 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900">3. Observaciones clinicas</h3>
              <p className="text-xs text-muted-foreground">Campo opcional para detalles adicionales.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => handleChange("observaciones", e.target.value)}
                rows={3}
              />
            </div>
          </section>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {cita ? "Actualizar" : "Guardar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
