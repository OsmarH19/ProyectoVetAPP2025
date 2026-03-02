import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, ClipboardList, Stethoscope, UserRoundCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useSiteSeo } from "./siteSeo";

const MODULES = [
  {
    icon: CalendarClock,
    title: "Gestion de citas",
    description: "Agenda por bloques, control de conflictos y estados de atencion en tiempo real.",
  },
  {
    icon: ClipboardList,
    title: "Gestion de servicios",
    description: "Catalogo de servicios, duracion, precios y reglas operativas desde un solo panel.",
  },
  {
    icon: Stethoscope,
    title: "Tratamientos e historial",
    description: "Diagnostico, recomendaciones, medicamentos y evidencia clinica organizada por mascota.",
  },
  {
    icon: UserRoundCheck,
    title: "Portal cliente",
    description: "Tus clientes consultan sus mascotas, citas y tratamientos sin friccion.",
  },
];

const FLOW = [
  "Recepcion agenda con disponibilidad real.",
  "Veterinario registra consulta y tratamiento.",
  "Cliente visualiza su historial y proxima cita.",
  "Administracion monitorea indicadores del dia.",
];

const GALLERY = [
  {
    title: "Panel de agenda",
    description: "Visualiza el dia completo y detecta huecos operativos.",
    image: "/img/login.jpg",
  },
  {
    title: "Control de pacientes",
    description: "Informacion de mascota y tutor en una sola vista.",
    image: "/img/login.jpg",
  },
  {
    title: "Seguimiento clinico",
    description: "Tratamientos y recomendaciones con trazabilidad real.",
    image: "/img/login.jpg",
  },
];

export default function SolutionsPage() {
  useSiteSeo(
    "Soluciones MiVetApp | Modulos clinicos conectados",
    "Conoce los modulos de agenda, servicios, tratamientos y portal cliente de MiVetApp.",
    {
      path: "/soluciones",
      image: "/img/login.jpg",
      keywords: [
        "modulos veterinarios",
        "agenda veterinaria",
        "portal cliente veterinaria",
        "tratamientos veterinarios",
      ],
    }
  );

  const [galleryApi, setGalleryApi] = useState(null);

  useEffect(() => {
    if (!galleryApi) return undefined;
    const id = setInterval(() => {
      if (galleryApi.canScrollNext()) {
        galleryApi.scrollNext();
      } else {
        galleryApi.scrollTo(0);
      }
    }, 5200);
    return () => clearInterval(id);
  }, [galleryApi]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Soluciones</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Vistas disenadas para cada rol de tu clinica</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          No es una sola pantalla con datos sueltos. Es un flujo completo desde recepcion hasta seguimiento clinico.
        </p>
      </motion.div>

      <section className="mt-8">
        <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
          <img src="/img/login.jpg" alt="Banner de soluciones VetApp" className="h-52 w-full object-cover opacity-65 sm:h-64" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 to-slate-900/35" />
          <div className="absolute inset-0 flex items-end p-5 sm:p-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Banner de soluciones</p>
              <p className="mt-1 max-w-xl text-lg font-semibold text-white sm:text-xl">
                Modulos conectados para recepcion, consulta, tratamientos y comunicacion con clientes.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Modulos del sistema">
        {MODULES.map((module) => (
          <motion.article
            key={module.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <span className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
              <module.icon className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold text-slate-900">{module.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{module.description}</p>
          </motion.article>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">Flujo operativo recomendado</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {FLOW.map((step, idx) => (
            <li key={step} className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Paso {idx + 1}</p>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 rounded-2xl bg-primary p-5 text-white sm:p-6">
        <h2 className="text-xl font-semibold">Quieres ver estas vistas con tu propio flujo?</h2>
        <p className="mt-2 text-sm text-primary-foreground/90">
          Te mostramos una demo guiada usando escenarios reales de una clinica veterinaria.
        </p>
        <Link
          to="/contacto"
          className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:bg-slate-100"
        >
          Agendar demo de soluciones
        </Link>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">Carrusel de vistas destacadas</h2>
        <p className="mt-1 text-sm text-slate-600">Una muestra visual del tipo de interfaz que tendra tu equipo.</p>
        <div className="mt-4">
          <Carousel setApi={setGalleryApi} opts={{ align: "start" }} className="w-full">
            <CarouselContent>
              {GALLERY.map((item) => (
                <CarouselItem key={item.title} className="md:basis-1/2">
                  <article className="overflow-hidden rounded-xl border border-slate-200">
                    <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
                    <div className="p-4">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{item.description}</p>
                    </div>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>
    </div>
  );
}
