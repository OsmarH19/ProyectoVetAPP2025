import React, { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Plus, Trash2 } from "lucide-react";

export default function TratamientoForm({ tratamiento, citas, mascotas, clientes, veterinarios, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(() => ({
    cita_id: tratamiento?.cita_id ? String(tratamiento.cita_id) : "",
    diagnostico: tratamiento?.diagnostico ?? "",
    tratamiento_indicado: tratamiento?.tratamiento_indicado ?? "",
    medicamentos: Array.isArray(tratamiento?.medicamentos) && tratamiento.medicamentos.length > 0
      ? tratamiento.medicamentos.map((m) => ({
          medicamento_id: m?.medicamento_id || m?.id,
          nombre: m?.nombre || "",
          dosis: m?.dosis || "",
          duracion: m?.duracion || "",
        }))
      : [{ nombre: "", dosis: "", duracion: "" }],
    recomendaciones: tratamiento?.recomendaciones ?? "",
    veterinario_id: tratamiento?.veterinario_id ?? "",
    mascota_id: tratamiento?.mascota_id ?? "",
    cliente_id: tratamiento?.cliente_id ?? "",
  }));

  useEffect(() => {
    const loadMedications = async () => {
      if (tratamiento?.id) {
        try {
          const res = await fetch(`https://apivet.strategtic.com/api/medicamentos?tratamiento_id=${tratamiento.id}`);
          const json = await res.json();
          const meds = Array.isArray(json?.data) ? json.data : [];
          setFormData((prev) => ({
            ...prev,
            medicamentos:
              meds.length > 0
                ? meds.map((m) => ({
                    medicamento_id: m?.medicamento_id,
                    nombre: m?.nombre || "",
                    dosis: m?.dosis || "",
                    duracion: m?.duracion || "",
                  }))
                : prev.medicamentos,
          }));
        } catch (_) {
          // ignore medication load errors
        }
      }
    };

    loadMedications();
  }, [tratamiento?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      medicamentos: formData.medicamentos.filter((m) => m.nombre.trim() !== ""),
    };
    onSubmit(dataToSubmit);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      if (field === "cita_id" && value) {
        const idNum = Number.isNaN(Number(value)) ? value : Number(value);
        const cita = citas.find((c) => c.id === idNum);
        if (cita) {
          newData.mascota_id = cita.mascota_id;
          newData.cliente_id = cita.cliente_id;
          newData.veterinario_id = cita.veterinario_id;
          newData.cita_id = String(cita.id);
        }
      }

      if (field === "veterinario_id" && value) {
        newData.veterinario_id = Number.isNaN(Number(value)) ? value : Number(value);
      }

      return newData;
    });
  };

  const handleMedicamentoChange = (index, field, value) => {
    setFormData((prev) => {
      const newMedicamentos = [...prev.medicamentos];
      newMedicamentos[index] = { ...newMedicamentos[index], [field]: value };
      return { ...prev, medicamentos: newMedicamentos };
    });
  };

  const addMedicamento = () => {
    setFormData((prev) => ({
      ...prev,
      medicamentos: [...prev.medicamentos, { nombre: "", dosis: "", duracion: "" }],
    }));
  };

  const removeMedicamento = (index) => {
    setFormData((prev) => ({
      ...prev,
      medicamentos: prev.medicamentos.filter((_, i) => i !== index),
    }));
  };

  const citasCompletadas = citas.filter(
    (c) => (c.estado || "").toLowerCase() === "confirmada" || (c.estado || "").toLowerCase() === "completada"
  );

  const selectedCita = citasCompletadas.find((c) => String(c.id) === String(formData.cita_id));
  const selectedMascota = selectedCita
    ? mascotas.find((m) => String(m.mascota_id || m.id) === String(selectedCita.mascota_id))
    : null;
  const selectedCliente = selectedCita
    ? clientes.find((c) => String(c.cliente_id || c.id) === String(selectedCita.cliente_id))
    : null;

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle>{tratamiento ? "Editar Tratamiento" : "Nuevo Tratamiento"}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <section className="rounded-lg border border-border p-4 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900">1. Contexto de la atencion</h3>
              <p className="text-xs text-muted-foreground">
                Selecciona la cita y valida los datos del paciente antes de registrar el tratamiento.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cita_id">Cita asociada *</Label>
                <Select
                  value={formData.cita_id ? String(formData.cita_id) : ""}
                  onValueChange={(value) => handleChange("cita_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cita" />
                  </SelectTrigger>
                  <SelectContent>
                    {citasCompletadas.map((c) => {
                      const mascota = mascotas.find((m) => (m.mascota_id || m.id) === c.mascota_id);
                      const cliente = clientes.find((cl) => (cl.cliente_id || cl.id) === c.cliente_id);
                      const labelCliente = `${cliente?.nombres || ""} ${cliente?.apellidos || ""}`.trim();

                      return (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.fecha} {c.hora} - {mascota?.nombre} {labelCliente ? `(${labelCliente})` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="veterinario_id">Veterinario *</Label>
                <Select
                  value={formData.veterinario_id ? String(formData.veterinario_id) : ""}
                  onValueChange={(value) => handleChange("veterinario_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar veterinario" />
                  </SelectTrigger>
                  <SelectContent>
                    {(veterinarios || []).map((v) => (
                      <SelectItem key={v.veterinario_id || v.id} value={String(v.veterinario_id || v.id)}>
                        Dr. {v.nombres} {v.apellidos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mascota</Label>
                <Input value={selectedMascota?.nombre || "-"} disabled className="bg-gray-50" />
              </div>

              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input
                  value={selectedCliente ? `${selectedCliente.nombres || ""} ${selectedCliente.apellidos || ""}`.trim() || "-" : "-"}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border p-4 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900">2. Evaluacion clinica</h3>
              <p className="text-xs text-muted-foreground">
                Registra el diagnostico, tratamiento indicado y recomendaciones para el caso.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnostico">Diagnostico *</Label>
              <Textarea
                id="diagnostico"
                value={formData.diagnostico}
                onChange={(e) => handleChange("diagnostico", e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tratamiento_indicado">Tratamiento indicado *</Label>
              <Textarea
                id="tratamiento_indicado"
                value={formData.tratamiento_indicado}
                onChange={(e) => handleChange("tratamiento_indicado", e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recomendaciones">Recomendaciones</Label>
              <Textarea
                id="recomendaciones"
                value={formData.recomendaciones}
                onChange={(e) => handleChange("recomendaciones", e.target.value)}
                rows={3}
              />
            </div>
          </section>

          <section className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-900">3. Receta medica</h3>
                <p className="text-xs text-muted-foreground">Agrega los medicamentos necesarios.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addMedicamento}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar medicamento
              </Button>
            </div>

            {(formData.medicamentos || []).map((med, index) => (
              <Card key={index} className="p-4 bg-gray-50">
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-sm">Medicamento {index + 1}</h4>
                    {formData.medicamentos.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeMedicamento(index)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`med-nombre-${index}`}>Nombre</Label>
                      <Input
                        id={`med-nombre-${index}`}
                        value={med.nombre}
                        onChange={(e) => handleMedicamentoChange(index, "nombre", e.target.value)}
                        placeholder="Nombre del medicamento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`med-dosis-${index}`}>Dosis</Label>
                      <Input
                        id={`med-dosis-${index}`}
                        value={med.dosis}
                        onChange={(e) => handleMedicamentoChange(index, "dosis", e.target.value)}
                        placeholder="Ej: 1 tableta cada 8 horas"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`med-duracion-${index}`}>Duracion</Label>
                      <Input
                        id={`med-duracion-${index}`}
                        value={med.duracion}
                        onChange={(e) => handleMedicamentoChange(index, "duracion", e.target.value)}
                        placeholder="Ej: 7 dias"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </section>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {tratamiento ? "Actualizar" : "Guardar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
