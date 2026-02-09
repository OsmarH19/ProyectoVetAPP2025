import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toastr from "toastr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

function extractApiErrorMessage(json, fallback = "No se pudo completar el perfil.") {
  const baseMessage = (json?.message || fallback || "").trim();
  const errors = json?.errors;
  if (!errors || typeof errors !== "object") return baseMessage;

  const details = Object.entries(errors).flatMap(([field, fieldErrors]) => {
    const list = Array.isArray(fieldErrors) ? fieldErrors : [fieldErrors];
    return list
      .filter(Boolean)
      .map((msg) => `${field}: ${String(msg).trim()}`);
  });

  if (details.length === 0) return baseMessage;
  return `${baseMessage} - ${details.join(" | ")}`;
}

function safeParseUser() {
  const raw = localStorage.getItem("auth_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function CompletarCliente() {
  const navigate = useNavigate();
  const user = useMemo(() => safeParseUser(), []);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const FACTILIZA_TOKEN =
    import.meta.env.VITE_FACTILIZA_TOKEN ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ODEiLCJuYW1lIjoiQ29ycG9yYWNpb24gQUNNRSIsImVtYWlsIjoicmZsb3JlekBhY21ldGljLmNvbS5wZSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnN1bHRvciJ9.06GySJlpTrqWUQA5EI3tDHvLn8LNzZ2m5VBSIy_SbF4";

  const [formData, setFormData] = useState(() => {
    const name = user?.name || "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return {
      nombres: parts.slice(0, 2).join(" "),
      apellidos: parts.slice(2).join(" "),
      dni: "",
      direccion: "",
      telefono: "",
      email: user?.email || "",
    };
  });
  const [dniLoading, setDniLoading] = useState(false);
  const [dniError, setDniError] = useState("");
  const lastLookupRef = useRef("");

  const createClienteEndpoint =
    import.meta.env.VITE_CLIENTE_CREATE_ENDPOINT || "https://apivet.strategtic.com/api/clientes";
  const welcomeEmailEndpoint = import.meta.env.VITE_WELCOME_EMAIL_ENDPOINT || "";

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const runDniLookup = async (dni, { force = false } = {}) => {
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
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "No se pudo validar el DNI.");
      }
      const data = json?.data || {};
      const apellidos = `${data.apellido_paterno || ""} ${data.apellido_materno || ""}`.trim();
      setFormData((prev) => ({
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

  const handleDniSearch = () => {
    const dni = (formData.dni || "").trim();
    if (dni.length !== 8) {
      setDniError("Ingresa 8 digitos para buscar.");
      return;
    }
    runDniLookup(dni, { force: true });
  };

  const submitWelcomeEmail = async () => {
    if (!welcomeEmailEndpoint) return;
    const nombre = `${formData.nombres} ${formData.apellidos}`.trim();
    if (!formData.email || !nombre) return;
    const res = await fetch(welcomeEmailEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        nombre,
      }),
    });
    const text = await res.text();
    let json = {};
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = {};
      }
    }
    if (!res.ok || json?.success === false || json?.status === false) {
      throw new Error(json?.message || "No se pudo enviar el correo de bienvenida.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    const payload = {
      nombres: formData.nombres.trim(),
      apellidos: formData.apellidos.trim(),
      dni: formData.dni.trim(),
      direccion: formData.direccion.trim(),
      telefono: formData.telefono.trim(),
      email: formData.email.trim(),
      user_id: user?.id || null,
      provider: user?.provider || "google",
    };

    try {
      const res = await fetch(createClienteEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.status === false || data?.success === false) {
        throw new Error(
          extractApiErrorMessage(data, "No se pudo guardar los datos del cliente.")
        );
      }

      const clienteId =
        data?.cliente_id ||
        data?.data?.cliente_id ||
        data?.data?.id ||
        data?.id ||
        null;

      try {
        await submitWelcomeEmail();
      } catch {
        // Welcome email is best effort and should not block onboarding.
      }

      const current = safeParseUser() || {};
      const nextUser = {
        ...current,
        needs_cliente_profile: false,
        cliente_profile_completed: true,
        cliente_id: clienteId,
      };
      localStorage.setItem("auth_user", JSON.stringify(nextUser));

      toastr.success("Perfil cliente completado.");
      navigate("/clientedashboard", { replace: true });
    } catch (err) {
      const message = err?.message || "No se pudo completar el perfil.";
      setError(message);
      toastr.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Completar datos del cliente</CardTitle>
            <p className="text-sm text-gray-600">
              Tu cuenta fue creada con Google. Completa estos datos para terminar el registro.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombres">Nombres *</Label>
                  <Input
                    id="nombres"
                    value={formData.nombres}
                    onChange={(e) => handleChange("nombres", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    value={formData.apellidos}
                    onChange={(e) => handleChange("apellidos", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="dni"
                      value={formData.dni}
                      onChange={(e) =>
                        handleChange("dni", e.target.value.replace(/\D/g, "").slice(0, 8))
                      }
                      placeholder="8 digitos"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDniSearch}
                      disabled={dniLoading || (formData.dni || "").trim().length !== 8}
                    >
                      <Search className="w-4 h-4 mr-1" />
                      Buscar
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {dniLoading
                      ? "Buscando DNI..."
                      : dniError
                        ? <span className="text-red-600">{dniError}</span>
                        : "Presiona Buscar para autocompletar."}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Telefono *</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => handleChange("telefono", e.target.value)}
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
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Direccion</Label>
                <Textarea
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => handleChange("direccion", e.target.value)}
                  rows={3}
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar y continuar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
