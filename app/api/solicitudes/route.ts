
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "documentos-clientes";

const DOCUMENTOS = [
  "dni_frente",
  "dni_dorso",
  "comprobante_domicilio",
  "selfie_dni",
] as const;

const CAMPOS = [
  "tipo_cliente",
  "numero_cliente",
  "nombre",
  "apellido",
  "razon_social",
  "tipo_documento",
  "numero_documento",
  "fecha_nacimiento",
  "email",
  "calle",
  "numero_domicilio",
  "barrio",
  "localidad",
  "provincia",
  "codigo_postal",
  "posee_linea_fija",
  "telefono",
  "telefono_alternativo",
  "servicio",
  "tipo_inmueble",
  "observaciones",
] as const;

type Documento = {
  nombre: string;
  path: string;
};

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

export async function POST(request: Request) {
  const archivosSubidos: string[] = [];

  try {
    const cuerpo: unknown = await request.json();

    if (
      !esObjeto(cuerpo) ||
      !esObjeto(cuerpo.datos) ||
      !Array.isArray(cuerpo.documentos)
    ) {
      return NextResponse.json(
        { error: "El formato de la solicitud no es válido." },
        { status: 400 }
      );
    }

    const solicitudId =
      typeof cuerpo.solicitudId === "string" ? cuerpo.solicitudId : "";

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        solicitudId
      )
    ) {
      return NextResponse.json(
        { error: "El identificador de solicitud no es válido." },
        { status: 400 }
      );
    }

    const datos: Record<string, string> = {};

    for (const campo of CAMPOS) {
      const valor = cuerpo.datos[campo];

      if (valor !== undefined && typeof valor !== "string") {
        return NextResponse.json(
          { error: `El campo ${campo} no es válido.` },
          { status: 400 }
        );
      }

      datos[campo] = (valor ?? "").trim();
    }

    const obligatorios = [
      "tipo_cliente",
      "nombre",
      "apellido",
      "tipo_documento",
      "numero_documento",
      "fecha_nacimiento",
      "calle",
      "numero_domicilio",
      "barrio",
      "localidad",
      "provincia",
      "codigo_postal",
      "telefono",
      "servicio",
      "tipo_inmueble",
    ];

    for (const campo of obligatorios) {
      if (!datos[campo]) {
        return NextResponse.json(
          { error: `Falta completar: ${campo}` },
          { status: 400 }
        );
      }
    }

    if (!["nuevo", "existente"].includes(datos.tipo_cliente)) {
      return NextResponse.json(
        { error: "Tipo de cliente inválido." },
        { status: 400 }
      );
    }

    if (datos.tipo_cliente === "existente" && !datos.numero_cliente) {
      return NextResponse.json(
        { error: "Falta el número de cliente." },
        { status: 400 }
      );
    }

    if (!["cvc_basico", "internet_30", "ambos"].includes(datos.servicio)) {
      return NextResponse.json(
        { error: "Servicio inválido." },
        { status: 400 }
      );
    }

    if (!["casa", "departamento", "comercio"].includes(datos.tipo_inmueble)) {
      return NextResponse.json(
        { error: "Tipo de inmueble inválido." },
        { status: 400 }
      );
    }

    if (!["DNI", "CUIT", "CUIL"].includes(datos.tipo_documento)) {
      return NextResponse.json(
        { error: "Tipo de documento inválido." },
        { status: 400 }
      );
    }

    if (!["true", "false"].includes(datos.posee_linea_fija)) {
      return NextResponse.json(
        { error: "Indicá si poseés línea fija." },
        { status: 400 }
      );
    }

    if (datos.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
      return NextResponse.json(
        { error: "El correo electrónico no es válido." },
        { status: 400 }
      );
    }

    const fecha = new Date(`${datos.fecha_nacimiento}T00:00:00`);

    if (
      Number.isNaN(fecha.getTime()) ||
      fecha.toISOString().slice(0, 10) !== datos.fecha_nacimiento ||
      fecha > new Date()
    ) {
      return NextResponse.json(
        { error: "La fecha de nacimiento no es válida." },
        { status: 400 }
      );
    }

    if (cuerpo.datos.acepta_condiciones !== "true") {
      return NextResponse.json(
        { error: "Debés aceptar las condiciones del servicio." },
        { status: 400 }
      );
    }

    if (cuerpo.documentos.length !== DOCUMENTOS.length) {
      return NextResponse.json(
        { error: "Debés adjuntar los cuatro documentos." },
        { status: 400 }
      );
    }

    const documentosPorNombre = new Map<string, Documento>();

    for (const elemento of cuerpo.documentos) {
      if (
        !esObjeto(elemento) ||
        typeof elemento.nombre !== "string" ||
        typeof elemento.path !== "string" ||
        !DOCUMENTOS.includes(elemento.nombre as (typeof DOCUMENTOS)[number]) ||
        documentosPorNombre.has(elemento.nombre)
      ) {
        return NextResponse.json(
          { error: "Los documentos enviados no son válidos." },
          { status: 400 }
        );
      }

      const extension = elemento.path.split(".").pop();

      if (!["jpg", "png", "webp"].includes(extension ?? "")) {
        return NextResponse.json(
          { error: "La extensión de un documento no es válida." },
          { status: 400 }
        );
      }

      const rutaEsperada = `${solicitudId}/${elemento.nombre}.${extension}`;

      if (elemento.path !== rutaEsperada) {
        return NextResponse.json(
          { error: "La ruta de un documento no es válida." },
          { status: 400 }
        );
      }

      documentosPorNombre.set(elemento.nombre, {
        nombre: elemento.nombre,
        path: elemento.path,
      });

      archivosSubidos.push(elemento.path);
    }

    if (
      documentosPorNombre.size !== DOCUMENTOS.length ||
      !DOCUMENTOS.every((nombre) => documentosPorNombre.has(nombre))
    ) {
      return NextResponse.json(
        { error: "Debés adjuntar los cuatro documentos." },
        { status: 400 }
      );
    }

    const { data: archivosGuardados, error: errorArchivos } =
      await supabaseAdmin.storage
        .from(BUCKET)
        .list(solicitudId);

    if (errorArchivos) {
      throw new Error("No se pudo verificar la documentación.");
    }

    for (const documento of documentosPorNombre.values()) {
      const nombreArchivo = documento.path.split("/").pop();

      const existe = archivosGuardados?.some(
        (archivo) => archivo.name === nombreArchivo
      );

      if (!existe) {
        throw new Error(
          `No se encontró el documento ${documento.nombre}.`
        );
      }
    }

    const rutas: Record<string, string> = {};

    for (const documento of documentosPorNombre.values()) {
      rutas[documento.nombre] = documento.path;
    }

    const { data, error } = await supabaseAdmin
      .from("solicitudes")
      .insert({
        id: solicitudId,
        tipo_cliente: datos.tipo_cliente,
        numero_cliente: datos.numero_cliente || null,
        nombre: datos.nombre,
        apellido: datos.apellido,
        razon_social: datos.razon_social || null,
        tipo_documento: datos.tipo_documento,
        numero_documento: datos.numero_documento,
        fecha_nacimiento: datos.fecha_nacimiento,
        email: datos.email || null,
        calle: datos.calle,
        numero_domicilio: datos.numero_domicilio,
        barrio: datos.barrio,
        localidad: datos.localidad,
        provincia: datos.provincia,
        codigo_postal: datos.codigo_postal,
        posee_linea_fija: datos.posee_linea_fija === "true",
        telefono: datos.telefono,
        telefono_alternativo: datos.telefono_alternativo || null,
        servicio: datos.servicio,
        tipo_inmueble: datos.tipo_inmueble,
        observaciones: datos.observaciones || null,
        ...rutas,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error al insertar solicitud:", error);
      throw new Error("No se pudo registrar la solicitud.");
    }

    return NextResponse.json(
      {
        mensaje: "Solicitud recibida correctamente.",
        id: data.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al recibir solicitud:", error);

    if (archivosSubidos.length > 0) {
      const { error: errorLimpieza } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove(archivosSubidos);

      if (errorLimpieza) {
        console.error(
          "No se pudieron eliminar los archivos temporales:",
          errorLimpieza
        );
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo procesar la solicitud.",
      },
      { status: 500 }
    );
  }
}
