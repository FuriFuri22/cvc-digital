
"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const condiciones = `Por la presente, el que suscribe, en adelante, el CLIENTE arriba mencionado, solicita a C & R S.R.L. la instalación domiciliaria y posterior servicio de televisión y audio por cable en los modos y formas obrantes en el F01, expuesto en el anverso del presente, que declara conocer y del cual recibe copia fiel.

El CLIENTE se compromete a pagar el importe mensual pactado al momento de la suscripción del presente, en concepto de ABONO DE CABLE Y/O USO DE LA LÍNEA para la prestación del servicio de internet por parte de nuestras empresas co-contratantes, por adelantado (del 01 al 10 de cada mes), correspondiente a la tarifa vigente o al precio promocional pactado al momento de la suscripción del presente.

A partir de la fecha efectiva de instalación del servicio en el domicilio del CLIENTE, C & R S.R.L. se reserva el derecho de modificar dicho precio previa notificación fehaciente al abonado mediante el anuncio por el canal propio y/o cualquier otro medio que considere efectivo a los efectos de advertir al cliente y con el plazo suficiente para que este pueda hacer ejercicio de su derecho a rescindir el presente contrato y de conceder bonificaciones especiales por el plazo que se estipule para cada evento promocional.

La conexión se realizará en un plazo aproximado de 10 a 20 días hábiles. La rescisión del servicio podrá solicitarse una vez transcurridos 6 meses. El costo de instalación no tiene devolución ni reembolso.`;

export default function SolicitudPage() {
  const [tipoCliente, setTipoCliente] = useState("nuevo");
  const [servicio, setServicio] = useState("cvc_basico");
  const [poseeLinea, setPoseeLinea] = useState("false");
  const [acepta, setAcepta] = useState(false);
  const [archivos, setArchivos] = useState<Record<string, File | null>>({
    dni_frente: null,
    dni_dorso: null,
    comprobante_domicilio: null,
    selfie_dni: null,
  });
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

 function seleccionarArchivo(nombre: string, archivo: File | null) {
  if (archivo) {
    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

    if (!tiposPermitidos.includes(archivo.type)) {
      setMensaje("El archivo debe ser JPG, PNG o WEBP.");
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setMensaje("Cada imagen puede pesar como máximo 5 MB.");
      return;
    }
  }

  setMensaje("");

  setArchivos((actuales) => ({
    ...actuales,
    [nombre]: archivo,
  }));
}

  

  
async function enviarSolicitud(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setMensaje("");

  if (!acepta) {
    setMensaje("Debés aceptar las condiciones.");
    return;
  }

  if (Object.values(archivos).some((archivo) => !archivo)) {
    setMensaje("Debés adjuntar los cuatro documentos.");
    return;
  }

  const formulario = e.currentTarget;
  const formData = new FormData(formulario);

  setEnviando(true);

  try {
    // 1. Solicitar las URLs firmadas para subir los documentos.
    const documentosParaPreparar = Object.entries(archivos).map(
      ([nombre, archivo]) => {
        if (!archivo) {
          throw new Error("Falta adjuntar un documento.");
        }

        return {
          nombre,
          tipo: archivo.type,
        };
      }
    );

    const respuestaPreparar = await fetch("/api/solicitudes/preparar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentos: documentosParaPreparar,
      }),
    });

    const resultadoPreparar = await respuestaPreparar.json();

    if (!respuestaPreparar.ok) {
      throw new Error(
        resultadoPreparar.error || "No se pudo preparar la documentación."
      );
    }

    // 2. Subir cada imagen directamente a Supabase.
    const documentosSubidos = [];

    for (const documento of resultadoPreparar.documentos) {
      const archivo = archivos[documento.nombre];

      if (!archivo) {
        throw new Error("No se encontró uno de los documentos.");
      }

      const { error } = await supabase.storage
        .from("documentos-clientes")
        .uploadToSignedUrl(
          documento.path,
          documento.token,
          archivo,
          {
            contentType: archivo.type,
            upsert: false,
          }
        );

      if (error) {
        console.error("Error al subir documento:", error);
        throw new Error(
          `No se pudo subir el documento: ${documento.nombre}.`
        );
      }

      documentosSubidos.push({
        nombre: documento.nombre,
        path: documento.path,
      });
    }

    // 3. Preparar los datos del formulario.
    const datos = Object.fromEntries(
      [...formData.entries()].filter(
        ([, valor]) => typeof valor === "string"
      )
    );

    // 4. Registrar la solicitud y sus rutas en la base de datos.
    const respuesta = await fetch("/api/solicitudes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        solicitudId: resultadoPreparar.solicitudId,
        datos: {
          ...datos,
          tipo_cliente: tipoCliente,
          servicio,
          posee_linea_fija: poseeLinea,
          acepta_condiciones: String(acepta),
        },
        documentos: documentosSubidos,
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.error || "No se pudo enviar la solicitud."
      );
    }

    // 5. Limpiar el formulario.
    formulario.reset();
    setTipoCliente("nuevo");
    setServicio("cvc_basico");
    setPoseeLinea("false");
    setAcepta(false);

    setArchivos({
      dni_frente: null,
      dni_dorso: null,
      comprobante_domicilio: null,
      selfie_dni: null,
    });

   setSolicitudEnviada(true);
  } catch (error) {
    console.error("Error al enviar solicitud:", error);

    setMensaje(
      error instanceof Error
        ? error.message
        : "Ocurrió un error al enviar."
    );
  } finally {
    setEnviando(false);
  }
}


  const camposArchivo = [
    { id: "dni_frente", label: "DNI frente" },
    { id: "dni_dorso", label: "DNI dorso" },
    { id: "comprobante_domicilio", label: "Factura de servicio o constancia de domicilio" },
    { id: "selfie_dni", label: "Selfie sosteniendo el DNI" },
  ];
    if (solicitudEnviada) {
    const mensajeWhatsApp = encodeURIComponent(
      "Hola, acabo de enviar una solicitud de servicio desde la página de CVC Digital. Quisiera consultar sobre el seguimiento de mi trámite."
    );

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl sm:p-10">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-14 w-14 text-green-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 12 4 4L19 6"
              />
            </svg>
          </div>

          <p className="mt-6 font-bold tracking-widest text-orange-600">
            CVC DIGITAL
          </p>

          <h1 className="mt-3 text-3xl font-black text-slate-900">
            ¡Solicitud enviada!
          </h1>

          <p className="mt-4 leading-relaxed text-slate-600">
            Recibimos correctamente tus datos y documentación. Nuestro equipo
            revisará tu solicitud y se pondrá en contacto con vos.
          </p>

          <a
            href={`https://wa.me/5493704076291?text=${mensajeWhatsApp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-[#25D366] px-5 py-4 font-bold text-white transition hover:bg-[#1ebe5d]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.52 0 .18 5.34.18 11.9c0 2.1.55 4.15 1.6 5.96L.08 24l6.3-1.65a11.9 11.9 0 0 0 5.7 1.45h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.47-8.42ZM12.09 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98 1-3.65-.23-.37a9.86 9.86 0 0 1-1.52-5.27c0-5.46 4.45-9.9 9.9-9.9a9.83 9.83 0 0 1 7.01 2.9 9.84 9.84 0 0 1 2.9 7.02c0 5.46-4.44 9.9-9.91 9.9Zm5.43-7.42c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.88-.78-1.48-1.74-1.65-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.53.07-.81.38-.28.3-1.06 1.03-1.06 2.5s1.09 2.9 1.24 3.1c.15.2 2.15 3.28 5.2 4.6.73.32 1.3.51 1.74.65.73.23 1.4.2 1.93.12.59-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.12-.28-.2-.58-.35Z" />
            </svg>
            Continuar por WhatsApp
          </a>

          <p className="mt-4 text-xs text-slate-500">
            Se abrirá WhatsApp con un mensaje preparado. Podrás revisarlo y
            enviarlo.
          </p>

          <a
            href="/"
            className="mt-6 inline-block font-semibold text-orange-600 hover:text-orange-700"
          >
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="font-bold text-orange-600">
          ← Volver a CVC Digital
        </a>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-10">
          <p className="font-bold text-orange-600">CVC DIGITAL</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Solicitud de conexión
          </h1>
          <p className="mt-2 text-slate-500">
            Completá tus datos para solicitar nuestros servicios.
          </p>

          <form onSubmit={enviarSolicitud} className="mt-8 space-y-10">
            <section className="space-y-5">
              <h2 className="border-b pb-3 text-xl font-bold">A. Datos del cliente</h2>

              <div>
                <label className="mb-2 block font-semibold">Tipo de cliente</label>
                <select
                  value={tipoCliente}
                  onChange={(e) => setTipoCliente(e.target.value)}
                  className="w-full rounded-xl border p-3"
                >
                  <option value="nuevo">Nuevo</option>
                  <option value="existente">Existente</option>
                </select>
              </div>

              {tipoCliente === "existente" && (
                <Field name="numero_cliente" label="Número de cliente" required />
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="apellido" label="Apellido" required />
                <Field name="nombre" label="Nombre" required />
              </div>

              <Field name="razon_social" label="Razón social (opcional)" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-semibold">Tipo de documento</label>
                  <select name="tipo_documento" className="w-full rounded-xl border p-3">
                    <option value="DNI">DNI</option>
                    <option value="CUIT">CUIT</option>
                    <option value="CUIL">CUIL</option>
                  </select>
                </div>
                <Field name="numero_documento" label="Número de documento" required />
              </div>

              <Field name="fecha_nacimiento" label="Fecha de nacimiento" type="date" required />
              <Field name="email" label="Correo electrónico" type="email" />
            </section>

            <section className="space-y-5">
              <h2 className="border-b pb-3 text-xl font-bold">B. Domicilio de instalación</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="calle" label="Calle" required />
                <Field name="numero_domicilio" label="Número" required />
                <Field name="barrio" label="Barrio" required />
                <Field name="localidad" label="Localidad" required />
                <Field name="provincia" label="Provincia" required />
                <Field name="codigo_postal" label="Código postal" required />
              </div>

              <div>
                <label className="mb-2 block font-semibold">¿Poseés línea fija?</label>
                <select
                  value={poseeLinea}
                  onChange={(e) => setPoseeLinea(e.target.value)}
                  className="w-full rounded-xl border p-3"
                >
                  <option value="false">No</option>
                  <option value="true">Sí</option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="telefono" label="Teléfono principal" type="tel" required />
                <Field name="telefono_alternativo" label="Teléfono alternativo" type="tel" />
              </div>

              <Field name="observaciones" label="Observaciones" />
            </section>

            <section className="space-y-5">
              <h2 className="border-b pb-3 text-xl font-bold">C. Servicios solicitados</h2>

              <div>
                <label className="mb-2 block font-semibold">Servicio</label>
                <select
                  value={servicio}
                  onChange={(e) => setServicio(e.target.value)}
                  className="w-full rounded-xl border p-3"
                >
                  <option value="cvc_basico">CVC Básico</option>
                  <option value="internet_30">Internet 30 megas</option>
                  <option value="ambos">CVC Básico + Internet 30 megas</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold">Tipo de inmueble</label>
                <select name="tipo_inmueble" required className="w-full rounded-xl border p-3">
                  <option value="casa">Casa</option>
                  <option value="departamento">Departamento</option>
                  <option value="comercio">Comercio</option>
                </select>
              </div>
            </section>

            <section className="space-y-5">
              <h2 className="border-b pb-3 text-xl font-bold">D. Condiciones del servicio</h2>

              <div className="max-h-72 overflow-y-auto rounded-xl border bg-slate-50 p-4 text-sm leading-relaxed whitespace-pre-line text-slate-700">
                {condiciones}
              </div>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={acepta}
                  onChange={(e) => setAcepta(e.target.checked)}
                  className="mt-1 h-5 w-5 accent-orange-600"
                />
                <span className="text-sm">
                  He leído y acepto las condiciones del servicio.
                </span>
              </label>
            </section>

            <section className="space-y-5">
              <h2 className="border-b pb-3 text-xl font-bold">E. Documentación</h2>
              <p className="text-sm text-slate-500">
                Adjuntá imágenes claras. Formatos permitidos: JPG, PNG o WEBP. Máximo 5 MB cada una.
              </p>

              {camposArchivo.map((campo) => (
                <div key={campo.id}>
                  <label className="mb-2 block font-semibold">{campo.label}</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    onChange={(e) =>
                      seleccionarArchivo(campo.id, e.target.files?.[0] ?? null)
                    }
                    className="w-full rounded-xl border p-3 text-sm"
                  />
                </div>
              ))}
            </section>

            {mensaje && (
              <p role="status" className="rounded-xl bg-orange-50 p-4 text-sm text-orange-800">
                {mensaje}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-xl bg-orange-600 py-4 font-bold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {enviando ? "Enviando solicitud..." : "Enviar solicitud"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block font-semibold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full rounded-xl border p-3 outline-none focus:border-orange-500"
      />
    </div>
  );
}
