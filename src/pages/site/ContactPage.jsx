import { useState } from "react";
import { Mail, PhoneCall } from "lucide-react";
import { useSiteSeo } from "./siteSeo";

const FAQ = [
  {
    q: "Cuanto dura la implementacion?",
    a: "Entre 24 y 72 horas para configuracion inicial y entrenamiento.",
  },
  {
    q: "Puedo migrar desde Excel?",
    a: "Si. Te compartimos una guia de migracion y soporte inicial.",
  },
  {
    q: "Necesito instalar software?",
    a: "No. MiVetApp funciona en navegador desktop y movil.",
  },
];

export default function ContactPage() {
  useSiteSeo("Contacto MiVetApp | Solicitar demo", "Solicita una demo de MiVetApp y recibe asesoria para tu clinica.");

  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Contacto</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Solicita una demo personalizada</h1>
        <p className="mt-3 text-slate-600">
          Cuentanos sobre tu clinica y te mostramos un recorrido de producto basado en tu flujo real.
        </p>

        {!submitted ? (
          <form
            className="mt-6 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            aria-label="Formulario de contacto"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Nombre
                <input className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-primary" required />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Clinica
                <input className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-primary" required />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-primary"
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Telefono
                <input className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-primary" required />
              </label>
            </div>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Que necesitas mejorar primero?
              <textarea
                rows={4}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="Ej: agenda, seguimiento de tratamientos, experiencia cliente..."
                required
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Enviar solicitud
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Recibimos tu solicitud. Te contactaremos para agendar la demo.
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Canales directos</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              soporte@mivetapp.com
            </li>
            <li className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-primary" />
              +51 999 999 999
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Preguntas frecuentes</h2>
          <ul className="mt-4 space-y-3">
            {FAQ.map((item) => (
              <li key={item.q} className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{item.q}</p>
                <p className="mt-1 text-xs text-slate-600">{item.a}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

