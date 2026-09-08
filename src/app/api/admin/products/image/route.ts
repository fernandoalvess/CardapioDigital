import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { exceedsContentLength, isSameOriginRequest } from "@/lib/security";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxSize = 5 * 1024 * 1024;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Requisição não permitida." }, { status: 403 });
  }

  const context = await getAdminContext();
  if (!context) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  if (!process.env.SUPABASE_SECRET_KEY) {
    return NextResponse.json({ error: "Upload temporariamente indisponível." }, { status: 503 });
  }

  if (exceedsContentLength(request, maxSize + 512 * 1024)) {
    return NextResponse.json({ error: "A imagem deve ter no máximo 5 MB." }, { status: 413 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecione uma imagem." }, { status: 400 });
  }
  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Use JPG, PNG, WebP ou AVIF." }, { status: 400 });
  }
  if (file.size > maxSize) {
    return NextResponse.json({ error: "A imagem deve ter no máximo 5 MB." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesFileSignature(file.type, bytes)) {
    return NextResponse.json({ error: "O arquivo enviado não é uma imagem válida." }, { status: 400 });
  }

  const extension = extensionFor(file.type);
  const path = `${context.business.id}/${crypto.randomUUID()}.${extension}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from("product-images").upload(path, bytes, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: "Não foi possível enviar a imagem." }, { status: 400 });
  }

  const { data } = admin.storage.from("product-images").getPublicUrl(path);
  return NextResponse.json({ imageUrl: data.publicUrl }, { status: 201 });
}

function matchesFileSignature(type: string, bytes: Uint8Array) {
  if (bytes.length < 12) return false;

  if (type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (type === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (value, index) => bytes[index] === value,
    );
  }

  if (type === "image/webp") {
    return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP";
  }

  if (type === "image/avif") {
    if (ascii(bytes, 4, 8) !== "ftyp") return false;
    const header = ascii(bytes, 8, Math.min(bytes.length, 32));
    return header.includes("avif") || header.includes("avis");
  }

  return false;
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/avif") return "avif";
  if (type === "image/webp") return "webp";
  return "jpg";
}
