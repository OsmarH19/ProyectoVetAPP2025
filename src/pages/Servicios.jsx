import { useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toastr from "toastr";
import {
  Sparkles,
  Plus,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TABS = {
  activos: "activos",
  inactivos: "inactivos",
  todos: "todos",
};

const EMPTY_FORM = {
  id: null,
  nombre: "",
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
  const [deleteTarget, setDeleteTarget] = useState(null);

  const queryClient = useQueryClient();

  const {
    data: servicios = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["api_servicios"],
    queryFn: async () => {
      const response = await fetch(apiUrl("/servicios"));
      const json = await parseJsonSafe(response);
      if (!response.ok || json?.success === false) {
        throw new Error(extractApiError(json, "No se pudo cargar servicios."));
      }
      const items = Array.isArray(json?.data) ? json.data : [];
      return items.map((item) => {
        return {
          id: Number(item?.id ?? 0),
          nombre: item?.nombre || "",
          tipoNombre: item?.tiposervicio?.nombre || item?.tipo || "",
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
    const setTipos = new Set();
    servicios.forEach((item) => {
      const tipo = String(item?.tipoNombre || "").trim();
      if (tipo) setTipos.add(tipo);
    });
    return [{ value: "todos", label: "Todos los tipos" }, ...Array.from(setTipos).map((tipo) => ({ value: tipo, label: tipo }))];
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

      const byType = tipoFiltro === "todos" ? true : item.tipoNombre === tipoFiltro;

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
      const response = await fetch(apiUrl("/servicios"), {
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
      const response = await fetch(apiUrl(`/servicios/${id}`), {
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

    if (!payload.nombre || !payload.descripcion) {
      toastr.warning("Completa nombre y descripcion.");
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

  const handleDelete = (servicio) => {
    setDeleteTarget(servicio);
  };

  const confirmDelete = () => {
    if (!deleteTarget?.id) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <section className="rounded-lg border border-slate-200 p-4 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-900">1. Identificacion del servicio</h3>
                    <p className="text-xs text-muted-foreground">Define claramente que servicio ofreces.</p>
                  </div>

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
                    <Label htmlFor="descripcion">Descripcion *</Label>
                    <Textarea
                      id="descripcion"
                      rows={2}
                      value={formData.descripcion}
                      onChange={(e) => handleFormChange("descripcion", e.target.value)}
                      required
                    />
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 p-4 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-900">2. Precio y tiempo</h3>
                    <p className="text-xs text-muted-foreground">Configura el costo y la duracion de atencion.</p>
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
                </section>

                <section className="rounded-lg border border-slate-200 p-4 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-900">3. Reglas y notas</h3>
                    <p className="text-xs text-muted-foreground">Define disponibilidad y detalles operativos.</p>
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

                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      rows={2}
                      value={formData.observaciones}
                      onChange={(e) => handleFormChange("observaciones", e.target.value)}
                    />
                  </div>
                </section>

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

        {!showForm && (
          <>
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
              <Card className="shadow-sm border-slate-200">
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center">Nombre</TableHead>
                          <TableHead className="text-center">Descripcion</TableHead>
                          <TableHead className="text-center">Precio</TableHead>
                          <TableHead className="text-center">Duracion</TableHead>
                          <TableHead className="text-center">Cita previa</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                          <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serviciosFiltrados.map((servicio) => (
                          <TableRow key={servicio.id} className="hover:bg-muted/40">
                            <TableCell>
                              <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${badgeColorTipo(servicio.nombre)}`}>
                                {servicio.nombre}
                              </span>
                            </TableCell>
                            <TableCell>
                              <p className="max-w-[340px] mx-auto truncate text-slate-700">
                                {servicio.descripcion}
                              </p>
                              <p className="max-w-[340px] mx-auto truncate text-xs text-muted-foreground mt-1">
                                {servicio.observaciones || "Sin observaciones"}
                              </p>
                            </TableCell>
                            <TableCell className="text-center font-semibold text-primary">
                              S/ {servicio.precio.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center text-secondary font-semibold">
                              {servicio.duracion} min
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${
                                  servicio.requiere_cita_previa
                                    ? "border-accent/60 text-accent-foreground bg-accent/20"
                                    : "border-muted text-muted-foreground bg-muted/40"
                                }`}
                              >
                                {servicio.requiere_cita_previa ? "Si" : "No"}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                                  servicio.activo ? "bg-primary text-primary-foreground" : "bg-destructive/10 text-destructive"
                                }`}
                              >
                                {servicio.activo ? "Disponible" : "Inactivo"}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-2">
                                <Button variant="outline" size="sm" className="text-slate-700" onClick={() => openEditForm(servicio)}>
                                  <Pencil className="w-4 h-4 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleDelete(servicio)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Eliminar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {serviciosFiltrados.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                              No hay servicios para el filtro seleccionado.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar servicio</AlertDialogTitle>
            <AlertDialogDescription>
              Esta seguro de eliminar este servicio?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
