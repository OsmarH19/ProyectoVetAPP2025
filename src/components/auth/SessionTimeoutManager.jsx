import { useCallback, useEffect, useRef, useState } from "react";
import { Clock3 } from "lucide-react";
import toastr from "toastr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AUTH_CHANGED_EVENT,
  SESSION_CONFIRMATION_SECONDS,
  SESSION_DURATION_MS,
  clearAuthData,
  ensureSessionWindow,
  hasAuthSession,
  renewSessionWindow,
} from "@/lib/session";

const AUTH_KEYS = new Set([
  "auth_user",
  "auth_token",
  "auth_session_started_at",
  "auth_session_last_confirmed_at",
]);

const remainingMs = (startedAt) => startedAt + SESSION_DURATION_MS - Date.now();

export default function SessionTimeoutManager() {
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [countdown, setCountdown] = useState(SESSION_CONFIRMATION_SECONDS);

  const expiryTimeoutRef = useRef(null);
  const autoLogoutTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const promptOpenRef = useRef(false);

  const clearExpiryTimer = () => {
    if (expiryTimeoutRef.current) {
      window.clearTimeout(expiryTimeoutRef.current);
      expiryTimeoutRef.current = null;
    }
  };

  const clearPromptTimers = () => {
    if (autoLogoutTimeoutRef.current) {
      window.clearTimeout(autoLogoutTimeoutRef.current);
      autoLogoutTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const closePrompt = useCallback(() => {
    clearPromptTimers();
    promptOpenRef.current = false;
    setIsPromptOpen(false);
  }, []);

  const forceLogout = useCallback(() => {
    closePrompt();
    clearExpiryTimer();
    clearAuthData();
    toastr.warning("La sesion se cerro automaticamente.", "Sesion expirada");
    window.location.replace("/login");
  }, [closePrompt]);

  const openPrompt = useCallback(() => {
    if (!hasAuthSession() || promptOpenRef.current) return;

    clearExpiryTimer();
    clearPromptTimers();

    promptOpenRef.current = true;
    setCountdown(SESSION_CONFIRMATION_SECONDS);
    setIsPromptOpen(true);

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    autoLogoutTimeoutRef.current = window.setTimeout(() => {
      forceLogout();
    }, SESSION_CONFIRMATION_SECONDS * 1000);
  }, [forceLogout]);

  const scheduleExpiryCheck = useCallback(() => {
    clearExpiryTimer();

    if (!hasAuthSession()) {
      closePrompt();
      return;
    }

    const startedAt = ensureSessionWindow();
    const ms = remainingMs(startedAt);
    if (ms <= 0) {
      openPrompt();
      return;
    }

    expiryTimeoutRef.current = window.setTimeout(() => {
      openPrompt();
    }, ms);
  }, [closePrompt, openPrompt]);

  const handleContinue = () => {
    renewSessionWindow();
    closePrompt();
    scheduleExpiryCheck();
  };

  useEffect(() => {
    scheduleExpiryCheck();

    const handleAuthChanged = () => {
      scheduleExpiryCheck();
    };

    const handleStorage = (event) => {
      if (!event.key || AUTH_KEYS.has(event.key)) {
        scheduleExpiryCheck();
      }
    };

    const handleFocus = () => {
      scheduleExpiryCheck();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        scheduleExpiryCheck();
      }
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearExpiryTimer();
      clearPromptTimers();
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [closePrompt, scheduleExpiryCheck]);

  if (!isPromptOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Clock3 className="w-5 h-5 text-amber-600" />
            Sesion expirada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            Tu sesion ha expirado. Confirma si seguiras realizando actividad en el sistema.
          </p>
          <p className="text-sm font-medium text-amber-700">
            Se cerrara automaticamente en {countdown} segundos.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={forceLogout}>
              Cerrar sesion
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleContinue}>
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

