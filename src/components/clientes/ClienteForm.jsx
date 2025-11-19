import { useState } from "react";
import PropTypes from "prop-types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Save } from "lucide-react";

export default function ClienteForm({ cliente, onSubmit, onCancel, isLoading }) {
  const FACTILIZA_API_KEY = String(import.meta.env.VITE_FACTILIZA_API_KEY || "");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const updateId = cliente?.cliente_id ?? cliente?.id;
      if (updateId) {
        const res = await fetch(`http://localhost:8000/api/clientes/${updateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("error");
        const updated = await res.json();
        if (onSubmit) onSubmit(updated);
      } else {
        const res = await fetch("http://localhost:8000/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("error");
        const created = await res.json();
        if (onSubmit) onSubmit(created);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDniBlur = async () => {
    const dni = String(formData.dni || "").trim();
    if (dni.length < 8) return;
    try {
      setDniLoading(true);
      const res = await fetch(`https://api.factiliza.com/v1/dni/info/${dni}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(FACTILIZA_API_KEY ? { Authorization: `Bearer ${FACTILIZA_API_KEY}` } : {})
        },
        body: JSON.stringify({ numero: dni })
      });
      if (!res.ok) {
        let errDetail = '';
        try { errDetail = await res.text(); } catch { errDetail = ''; }
        throw new Error(`dni ${res.status} ${errDetail}`);
      }
      const data = await res.json();
      const info = data?.data || {};
      setFormData(prev => ({
        ...prev,
        nombres: info.nombres || prev.nombres,
        apellidos: [info.apellido_paterno, info.apellido_materno].filter(Boolean).join(" ") || prev.apellidos,
        direccion: info.direccion || info.direccion_completa || prev.direccion,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setDniLoading(false);
    }
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

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dni">DNI *</Label>
              <Input
                id="dni"
                value={formData.dni}
                onChange={(e) => handleChange('dni', e.target.value)}
                onBlur={handleDniBlur}
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
            disabled={isLoading || submitting || dniLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700"
            disabled={isLoading || submitting || dniLoading}
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