import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

export default function MascotaForm({ mascota, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    nombre: "",
    especie: "",
    raza: "",
    edad: "",
    sexo: "",
    peso: "",
    color: "",
    foto_url: "",
    observaciones: "",
    cliente_id: "",
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fotoFile, setFotoFile] = useState(null);
  const queryClient = useQueryClient();

  const { data: clientesApi = [] } = useQuery({
    queryKey: ["api_clientes"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/api/clientes");
      const json = await res.json();
      return json?.data || [];
    },
  });

  const { data: especies = [] } = useQuery({
    queryKey: ["api_especies"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/api/mascotas/datos-maestros/11");
      const json = await res.json();
      return json?.data || [];
    },
  });

  const { data: sexos = [] } = useQuery({
    queryKey: ["api_sexos"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/api/mascotas/datos-maestros/12");
      const json = await res.json();
      return json?.data || [];
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("nombre", formData.nombre || "");
    if (formData.especie) fd.append("especie", String(formData.especie));
    fd.append("raza", formData.raza || "");
    if (formData.edad !== "") fd.append("edad", String(parseInt(formData.edad)));
    if (formData.sexo) fd.append("sexo", String(formData.sexo));
    if (formData.peso !== "") fd.append("peso", String(formData.peso));
    fd.append("color", formData.color || "");
    fd.append("observaciones", formData.observaciones || "");
    if (formData.cliente_id) fd.append("cliente_id", String(formData.cliente_id));
    if (fotoFile) fd.append("foto", fotoFile);

    const mascotaId = mascota?.id ?? mascota?.mascota_id;
    const url = mascotaId
      ? `http://localhost:8000/api/mascotas/${mascotaId}`
      : `http://localhost:8000/api/mascotas`;
    const method = mascotaId ? "POST" : "POST";

    setSubmitting(true);
    fetch(url, { method, body: fd })
      .then((res) => {
        if (!res.ok) throw new Error("Error al guardar mascota");
        return res.json();
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["mascotas_api"] });
        onCancel?.();
      })
      .catch(() => {})
      .finally(() => setSubmitting(false));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFotoFile(file);
    const url = URL.createObjectURL(file);
    handleChange('foto_url', url);
    setUploading(false);
  };

  useEffect(() => {
    if (mascota) {
      const especieNombre = typeof mascota.especie === "string" ? mascota.especie : mascota.especie?.nombre;
      const sexoNombre = typeof mascota.sexo === "string" ? mascota.sexo : mascota.sexo?.nombre;
      const especieItem = especies.find((e) => e.nombre === especieNombre);
      const sexoItem = sexos.find((s) => s.nombre === sexoNombre);
      setFormData((prev) => ({
        ...prev,
        nombre: mascota.nombre || prev.nombre,
        especie: especieItem?.MaeestroID ? String(especieItem.MaeestroID) : prev.especie,
        raza: mascota.raza || prev.raza,
        edad: mascota.edad ?? prev.edad,
        sexo: sexoItem?.MaeestroID ? String(sexoItem.MaeestroID) : prev.sexo,
        peso: mascota.peso ?? prev.peso,
        color: mascota.color || prev.color,
        foto_url: mascota.foto_url || prev.foto_url,
        observaciones: mascota.observaciones || prev.observaciones,
        cliente_id: (mascota.cliente_id ?? mascota.cliente?.cliente_id ?? prev.cliente_id) ? String(mascota.cliente_id ?? mascota.cliente?.cliente_id ?? prev.cliente_id) : prev.cliente_id,
      }));
    }
  }, [mascota, especies, sexos]);

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle>
          {mascota ? "Editar Mascota" : "Nueva Mascota"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente_id">Dueño *</Label>
              <Select
                value={formData.cliente_id ? String(formData.cliente_id) : ""}
                onValueChange={(value) => handleChange('cliente_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientesApi.map(c => (
                    <SelectItem key={c.cliente_id} value={String(c.cliente_id)}>
                      {c.nombres} {c.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="especie">Especie *</Label>
              <Select
                value={formData.especie ? String(formData.especie) : ""}
                onValueChange={(value) => handleChange('especie', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {especies.map((e) => (
                    <SelectItem key={e.MaeestroID} value={String(e.MaeestroID)}>
                      {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="raza">Raza</Label>
              <Input
                id="raza"
                value={formData.raza}
                onChange={(e) => handleChange('raza', e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edad">Edad (años)</Label>
              <Input
                id="edad"
                type="number"
                min="0"
                step="0.1"
                value={formData.edad}
                onChange={(e) => handleChange('edad', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo</Label>
              <Select
                value={formData.sexo ? String(formData.sexo) : ""}
                onValueChange={(value) => handleChange('sexo', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sexos.map((s) => (
                    <SelectItem key={s.MaeestroID} value={String(s.MaeestroID)}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="peso">Peso (kg)</Label>
              <Input
                id="peso"
                type="number"
                min="0"
                step="0.1"
                value={formData.peso}
                onChange={(e) => handleChange('peso', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color / Descripción</Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) => handleChange('color', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="foto">Fotografía</Label>
            <div className="flex gap-2">
              <Input
                id="foto"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {formData.foto_url && (
                <img src={formData.foto_url} alt="Preview" className="w-20 h-20 object-cover rounded" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
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
            className="bg-green-600 hover:bg-green-700"
            disabled={isLoading || uploading || submitting}
          >
            <Save className="w-4 h-4 mr-2" />
            {mascota ? "Actualizar" : "Guardar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}