import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toastr from "toastr";
import {
  Sparkles,
  Plus,
  Search,
  Stethoscope,
  Scissors,
  Bath,
  Clock3,
  DollarSign,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const TIPO_SERVICIO_OPTIONS = [
  { id: 1, nombre: "Consulta Veterinaria" },
  { id: 2, nombre: "Bano" },
  { id: 3, nombre: "Peluqueria" },
  { id: 4, nombre: "Vacunacion" },
  { id: 5, nombre: "Desparasitacion" },
  { id: 6, nombre: "Cirugia Menor" },
  { id: 7, nombre: "Cirugia Mayor" },
  { id: 8, nombre: "Control Postoperatorio" },
  { id: 9, nombre: "Examen de Laboratorio" },
  { id: 10, nombre: "Emergencia" },
];

const TABS = {
  activos: "activos",
  inactivos: "inactivos",
  todos: "todos",
};

const EMPTY_FORM = {
  id: null,
  nombre: "",
  tiposervicioID: "1",
  descripcion: "",
  precio: "",
  duracion: "",
  observaciones: "",
  requiere_cita_previa: true,
  activo: true,
};

function toBool(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "si";
  }
  return false;
}

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function extractApiError(json, fallback = "Ocurrio un error en la solicitud.") {
  const baseMessage = (json?.message || fallback || "").trim();
  const errors = json?.errors;

  if (!errors || typeof errors !== "object") {
    return baseMessage;
  }

  const details = Object.entries(errors).flatMap(([field, fieldErrors]) => {
    const list = Array.isArray(fieldErrors) ? fieldErrors : [fieldErrors];
    return list.filter(Boolean).map((msg) => `${field}: ${String(msg).trim()}`);
  });

  if (details.length === 0) return baseMessage;
  return `${baseMessage} - ${details.join(" | ")}`;
}

function getTipoNombreById(tipoId) {
  const found = TIPO_SERVICIO_OPTIONS.find((item) => item.id === Number(tipoId));
  return found?.nombre || `Tipo ${tipoId || "-"}`;
}

function iconoServicioByTipo(tipoNombre) {
  const normalized = String(tipoNombre || "").toLowerCase();
  if (normalized.includes("peluquer")) return Scissors;
  if (normalized.includes("bano") || normalized.includes("ba")) return Bath;
  return Stethoscope;
}

function badgeColorTipo(tipoNombre) {
  const normalized = String(tipoNombre || "").toLowerCase();
  if (normalized.includes("consulta")) return "bg-primary/15 text-primary";
  if (normalized.includes("bano") || normalized.includes("ba")) return "bg-secondary/15 text-secondary";
  if (normalized.includes("peluquer")) return "bg-accent/25 text-foreground";
  if (normalized.includes("vacun")) return "bg-primary/10 text-primary";
  return "bg-muted text-muted-foreground";
}

