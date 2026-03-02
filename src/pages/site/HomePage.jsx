import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck2, FileText, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useSiteSeo } from "./siteSeo";

const STATS = [
  { value: "-32%", label: "ausencias en agenda" },
  { value: "+41%", label: "eficiencia operativa" },
  { value: "8h", label: "ahorro administrativo semanal" },
];

const HIGHLIGHTS = [
  {
    icon: CalendarCheck2,
    title: "Agenda inteligente",
    description: "Evita cruces de citas y organiza turnos por veterinario y horario real.",
  },
  {
    icon: FileText,
    title: "Historial clinico centralizado",
    description: "Tratamientos, diagnosticos y documentos en un solo lugar, listos para seguimiento.",
  },
  {
    icon: Users,
    title: "Portal para clientes",
    description: "Tus clientes consultan mascotas, citas y tratamientos sin saturar recepcion.",
  },
  {
    icon: ShieldCheck,
    title: "Control por perfiles",
    description: "Accesos diferenciados para administracion, staff y tutores de mascotas.",
  },
];

const HERO_SLIDES = [
  {
    title: "Agenda visual para una recepcion sin caos",
    subtitle: "Bloquea conflictos y asigna turnos por veterinario en segundos.",
    cta: "Ver soluciones",
    to: "/soluciones",
    image: "/img/login.jpg",
  },
  {
    title: "Seguimiento clinico que si se siente profesional",
    subtitle: "Tratamientos, recomendaciones y estado del paciente en una sola vista.",
    cta: "Ver casos",
    to: "/casos",
    image: "/img/login.jpg",
  },
  {
    title: "Experiencia premium para dueños de mascotas",
    subtitle: "Tus clientes consultan citas e historial sin saturar recepcion.",
    cta: "Solicitar demo",
    to: "/contacto",
    image: "/img/login.jpg",
  },
];

const BANNERS = [
  {
    title: "Banner Operativo",
    description: "Vista ejecutiva con citas del dia, pendientes y carga clinica.",
    image: "/img/login.jpg",
  },
  {
    title: "Banner Atencion",
    description: "Flujo continuo entre recepcion, consulta y seguimiento.",
    image: "/img/login.jpg",
  },
  {
    title: "Banner Cliente",
    description: "Comunicacion clara para elevar confianza y recompra.",
    image: "/img/login.jpg",
  },
];

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function HomePage() {
  useSiteSeo(
    "MiVetApp | Plataforma veterinaria completa",
    "Gestiona agenda, mascotas, tratamientos y experiencia del cliente con una plataforma veterinaria completa.",
    {
      path: "/",
      image: "/img/login.jpg",
      keywords: [
        "software veterinario",
        "gestion veterinaria",
        "agenda veterinaria",
        "historial clinico veterinario",
        "vetapp",
      ],
    }
  );

  const [heroApi, setHeroApi] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (!heroApi) return undefined;
    const onSelect = () => setHeroIndex(heroApi.selectedScrollSnap());
    onSelect();
    heroApi.on("select", onSelect);
    return () => {
      heroApi.off("select", onSelect);
    };
  }, [heroApi]);

  useEffect(() => {
    if (!heroApi) return undefined;
    const id = setInterval(() => {
      if (heroApi.canScrollNext()) {
        heroApi.scrollNext();
      } else {
        heroApi.scrollTo(0);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [heroApi]);

  return (
    <div>
      <section className="relative w-full">
        <Carousel setApi={setHeroApi} opts={{ align: "start" }} className="w-full">
          <CarouselContent className="-ml-0">
            {HERO_SLIDES.map((slide) => (
              <CarouselItem key={slide.title} className="pl-0">
                <article className="relative h-[calc(100svh-4rem)] w-full overflow-hidden bg-slate-900">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="h-full w-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-transparent" />
                  <div className="absolute inset-0 mx-auto flex h-full w-full max-w-6xl flex-col justify-end px-5 pb-10 sm:px-8 sm:pb-14">
                    <p className="mb-2 inline-flex w-fit rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                      Vista destacada
                    </p>
                    <h2 className="max-w-xl text-2xl font-bold leading-tight text-white sm:text-3xl">{slide.title}</h2>
                    <p className="mt-2 max-w-xl text-sm text-slate-100 sm:text-base">{slide.subtitle}</p>
                    <Link
                      to={slide.to}
                      className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                    >
                      {slide.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="absolute inset-x-0 bottom-5 z-20 flex items-center justify-center gap-2" aria-label="Indicador de carrusel">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={`dot-${slide.title}`}
              type="button"
              onClick={() => heroApi?.scrollTo(index)}
              className={`h-2.5 rounded-full transition-all ${
                heroIndex === index ? "w-8 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:pt-16">
        <motion.div initial="hidden" animate="visible" variants={variants}>
          <p className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Plataforma veterinaria integral
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
            Tu clinica con control total, sin friccion operativa.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            MiVetApp convierte tu operacion diaria en un sistema claro: agenda, pacientes, tratamientos,
            recepcion y experiencia del cliente conectados.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contacto"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              Solicitar demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/soluciones"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
            >
              Explorar soluciones
            </Link>
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          aria-label="Resumen de resultados"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Impacto promedio</p>
          <div className="mt-4 space-y-3">
            {STATS.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                <p className="text-sm text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.aside>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {BANNERS.map((banner) => (
            <article
              key={banner.title}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <img
                src={banner.image}
                alt={banner.title}
                className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-sm font-semibold text-white">{banner.title}</p>
                <p className="mt-1 text-xs text-slate-100">{banner.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={variants}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Todo lo que necesitas en una sola vista operativa</h2>
          <p className="mt-2 text-slate-600">
            Disenado para clinicas que necesitan crecer con orden, velocidad y trazabilidad.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {HIGHLIGHTS.map((item) => (
            <motion.article
              key={item.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={variants}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}
