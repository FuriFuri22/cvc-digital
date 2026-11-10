
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "documentos-clientes";

const DOCUMENTOS = [
  "dni_frente",
  "dni_dorso",
  "comprobante_domicilio",
  "selfie_dni",
] as const;

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(request: Request) {
  try {
    const cuerpo: unknown = await request.json();

    if (
      typeof cuerpo !== "object" ||
      cuerpo === null ||
      !("documentos" in cuerpo) ||
      !Array.isArray(cuerpo.documentos) ||
      cuerpo.documentos.length !== DOCUMENTOS.length
    ) {
      return NextResponse.json(
        { error: "La documentación enviada no es válida." },
        { status: 400 }
      );
    }

    const documentos = cuerpo.documentos;

    const nombres = documentos.map((doc) => {
      if (
        typeof doc !== "object" ||
        doc === null ||
        !("nombre" in doc) ||
        !("tipo" in doc) ||
        typeof doc.nombre !== "string" ||
        typeof doc.tipo !== "string"
      ) {
        throw new Error("Hay un documento inválido.");
      }

      if (
        !DOCUMENTOS.includes(
          doc.nombre as (typeof DOCUMENTOS)[number]
        ) ||
        !TIPOS_PERMITIDOS.includes(doc.tipo)
      ) {
        throw new Error("El tipo de documento no está permitido.");
      }

      return doc.nombre;
    });

    if (
      new Set(nombres).size !== DOCUMENTOS.length ||
      !DOCUMENTOS.every((nombre) => nombres.includes(nombre))
    ) {
      return NextResponse.json(
        { error: "Faltan documentos o hay documentos duplicados." },
        { status: 400 }
      );
    }

    const solicitudId = crypto.randomUUID();
    const cargas = [];

    for (const documento of documentos) {
      const extension =
        documento.tipo === "image/png"
          ? "png"
          : documento.tipo === "image/webp"
            ? "webp"
            : "jpg";

      const path = `${solicitudId}/${documento.nombre}.${extension}`;

      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUploadUrl(path);

      if (error || !data) {
        console.error("Error al preparar la carga:", error);

        throw new Error(
          "No se pudo preparar la carga de los documentos."
        );
      }

      cargas.push({
        nombre: documento.nombre,
        path,
        token: data.token,
      });
    }

    return NextResponse.json({
      solicitudId,
      documentos: cargas,
    });
  } catch (error) {
    console.error("Error al preparar solicitud:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo preparar la solicitud.",
      },
      { status: 400 }
    );
  }
}