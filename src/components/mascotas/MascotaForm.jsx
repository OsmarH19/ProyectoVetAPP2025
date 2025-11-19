import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Upload } from "lucide-react";

export default function MascotaForm({ mascota, clientes, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(mascota || {
    nombre: "",
    especie: "Perro",
    raza: "",
    edad: "",
    sexo: "Macho",
    peso: "",
    color: "",
    foto_url: "",
    observaciones: "",
    cliente_id: "",
  });

  const [uploading, setUploading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('foto_url', file_url);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
    setUploading(false);
  };

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
                value={formData.cliente_id}
                onValueChange={(value) => handleChange('cliente_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id}>
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
                value={formData.especie}
                onValueChange={(value) => handleChange('especie', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Perro">Perro</SelectItem>
                  <SelectItem value="Gato">Gato</SelectItem>
                  <SelectItem value="Ave">Ave</SelectItem>
                  <SelectItem value="Conejo">Conejo</SelectItem>
                  <SelectItem value="Hamster">Hamster</SelectItem>
                  <SelectItem value="Reptil">Reptil</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
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
                value={formData.sexo}
                onValueChange={(value) => handleChange('sexo', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Macho">Macho</SelectItem>
                  <SelectItem value="Hembra">Hembra</SelectItem>
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
                onChange={(e) => handleChange('peso', parseFloat(e.target.value))}
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
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700"
            disabled={isLoading || uploading}
          >
            <Save className="w-4 h-4 mr-2" />
            {mascota ? "Actualizar" : "Guardar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}