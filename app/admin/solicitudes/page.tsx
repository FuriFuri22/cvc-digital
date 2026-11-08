
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Solicitud = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  localidad: string;
  barrio: string | null;
  servicio: string;
  estado: "pendiente" | "contactado" | "aprobado" | "rechazado";
  created_at: string;
  email: string | null;
 observaciones: string | null;
 dni_frente: string | null;
 dni_dorso: string | null;
 comprobante_domicilio: string | null;
 selfie_dni: string | null;
};

async function obtenerImagen(path: string | null): Promise<string | null> {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from("documentos-clientes")
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) return null;

  const response = await fetch(data.signedUrl);
  if (!response.ok) return null;

  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = canvas.getContext("2d");
  if (!context) return null;

  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function SolicitudesPage() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [permisoNotificaciones, setPermisoNotificaciones] = useState<NotificationPermission>("default");
const [nuevasSolicitudes, setNuevasSolicitudes] = useState(0);

  useEffect(() => {
    async function cargarSolicitudes() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin");
        return;
      }

      const { data: admin } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!admin) {
        await supabase.auth.signOut();
        router.replace("/admin");
        return;
      }

      const { data, error } = await supabase
        .from("solicitudes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setError("No se pudieron cargar las solicitudes.");
      } else {
        setSolicitudes(data ?? []);
      }

      setLoading(false);
    }

    cargarSolicitudes();
  }, [router]);

  useEffect(() => {
  if (typeof window === "undefined") return;

  setPermisoNotificaciones(Notification.permission);

  const canal = supabase
    .channel("nuevas-solicitudes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "solicitudes",
      },
      (payload) => {
        const nueva = payload.new as Solicitud;

        setSolicitudes((actuales) => [
          nueva,
          ...actuales.filter((s) => s.id !== nueva.id),
        ]);

        setNuevasSolicitudes((cantidad) => cantidad + 1);

        if (Notification.permission === "granted") {
          new Notification("CVC Digital: nueva solicitud", {
            body: `${nueva.nombre} ${nueva.apellido} solicitó ${nueva.servicio}.`,
            icon: "/favicon.ico",
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}, []);

  async function cambiarEstado(
    id: string,
    estado: Solicitud["estado"]
  ) {
    const { error } = await supabase
      .from("solicitudes")
      .update({ estado })
      .eq("id", id);

    if (error) {
      alert("No se pudo actualizar el estado.");
      return;
    }

    setSolicitudes((actuales) =>
      actuales.map((solicitud) =>
        solicitud.id === id
          ? { ...solicitud, estado }
          : solicitud
      )
    );
  }
  async function activarNotificaciones() {
  if (!("Notification" in window)) {
    alert("Tu navegador no admite notificaciones.");
    return;
  }

  const permiso = await Notification.requestPermission();
  setPermisoNotificaciones(permiso);

  if (permiso === "granted") {
    new Notification("CVC Digital", {
      body: "Las notificaciones están activadas.",
    });
  }
}

async function descargarPDF(solicitud: Solicitud) {
  try {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();

    pdf.setFontSize(20);
    pdf.text("CVC DIGITAL", 15, 20);

    pdf.setFontSize(15);
    pdf.text("Ficha de solicitud", 15, 32);

    pdf.setFontSize(11);

    const datos = [
      `Fecha: ${new Date(solicitud.created_at).toLocaleString("es-AR")}`,
      `Nombre: ${solicitud.nombre} ${solicitud.apellido}`,
      `Telefono: ${solicitud.telefono}`,
      `Email: ${solicitud.email || "No informado"}`,
      `Localidad: ${solicitud.localidad}`,
      `Barrio: ${solicitud.barrio || "No informado"}`,
      `Servicio: ${solicitud.servicio}`,
      `Estado: ${solicitud.estado}`,
      `Observaciones: ${solicitud.observaciones || "Ninguna"}`,
    ];

    let y = 45;

    for (const linea of datos) {
      const lineas = pdf.splitTextToSize(linea, 175);
      pdf.text(lineas, 15, y);
      y += lineas.length * 6 + 2;
    }

    pdf.setFontSize(14);
    pdf.text("Documentacion del cliente", 15, y + 5);

    const documentos = [
      { nombre: "DNI frente", path: solicitud.dni_frente },
      { nombre: "DNI dorso", path: solicitud.dni_dorso },
      {
        nombre: "Comprobante de domicilio",
        path: solicitud.comprobante_domicilio,
      },
      { nombre: "Selfie con DNI", path: solicitud.selfie_dni },
    ];

    const imagenes = await Promise.all(
      documentos.map(async (documento) => ({
        nombre: documento.nombre,
        imagen: await obtenerImagen(documento.path),
      }))
    );

    pdf.addPage();

    pdf.setFontSize(14);
    pdf.text("Documentacion del cliente", 15, 20);

    const posiciones = [
      { x: 15, y: 30 },
      { x: 110, y: 30 },
      { x: 15, y: 155 },
      { x: 110, y: 155 },
    ];

    for (let i = 0; i < imagenes.length; i++) {
      const documento = imagenes[i];
      const posicion = posiciones[i];

      pdf.setFontSize(10);
      pdf.text(documento.nombre, posicion.x, posicion.y);

      if (documento.imagen) {
        pdf.addImage(
          documento.imagen,
          "JPEG",
          posicion.x,
          posicion.y + 5,
          85,
          100,
          undefined,
          "FAST"
        );
      } else {
        pdf.setTextColor(180, 0, 0);
        pdf.text("Imagen no disponible", posicion.x, posicion.y + 15);
        pdf.setTextColor(0, 0, 0);
      }
    }

    pdf.save(`solicitud-${solicitud.id}.pdf`);
  } catch (error) {
    console.error(error);
    alert("No se pudo generar el PDF. Revisá que los documentos estén disponibles.");
  }
}

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 px-6 py-5 text-white">
        <div>
          <p className="text-sm font-bold text-orange-400">CVC DIGITAL</p>
          <h1 className="text-xl font-bold">Panel administrativo</h1>
        </div>

        <button
  onClick={activarNotificaciones}
  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
>
  {permisoNotificaciones === "granted"
    ? "Notificaciones activadas"
    : "Activar notificaciones"}
</button>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace("/admin");
          }}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
        >
          Cerrar sesión
        </button>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-2xl font-black text-slate-900">
          Solicitudes recibidas
        </h2>
        <p className="mt-2 text-slate-500">
          Administrá las consultas de nuevos clientes.
        </p>

        {loading ? (
          <p className="mt-8 text-slate-500">Cargando solicitudes...</p>
        ) : error ? (
          <p className="mt-8 text-red-600">{error}</p>
        ) : solicitudes.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="font-semibold text-slate-700">
              Todavía no hay solicitudes.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Cuando un cliente envíe el formulario, aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Teléfono</th>
                  <th className="p-4">Localidad</th>
                  <th className="p-4">Servicio</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Documento</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.id} className="border-t border-slate-100">
                    <td className="p-4 font-semibold text-slate-800">
                      {solicitud.nombre} {solicitud.apellido}
                    </td>
                    <td className="p-4">{solicitud.telefono}</td>
                    <td className="p-4">
                      {solicitud.localidad}
                      {solicitud.barrio ? `, ${solicitud.barrio}` : ""}
                    </td>
                    <td className="p-4">{solicitud.servicio}</td>
                    <td className="p-4">
                      <select
                        value={solicitud.estado}
                        onChange={(e) =>
                          cambiarEstado(
                            solicitud.id,
                            e.target.value as Solicitud["estado"]
                          )
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="contactado">Contactado</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="rechazado">Rechazado</option>
                      </select>
                    </td>
                    <td className="p-4">
                      {new Date(solicitud.created_at).toLocaleDateString("es-AR")}
                    </td>
                    <td className="p-4">
  <button
    onClick={() => descargarPDF(solicitud)}
    className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
  >
    Descargar PDF
  </button>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
