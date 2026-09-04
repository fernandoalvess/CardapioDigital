import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/admin-auth";
import { isSameOriginRequest } from "@/lib/security";

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  price: z.number().min(0).max(100000),
  categoryId: z.string().uuid(),
  imageUrl: z.string().trim().max(1000).default(""),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Requisição não permitida." }, { status: 403 });
  const context = await getAdminContext();
  if (!context) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados do produto inválidos." }, { status: 400 });
  }

  const categoryOk = await categoryBelongsToBusiness(context, parsed.data.categoryId);
  if (!categoryOk) return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });

  const slug = await uniqueProductSlug(context, parsed.data.name);
  const { data, error } = await context.supabase
    .from("products")
    .insert({
      business_id: context.business.id,
      category_id: parsed.data.categoryId,
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
      price: parsed.data.price,
      image_url: parsed.data.imageUrl || null,
      is_available: parsed.data.isAvailable,
      is_featured: parsed.data.isFeatured,
      is_active: parsed.data.isActive,
      sort_order: parsed.data.sortOrder,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: productCreateError(error?.message) }, { status: 400 });
  }

  revalidatePath("/");
  revalidatePath("/admin/cardapio");
  return NextResponse.json({ id: data.id }, { status: 201 });
}

async function categoryBelongsToBusiness(context: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>, categoryId: string) {
  const { data } = await context.supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("business_id", context.business.id)
    .maybeSingle();
  return Boolean(data);
}

async function uniqueProductSlug(context: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>, name: string) {
  const base = slugify(name) || "produto";
  let candidate = base;
  let suffix = 2;
  while (true) {
    const { data } = await context.supabase
      .from("products")
      .select("id")
      .eq("business_id", context.business.id)
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function productCreateError(message?: string) {
  return message?.includes("duplicate")
    ? "Já existe um produto com dados conflitantes."
    : "Não foi possível criar o produto.";
}
