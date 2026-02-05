import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Search, X, Save } from "lucide-react";
import toastr from "toastr";

export default function ClienteForm({ cliente, onSubmit, onCancel, isLoading }) {
  const isEditing = Boolean(cliente?.cliente_id ?? cliente?.id);
  const FACTILIZA_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ODEiLCJuYW1lIjoiQ29ycG9yYWNpb24gQUNNRSIsImVtYWlsIjoicmZsb3JlekBhY21ldGljLmNvbS5wZSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnN1bHRvciJ9.06GySJlpTrqWUQA5EI3tDHvLn8LNzZ2m5VBSIy_SbF4";
  const [formData, setFormData] = useState(cliente || {
    nombres: "",
    apellidos: "",
    dni: "",
    direccion: "",
    telefono: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [dniLoading, setDniLoading] = useState(false);
  const [dniError, setDniError] = useState("");
  const lastLookupRef = useRef("");

  const runDniLookup = async (dni, { signal, force = false } = {}) => {
    if (!dni) return;
    if (!force && lastLookupRef.current === dni) return;
    setDniLoading(true);
    setDniError("");
    try {
      const res = await fetch(`https://api.factiliza.com/v1/dni/info/${dni}`, {
        headers: {
          Authorization: `Bearer ${FACTILIZA_TOKEN}`,
          Accept: "application/json",
        },
        signal,
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "No se pudo validar el DNI.");
      }
      const data = json?.data || {};
      const apellidos = `${data.apellido_paterno || ""} ${data.apellido_materno || ""}`.trim();
      setFormData(prev => ({
        ...prev,
        nombres: data.nombres || prev.nombres,
        apellidos: apellidos || prev.apellidos,
        direccion: data.direccion_completa || prev.direccion,
      }));
      lastLookupRef.current = dni;
    } catch (err) {
      if (err?.name !== "AbortError") {
        setDniError(err?.message || "No se pudo consultar el DNI.");
      }
    } finally {
      setDniLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const updateId = cliente?.cliente_id ?? cliente?.id;
      if (updateId) {
        const res = await fetch(`https://apivet.strategtic.com/api/clientes/${updateId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("error");
        const updated = await res.json();
        toastr.success("Cliente actualizado correctamente.");
        if (onSubmit) onSubmit(updated);
      } else {
        const res = await fetch("https://apivet.strategtic.com/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("error");
        const created = await res.json();
        toastr.success("Cliente creado correctamente.");
        if (onSubmit) onSubmit(created);
      }
    } catch (err) {
      console.error(err);
      toastr.error(err?.message || "No se pudo guardar el cliente. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDniSearch = () => {
    if (isEditing) return;
    const dni = (formData.dni || "").trim();
    if (dni.length !== 8) {
      setDniError("Ingresa 8 dígitos para buscar.");
      return;
    }
    runDniLookup(dni, { force: true });
  };


  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle>
          {cliente ? "Editar Cliente" : "Nuevo Cliente"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dni">DNI *</Label>
              <div className="flex gap-2">
                <Input
                  id="dni"
                  value={formData.dni}
                  onChange={(e) => handleChange('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
                  required
                />
                {!isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDniSearch}
                    disabled={dniLoading || (formData.dni || "").trim().length !== 8}
                  >
                    <Search className="w-4 h-4 mr-1" />
                    Buscar
                  </Button>
                )}
              </div>
              {!isEditing && (
                <div className="text-xs text-muted-foreground">
                  {dniLoading ? "Buscando DNI..." : dniError ? <span className="text-red-600">{dniError}</span> : "Presiona Buscar para autocompletar."}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres *</Label>
              <Input
                id="nombres"
                value={formData.nombres}
                onChange={(e) => handleChange('nombres', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">            
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input
                id="apellidos"
                value={formData.apellidos}
                onChange={(e) => handleChange('apellidos', e.target.value)}
                required
              />
            </div>            
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Textarea
              id="direccion"
              value={formData.direccion}
              onChange={(e) => handleChange('direccion', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || submitting}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90"
            disabled={isLoading || submitting}
          >
            <Save className="w-4 h-4 mr-2" />
            {cliente ? "Actualizar" : "Guardar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

ClienteForm.propTypes = {
  cliente: PropTypes.object,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  isLoading: PropTypes.bool,
};

