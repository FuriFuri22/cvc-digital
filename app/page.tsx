
import Link from "next/link";

const services = [
  {
    name: "Internet",
    speed: "30 MEGAS",
    price: "$25.000",
    description: "Conectate y disfrutá de internet en tu hogar.",
    features: ["30 megas de velocidad", "Conexión para tu hogar"],
  },
  {
    name: "Internet + TV",
    speed: "30 MEGAS + HD",
    price: "$41.000",
    description: "Internet y entretenimiento en un solo servicio.",
    features: ["Internet de 30 megas", "Televisión HD"],
    featured: true,
  },
];

const payments = [
  "Débito automático",
  "Pago Fácil",
  "Pago Mis Cuentas",
  "Mercado Pago",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Navegación */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-orange-500 text-lg font-black text-slate-800">
              CVC
            </span>
            <span className="text-lg font-bold tracking-widest">
              DIGITAL
            </span>
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#servicios" className="hover:text-orange-600">Servicios</a>
            <a href="#cobertura" className="hover:text-orange-600">Cobertura</a>
            <a href="#pagos" className="hover:text-orange-600">Medios de pago</a>
          </div>

         <Link
            href="/solicitud"
            className="rounded-full bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
          >
            Solicitar servicio
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#f8f1f2]">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-orange-200/50 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-purple-200/50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:py-32">
          <div>
            <span className="inline-block rounded-full bg-orange-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-orange-700">
              CVC Digital · Formosa y Clorinda
            </span>

            <h1 className="mt-7 text-5xl font-black leading-tight tracking-tight md:text-6xl">
              Tu hogar,
              <span className="block text-orange-600"> conectado.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
              Disfrutá de internet y televisión HD con CVC Digital.
              Elegí el servicio que mejor se adapte a tu hogar.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="#servicios"
                className="rounded-full bg-orange-600 px-7 py-4 font-bold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
              >
                Ver servicios
              </a>
              <a
                href="#cobertura"
                className="rounded-full border border-slate-300 px-7 py-4 font-bold transition hover:bg-white"
              >
                Consultar cobertura
              </a>
            </div>
          </div>

          <div className="relative flex min-h-72 items-center justify-center">
            <div className="absolute h-72 w-72 rounded-full bg-orange-500/10 md:h-96 md:w-96" />
            <div className="relative rounded-[2rem] bg-gradient-to-br from-orange-500 to-orange-700 p-10 text-center text-white shadow-2xl md:p-14">
              <p className="text-sm font-bold tracking-[0.3em]">CVC DIGITAL</p>
              <div className="my-7 text-7xl">⌁</div>
              <p className="text-3xl font-black">100% DIGITAL</p>
              <p className="mt-2 text-white/80">Internet + Televisión HD</p>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 text-center">
          <p className="font-bold uppercase tracking-widest text-orange-600">
            Nuestros servicios
          </p>
          <h2 className="mt-3 text-4xl font-black">
            Elegí tu conexión ideal
          </h2>
          <p className="mt-4 text-slate-500">
            Encontrá la opción que mejor se adapte a vos.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.name}
              className={`relative rounded-3xl border p-8 transition hover:-translate-y-1 hover:shadow-xl ${
                service.featured
                  ? "border-orange-500 bg-[#fff8f5] shadow-lg"
                  : "border-slate-200 bg-white"
              }`}
            >
              {service.featured && (
                <span className="absolute -top-3 right-6 rounded-full bg-orange-600 px-4 py-1 text-xs font-bold text-white">
                  COMBO
                </span>
              )}

              <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
                {service.speed}
              </p>
              <h3 className="mt-4 text-2xl font-black">{service.name}</h3>
              <p className="mt-3 text-slate-500">{service.description}</p>

              <p className="mt-8 text-4xl font-black">{service.price}</p>

              <div className="my-7 border-t border-slate-200" />

              <ul className="space-y-3">
                {service.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-slate-600">
                    <span className="font-bold text-orange-600">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

             <Link
                href="/solicitud"
                className="mt-9 block rounded-full bg-orange-600 py-4 text-center font-bold text-white transition hover:bg-orange-700"
              >
                Me interesa
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Cobertura */}
      <section id="cobertura" className="bg-slate-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <p className="font-bold uppercase tracking-widest text-orange-400">
            Llegamos a tu hogar
          </p>
          <h2 className="mt-4 text-4xl font-black">
            ¿Dónde querés conectarte?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-slate-300">
            Brindamos servicios en Formosa y Clorinda.
            ¿Vivís en otra localidad? Consultanos, la cobertura
            fuera de estas ciudades es conversable.
          </p>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ["Formosa", "Consultar disponibilidad"],
              ["Clorinda", "Consultar disponibilidad"],
              ["Otras localidades", "Cobertura a consultar"],
            ].map(([city, description]) => (
              <div key={city} className="rounded-2xl border border-white/15 bg-white/5 p-7">
                <div className="mb-4 text-3xl">📍</div>
                <h3 className="text-xl font-bold">{city}</h3>
                <p className="mt-2 text-sm text-slate-400">{description}</p>
              </div>
            ))}
          </div>

          <Link
              href="/solicitud"
              className="mt-10 inline-block rounded-full bg-orange-600 px-8 py-4 font-bold text-white hover:bg-orange-700"
            >
              Consultar mi cobertura
            </Link>
        </div>
      </section>

      {/* Consulta */}
     <section id="consulta" className="px-6 py-24">
  <div className="mx-auto max-w-3xl rounded-3xl bg-[#f8f1f2] p-8 text-center md:p-14">
    <p className="font-bold uppercase tracking-widest text-orange-600">
      Estamos para ayudarte
    </p>

    <h2 className="mt-4 text-3xl font-black md:text-4xl">
      ¿Querés contratar CVC Digital?
    </h2>

    <p className="mt-5 leading-relaxed text-slate-600">
      Completá nuestro formulario con tus datos y el servicio
      que te interesa. Nos comunicaremos con vos para continuar
      con la solicitud.
    </p>

    <Link
      href="/solicitud"
      className="mt-8 inline-block rounded-full bg-orange-600 px-8 py-4 font-bold text-white transition hover:bg-orange-700"
    >
      Completar solicitud
    </Link>
  </div>
</section>

      {/* Pagos */}
      <section id="pagos" className="border-t border-slate-100 px-6 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-black">Aboná tus servicios</h2>
          <p className="mt-3 text-slate-500">
            Conocé las alternativas disponibles para pagar tu servicio.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {payments.map((payment) => (
              <div key={payment} className="rounded-2xl border border-slate-200 p-6 font-bold">
                {payment}
              </div>
            ))}
          </div>

          <a
            href="https://pagos.cvcformosa.com.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-block font-bold text-orange-600 hover:underline"
          >
            Ir a la página de pagos →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <p className="text-xl font-black tracking-widest">CVC DIGITAL</p>
            <p className="mt-2 text-sm text-slate-400">
              Televisión HD e Internet
            </p>
          </div>
          <p className="text-sm text-slate-400">
            Formosa · Clorinda
          </p>
          <p className="text-xs text-slate-500">
           © 2026 CVC Digital
          </p>
        </div>
      </footer>
    </main>
  );
}
