import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useSiteSeo } from "./siteSeo";

const CASES = [
  {
    clinic: "Clinica VetNorte",
    challenge: "Agenda saturada y alto volumen de reprogramaciones.",
    result: "Reduccion de ausencias en 32% durante los primeros 60 dias.",
    kpi: "-32% no-shows",
  },
  {
    clinic: "AnimalCare 24/7",
    challenge: "Tratamientos sin trazabilidad unificada.",
    result: "Historial clinico completo y accesible para todo el equipo.",
    kpi: "+45% tiempos de respuesta",
  },
  {
    clinic: "PetHouse Centro",
    challenge: "Demasiadas llamadas de seguimiento a recepcion.",
    result: "Portal cliente activo y menos carga operativa para recepcion.",
    kpi: "-38% llamadas repetitivas",
  },
];

const TESTIMONIALS = [
  {
    quote: "Dejamos de apagar incendios diarios y empezamos a gestionar con criterios claros.",
    name: "Dra. Andrea M.",
    role: "Directora clinica",
  },
  {
    quote: "La trazabilidad del tratamiento nos dio consistencia y mejor comunicacion con tutores.",
    name: "Dr. Carlos P.",
    role: "Medico veterinario",
  },
];

export default function CaseStudiesPage() {
  useSiteSeo("Casos de exito MiVetApp", "Resultados reales de clinicas que implementaron MiVetApp.");

  const [testimonialsApi, setTestimonialsApi] = useState(null);

  useEffect(() => {
    if (!testimonialsApi) return undefined;
    const id = setInterval(() => {
      if (testimonialsApi.canScrollNext()) {
        testimonialsApi.scrollNext();
      } else {
        testimonialsApi.scrollTo(0);
      }
    }, 5200);
    return () => clearInterval(id);
  }, [testimonialsApi]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Casos de exito</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Resultados medibles en clinicas reales</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        El objetivo no es digitalizar por moda. Es mejorar productividad, experiencia y retencion.
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {CASES.map((item) => (
          <motion.article
            key={item.clinic}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">{item.clinic}</h2>
            <p className="mt-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Reto:</span> {item.challenge}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Resultado:</span> {item.result}
            </p>
            <p className="mt-4 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <TrendingUp className="h-3.5 w-3.5" />
              {item.kpi}
            </p>
          </motion.article>
        ))}
      </section>

      <section className="mt-10">
        <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
          <img src="/img/login.jpg" alt="Equipo veterinario en accion" className="h-56 w-full object-cover opacity-60 sm:h-64" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 to-slate-900/40" />
          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Banner de confianza</p>
            <h2 className="mt-1 max-w-xl text-xl font-bold text-white sm:text-2xl">
              Casos reales, resultados visibles y experiencia premium para tus clientes.
            </h2>
          </div>
        </article>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">Lo que dice el equipo clinico</h2>
        <div className="mt-4">
          <Carousel setApi={setTestimonialsApi} opts={{ align: "start" }} className="w-full">
            <CarouselContent>
              {TESTIMONIALS.map((item) => (
                <CarouselItem key={item.name} className="md:basis-1/2">
                  <blockquote className="h-full rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    <span className="mb-2 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                      <Quote className="h-4 w-4" />
                    </span>
                    "{item.quote}"
                    <footer className="mt-3 border-t border-slate-200 pt-3">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.role}</p>
                    </footer>
                  </blockquote>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>

      <section className="mt-10 rounded-2xl bg-primary p-5 text-white sm:p-6">
        <h2 className="text-xl font-semibold">Quieres convertir tu operacion en un caso de exito?</h2>
        <p className="mt-2 text-sm text-primary-foreground/90">
          Agenda una sesion y te mostramos como adaptar estas vistas a tu flujo de trabajo.
        </p>
        <Link
          to="/contacto"
          className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:bg-slate-100"
        >
          Quiero iniciar
        </Link>
      </section>
    </div>
  );
}