export default function Servicios() {
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [tab, setTab] = useState(TABS.activos);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const queryClient = useQueryClient();
  const apiBase = import.meta.env.VITE_API_URL || "https://apivet.strategtic.com";

  const {
    data: servicios = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["api_servicios"],
    queryFn: async () => {
      const response = await fetch(`${apiBase}/api/servicios`);
      const json = await parseJsonSafe(response);
      if (!response.ok || json?.success === false) {
        throw new Error(extractApiError(json, "No se pudo cargar servicios."));
      }
      const items = Array.isArray(json?.data) ? json.data : [];
      return items.map((item) => {
        const tipoId = Number(
          item?.tiposervicioID ?? item?.tipo_servicio_id ?? item?.tiposervicio_id ?? 0
        ) || null;
        return {
          id: Number(item?.id ?? 0),
          nombre: item?.nombre || "",
          tiposervicioID: tipoId,
          tipoNombre: item?.tiposervicio?.nombre || getTipoNombreById(tipoId),
          descripcion: item?.descripcion || "",
          precio: Number(item?.precio ?? 0) || 0,
          duracion: Number(item?.duracion ?? 0) || 0,
          observaciones: item?.observaciones || "",
          requiere_cita_previa: toBool(item?.requiere_cita_previa),
          activo: toBool(item?.activo),
        };
      });
    },
  });

  const counts = useMemo(() => {
    const activos = servicios.filter((item) => item.activo).length;
    const inactivos = servicios.filter((item) => !item.activo).length;
    return {
      activos,
      inactivos,
      todos: servicios.length,
    };
  }, [servicios]);

  const tiposDisponiblesFiltro = useMemo(() => {
    const map = new Map();
    map.set("todos", "Todos los tipos");

    TIPO_SERVICIO_OPTIONS.forEach((item) => {
      map.set(String(item.id), item.nombre);
    });

    servicios.forEach((item) => {
      if (!item.tiposervicioID) return;
      const key = String(item.tiposervicioID);
      if (!map.has(key)) {
        map.set(key, item.tipoNombre || `Tipo ${item.tiposervicioID}`);
      }
    });

    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [servicios]);

  const serviciosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();

    return servicios.filter((item) => {
      const byTab =
        tab === TABS.todos
          ? true
          : tab === TABS.activos
            ? item.activo
            : !item.activo;

      const byType =
        tipoFiltro === "todos" ? true : String(item.tiposervicioID || "") === tipoFiltro;

      const bySearch =
        !term ||
        item.nombre.toLowerCase().includes(term) ||
        item.descripcion.toLowerCase().includes(term) ||
        item.tipoNombre.toLowerCase().includes(term);

      return byTab && byType && bySearch;
    });
  }, [servicios, search, tipoFiltro, tab]);

  const saveMutation = useMutation({
    mutationFn: async ({ payload }) => {
      const response = await fetch(`${apiBase}/api/servicios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await parseJsonSafe(response);
      if (!response.ok || json?.success === false || json?.status === false) {
        throw new Error(extractApiError(json, "No se pudo guardar el servicio."));
      }
      return json;
    },
    onSuccess: async (_, vars) => {
      await queryClient.invalidateQueries({ queryKey: ["api_servicios"] });
      setShowForm(false);
      setFormData(EMPTY_FORM);
      toastr.success(vars?.isEdit ? "Servicio actualizado correctamente." : "Servicio creado correctamente.");
    },
    onError: (err) => {
      toastr.error(err?.message || "No se pudo guardar el servicio.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`${apiBase}/api/servicios/${id}`, {
        method: "DELETE",
      });
      const json = await parseJsonSafe(response);
      if (!response.ok || json?.success === false || json?.status === false) {
        throw new Error(extractApiError(json, "No se pudo eliminar el servicio."));
      }
      return json;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["api_servicios"] });
      toastr.success("Servicio eliminado correctamente.");
    },
    onError: (err) => {
      toastr.error(err?.message || "No se pudo eliminar el servicio.");
    },
  });

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateForm = () => {
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (servicio) => {
    setFormData({
      id: servicio.id,
      nombre: servicio.nombre,
      tiposervicioID: String(servicio.tiposervicioID || "1"),
      descripcion: servicio.descripcion,
      precio: servicio.precio ? String(servicio.precio) : "",
      duracion: servicio.duracion ? String(servicio.duracion) : "",
      observaciones: servicio.observaciones,
      requiere_cita_previa: Boolean(servicio.requiere_cita_previa),
      activo: Boolean(servicio.activo),
    });
    setShowForm(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      nombre: formData.nombre.trim(),
      tiposervicioID: Number(formData.tiposervicioID),
      descripcion: formData.descripcion.trim(),
      precio: Number(formData.precio),
      duracion: Number(formData.duracion),
      observaciones: formData.observaciones.trim(),
      requiere_cita_previa: formData.requiere_cita_previa ? 1 : 0,
      activo: formData.activo ? 1 : 0,
    };

    if (formData.id) {
      payload.id = Number(formData.id);
    }

    if (!payload.nombre || !payload.tiposervicioID || !payload.descripcion) {
      toastr.warning("Completa nombre, tipo y descripcion.");
      return;
    }

    if (!Number.isFinite(payload.precio) || payload.precio < 0) {
      toastr.warning("El precio debe ser un numero valido.");
      return;
    }

    if (!Number.isFinite(payload.duracion) || payload.duracion <= 0) {
      toastr.warning("La duracion debe ser mayor a 0.");
      return;
    }

    saveMutation.mutate({ payload, isEdit: Boolean(formData.id) });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Esta seguro de eliminar este servicio?")) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-primary" />
              Gestion de Servicios
            </h1>
            <p className="text-gray-600 mt-1">Administra todos los servicios para mascotas</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white" onClick={openCreateForm}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Servicio
          </Button>
        </div>

        {showForm && (
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {formData.id ? "Editar Servicio" : "Nuevo Servicio"}
              </h2>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleFormChange("nombre", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiposervicioID">Tipo de servicio *</Label>
                    <select
                      id="tiposervicioID"
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full"
                      value={formData.tiposervicioID}
                      onChange={(e) => handleFormChange("tiposervicioID", e.target.value)}
                      required
                    >
                      {TIPO_SERVICIO_OPTIONS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="precio">Precio *</Label>
                    <Input
                      id="precio"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.precio}
                      onChange={(e) => handleFormChange("precio", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duracion">Duracion (min) *</Label>
                    <Input
                      id="duracion"
                      type="number"
                      min="1"
                      step="1"
                      value={formData.duracion}
                      onChange={(e) => handleFormChange("duracion", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripcion *</Label>
                  <Textarea
                    id="descripcion"
                    rows={2}
                    value={formData.descripcion}
                    onChange={(e) => handleFormChange("descripcion", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    rows={2}
                    value={formData.observaciones}
                    onChange={(e) => handleFormChange("observaciones", e.target.value)}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                    <span className="text-sm font-medium text-slate-700">Requiere cita previa</span>
                    <Switch
                      checked={formData.requiere_cita_previa}
                      onCheckedChange={(checked) => handleFormChange("requiere_cita_previa", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                    <span className="text-sm font-medium text-slate-700">Activo</span>
                    <Switch
                      checked={formData.activo}
                      onCheckedChange={(checked) => handleFormChange("activo", checked)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setFormData(EMPTY_FORM);
                    }}
                    disabled={saveMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Guardando..." : formData.id ? "Actualizar" : "Guardar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar servicios..."
                  className="pl-10"
                />
              </div>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[210px]"
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
              >
                {tiposDisponiblesFiltro.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="inline-flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setTab(TABS.activos)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === TABS.activos ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Activos ({counts.activos})
          </button>
          <button
            type="button"
            onClick={() => setTab(TABS.inactivos)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === TABS.inactivos ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Inactivos ({counts.inactivos})
          </button>
          <button
            type="button"
            onClick={() => setTab(TABS.todos)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === TABS.todos ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos ({counts.todos})
          </button>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="py-10 text-center text-slate-500">Cargando servicios...</CardContent>
          </Card>
        )}

        {isError && !isLoading && (
          <Card>
            <CardContent className="py-10 text-center text-red-600">{error?.message || "No se pudo cargar servicios."}</CardContent>
          </Card>
        )}

        {!isLoading && !isError && (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {serviciosFiltrados.map((servicio) => {
                const Icono = iconoServicioByTipo(servicio.tipoNombre);
                return (
                  <Card key={servicio.id} className="shadow-sm border-slate-200 overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-200 space-y-4">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Icono className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold leading-tight text-slate-900">{servicio.nombre}</h3>
                            <span
                              className={`inline-flex px-3 py-1 rounded-md text-xs font-semibold mt-2 ${badgeColorTipo(
                                servicio.tipoNombre
                              )}`}
                            >
                              {servicio.tipoNombre}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`inline-flex px-3 py-1 rounded-md text-xs font-semibold ${
                            servicio.activo ? "bg-primary text-primary-foreground" : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {servicio.activo ? "Disponible" : "Inactivo"}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 space-y-4">
                      <p className="text-slate-700 min-h-[56px]">{servicio.descripcion}</p>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                          <p className="text-xs uppercase tracking-wide text-primary flex items-center gap-1">
                            <DollarSign className="w-4 h-4" /> Precio
                          </p>
                          <p className="text-4xl font-bold text-primary mt-1">S/ {servicio.precio.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg border border-secondary/20 bg-secondary/5 p-3">
                          <p className="text-xs uppercase tracking-wide text-secondary flex items-center gap-1">
                            <Clock3 className="w-4 h-4" /> Duracion
                          </p>
                          <p className="text-4xl font-bold text-secondary mt-1">{servicio.duracion} min</p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-600">Observaciones</p>
                        <p className="text-slate-700 mt-1">{servicio.observaciones || "Sin observaciones."}</p>
                      </div>

                      {servicio.requiere_cita_previa && (
                        <span className="inline-flex px-3 py-1 rounded-md text-xs font-medium border border-accent/60 text-accent-foreground bg-accent/20">
                          Requiere cita previa
                        </span>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" className="text-slate-700" onClick={() => openEditForm(servicio)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDelete(servicio.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {serviciosFiltrados.length === 0 && (
              <Card className="border-dashed border-slate-300">
                <CardContent className="py-12 text-center text-slate-500">
                  No hay servicios para el filtro seleccionado.
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
