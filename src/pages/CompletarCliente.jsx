import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toastr from "toastr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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

  const createClienteEndpoint =
    import.meta.env.VITE_CLIENTE_CREATE_ENDPOINT || "https://apivet.strategtic.com/api/clientes";
  const welcomeEmailEndpoint = import.meta.env.VITE_WELCOME_EMAIL_ENDPOINT || "";

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const submitWelcomeEmail = async ({ clienteId }) => {
    if (!welcomeEmailEndpoint) return;
    await fetch(welcomeEmailEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_id: clienteId,
        email: formData.email,
        nombres: formData.nombres,
        apellidos: formData.apellidos,
      }),
    });
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
        throw new Error(data?.message || "No se pudo guardar los datos del cliente.");
      }

      const clienteId =
        data?.cliente_id ||
        data?.data?.cliente_id ||
        data?.data?.id ||
        data?.id ||
        null;

      try {
        await submitWelcomeEmail({ clienteId });
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
      setError(err?.message || "No se pudo completar el perfil.");
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
                  <Input
                    id="dni"
                    value={formData.dni}
                    onChange={(e) =>
                      handleChange("dni", e.target.value.replace(/\D/g, "").slice(0, 8))
                    }
                    placeholder="8 digitos"
                    required
                  />
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

