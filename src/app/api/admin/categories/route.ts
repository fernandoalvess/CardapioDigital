import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/admin-auth";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});

export async function POST(request: Request) {
  const context = await getAdminContext();
  if (!context) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados da categoria inválidos." }, { status: 400 });
  }

  const slug = await uniqueCategorySlug(context, parsed.data.name);
  const { data, error } = await context.supabase
    .from("categories")
    .insert({
      business_id: context.business.id,
      name: parsed.data.name,
      slug,
      sort_order: parsed.data.sortOrder,
      is_active: parsed.data.isActive,
    })
    .select("id,name,slug,sort_order,is_active")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: cleanError(error?.message ?? "Não foi possível criar a categoria.") }, { status: 400 });
  }

  revalidatePath("/");
  revalidatePath("/admin/cardapio");
  return NextResponse.json({ category: data }, { status: 201 });
}

async function uniqueCategorySlug(context: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>, name: string) {
  const base = slugify(name) || "categoria";
  let candidate = base;
  let suffix = 2;
  while (true) {
    const { data } = await context.supabase
      .from("categories")
      .select("id")
      .eq("business_id", context.business.id)
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanError(message: string) {
  return message.includes("duplicate") ? "Já existe uma categoria com esse nome." : message.replace(/^.*?: /, "");
}
