import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chrome } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function parseJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function Login() {
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [error, setError] = useState("");

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const googleAuthEndpoint = import.meta.env.VITE_GOOGLE_AUTH_ENDPOINT || "";

  const canSubmit = email.trim() && password.trim() && !isLoading;
  const canUseGoogle = useMemo(
    () => googleClientId.trim().length > 0,
    [googleClientId]
  );

  const saveSessionAndRedirect = (rawUser, rawToken = "") => {
    const user = {
      ...rawUser,
      profileID: Number(rawUser?.profileID ?? rawUser?.profile_id ?? 5),
      needs_cliente_profile: Boolean(
        rawUser?.needs_cliente_profile ??
          rawUser?.cliente_profile_completed === false
      ),
    };

    localStorage.setItem("auth_user", JSON.stringify(user));
    if (rawToken) {
      localStorage.setItem("auth_token", rawToken);
    } else {
      localStorage.removeItem("auth_token");
    }

    if (user.needs_cliente_profile) {
      navigate("/completar-cliente", { replace: true });
      return;
    }

    const last = localStorage.getItem("last_route");
    const isForbiddenLast =
      !last ||
      ["/login", "/completar-cliente"].includes((last || "").toLowerCase());
    const defaultRoute = user.profileID === 1 ? "/dashboard" : "/clientedashboard";
    navigate(isForbiddenLast ? defaultRoute : last, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("https://apivet.strategtic.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data?.status) {
        saveSessionAndRedirect(data.user, data?.token || data?.access_token || "");
      } else {
        setError(data?.message || "Credenciales incorrectas");
      }
    } catch {
      setError("No se pudo iniciar sesion. Intentalo nuevamente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      setGoogleError("No se pudo obtener el token de Google.");
      return;
    }

    setIsGoogleLoading(true);
    setGoogleError("");
    setError("");

    const parsed = parseJwtPayload(idToken) || {};
    const fallbackName =
      parsed?.name ||
      [parsed?.given_name, parsed?.family_name].filter(Boolean).join(" ").trim() ||
      "Cliente";

    const fallbackUser = {
      id: parsed?.sub || `google_${Date.now()}`,
      name: fallbackName,
      email: parsed?.email || "",
      profileID: 5,
      provider: "google",
      google_sub: parsed?.sub || "",
      needs_cliente_profile: true,
      cliente_profile_completed: false,
    };

    try {
      if (googleAuthEndpoint) {
        const res = await fetch(googleAuthEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "google",
            credential: idToken,
            id_token: idToken,
          }),
        });

        const data = await res.json().catch(() => ({}));
        const ok = res.ok && data?.status !== false && data?.success !== false;
        if (!ok) {
          throw new Error(data?.message || "No se pudo autenticar con Google.");
        }

        const userFromApi = data?.user || data?.data?.user || data?.data || {};
        const normalizedUser = {
          ...fallbackUser,
          ...userFromApi,
          name: userFromApi?.name || fallbackUser.name,
          email: userFromApi?.email || fallbackUser.email,
          profileID: Number(userFromApi?.profileID ?? userFromApi?.profile_id ?? 5),
          needs_cliente_profile: Boolean(
            data?.needs_cliente_profile ??
              userFromApi?.needs_cliente_profile ??
              userFromApi?.cliente_profile_completed === false
          ),
        };
        const token = data?.token || data?.access_token || data?.data?.token || "";
        saveSessionAndRedirect(normalizedUser, token);
        return;
      }

      saveSessionAndRedirect(fallbackUser);
    } catch (err) {
      setGoogleError(err?.message || "No se pudo iniciar sesion con Google.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (!canUseGoogle) return undefined;

    let cancelled = false;
    const scriptId = "google-identity-services";

    const renderGoogleButton = () => {
      if (cancelled) return;
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
        width: 320,
      });
      setGoogleReady(true);
    };

    const existing = document.getElementById(scriptId);
    if (existing) {
      renderGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => setGoogleError("No se pudo cargar Google Identity Services.");
    document.body.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [canUseGoogle, googleClientId]);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden md:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/30 z-10 pointer-events-none" />
        <img
          src="/img/login.jpg"
          alt="VetApp"
          className="absolute inset-0 w-full h-full object-cover object-center md:object-left"
        />
        <div className="absolute z-20 bottom-8 left-8 text-white">
          <p className="text-lg font-medium">Bienvenido a VetApp</p>
          <p className="text-sm opacity-80">Gestion veterinaria moderna</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-white via-white to-gray-50">
        <Card className="w-full max-w-md shadow-xl border-none">
          <CardContent className="p-8 space-y-6">
            <div className="flex justify-center">
              <img src="/logos/logoVetApp.png" alt="Logo VetApp" className="h-20 w-auto" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@correo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={!canSubmit}
              >
                {isLoading ? "Ingresando..." : "Iniciar sesion"}
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">o</span>
                </div>
              </div>

              {canUseGoogle ? (
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <div ref={googleButtonRef} />
                  </div>
                  {!googleReady && (
                    <Button type="button" variant="outline" className="w-full" disabled={isGoogleLoading}>
                      <Chrome className="w-4 h-4 mr-2" />
                      {isGoogleLoading ? "Conectando..." : "Continuar con Google"}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md bg-amber-50 text-amber-700 text-xs px-3 py-2">
                  Configura `VITE_GOOGLE_CLIENT_ID` para habilitar Google.
                </div>
              )}

              {googleError && (
                <div className="rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">
                  {googleError}
                </div>
              )}
            </form>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                &copy; {new Date().getFullYear()} VetApp
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

