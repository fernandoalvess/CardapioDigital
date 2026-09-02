import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxSize = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const context = await getAdminContext();
  if (!context) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  if (!process.env.SUPABASE_SECRET_KEY) {
    return NextResponse.json({ error: "SUPABASE_SECRET_KEY não configurada." }, { status: 503 });
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

  const extension = extensionFor(file.type);
  const path = `${context.business.id}/${crypto.randomUUID()}.${extension}`;
  const admin = createAdminClient();
  const bytes = await file.arrayBuffer();
  const { error } = await admin.storage.from("product-images").upload(path, bytes, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data } = admin.storage.from("product-images").getPublicUrl(path);
  return NextResponse.json({ imageUrl: data.publicUrl, path }, { status: 201 });
}

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/avif") return "avif";
  if (type === "image/webp") return "webp";
  return "jpg";
}
