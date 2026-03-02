import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSeo } from "./siteSeo";

const MONTHLY = [
  {
    name: "Start",
    price: 149,
    desc: "Clinicas pequenas que buscan orden operativo.",
    features: ["Agenda y citas", "Mascotas y clientes", "Panel administrativo base", "Soporte por correo"],
  },
  {
    name: "Growth",
    price: 249,
    desc: "Equipo en crecimiento con foco en productividad.",
    featured: true,
    features: ["Todo en Start", "Tratamientos y recetas", "Portal para clientes", "Indicadores operativos"],
  },
  {
    name: "Pro",
    price: 399,
    desc: "Clinicas con alto volumen y mayor exigencia.",
    features: ["Todo en Growth", "Onboarding prioritario", "Soporte preferente", "Acompanamiento de adopcion"],
  },
];

const YEARLY = MONTHLY.map((plan) => ({
  ...plan,
  price: Math.round(plan.price * 0.85),
}));

const COMPARE = [
  { feature: "Agenda inteligente", start: true, growth: true, pro: true },
  { feature: "Historial clinico", start: true, growth: true, pro: true },
  { feature: "Portal cliente", start: false, growth: true, pro: true },
  { feature: "Soporte preferente", start: false, growth: false, pro: true },
];

export default function PricingPage() {
  useSiteSeo(
    "Precios MiVetApp | Planes para clinicas veterinarias",
    "Elige el plan ideal de MiVetApp para tu clinica.",
    {
      path: "/precios",
      image: "/img/login.jpg",
      keywords: [
        "precios software veterinario",
        "plan veterinaria",
        "sistema clinica veterinaria",
        "costo software veterinario",
      ],
    }
  );

  const [billing, setBilling] = useState("monthly");
  const plans = useMemo(() => (billing === "monthly" ? MONTHLY : YEARLY), [billing]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Precios</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Planes claros para cada etapa de tu clinica</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Sin costos ocultos. Pagas por estructura operativa y mejor experiencia de cliente.
      </p>

      <div className="mt-6 inline-flex rounded-lg border border-slate-300 bg-white p-1">
        <button
          type="button"
          className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
            billing === "monthly" ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
          onClick={() => setBilling("monthly")}
          aria-pressed={billing === "monthly"}
        >
          Mensual
        </button>
        <button
          type="button"
          className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
            billing === "yearly" ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
          onClick={() => setBilling("yearly")}
          aria-pressed={billing === "yearly"}
        >
          Anual (-15%)
        </button>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={`${billing}-${plan.name}`}
            className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
              plan.featured ? "border-primary ring-2 ring-primary/20" : "border-slate-200"
            }`}
          >
            {plan.featured && (
              <p className="mb-2 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                Plan recomendado
              </p>
            )}
            <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{plan.desc}</p>
            <p className="mt-5 text-3xl font-bold text-slate-900">S/{plan.price}</p>
            <p className="text-xs text-slate-500">por mes</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/contacto"
              className={`mt-5 inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
                plan.featured ? "bg-primary text-white hover:bg-primary/90" : "border border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Solicitar este plan
            </Link>
          </article>
        ))}
      </section>

      <section className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Comparativa rapida</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Funcion</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Start</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Growth</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row.feature} className="border-t border-slate-200">
                  <td className="px-4 py-3 text-slate-700">{row.feature}</td>
                  <td className="px-4 py-3 text-center">{row.start ? "Si" : "No"}</td>
                  <td className="px-4 py-3 text-center">{row.growth ? "Si" : "No"}</td>
                  <td className="px-4 py-3 text-center">{row.pro ? "Si" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
