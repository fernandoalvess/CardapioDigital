import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSameOriginRequest } from "@/lib/security";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  price: z.number().min(0).max(100000).optional(),
  categoryId: z.string().uuid().optional(),
  imageUrl: z.string().trim().max(1000).optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Requisição não permitida." }, { status: 403 });
  const context = await getAdminContext();
  if (!context) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados do produto inválidos." }, { status: 400 });

  if (parsed.data.categoryId) {
    const { data: category } = await context.supabase
      .from("categories")
      .select("id")
      .eq("id", parsed.data.categoryId)
      .eq("business_id", context.business.id)
      .maybeSingle();
    if (!category) return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  const { data: currentProduct } = await context.supabase
    .from("products")
    .select("image_url")
    .eq("id", id)
    .eq("business_id", context.business.id)
    .maybeSingle();

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description || null;
  if (parsed.data.price !== undefined) updates.price = parsed.data.price;
  if (parsed.data.categoryId !== undefined) updates.category_id = parsed.data.categoryId;
  if (parsed.data.imageUrl !== undefined) updates.image_url = parsed.data.imageUrl || null;
  if (parsed.data.isAvailable !== undefined) updates.is_available = parsed.data.isAvailable;
  if (parsed.data.isFeatured !== undefined) updates.is_featured = parsed.data.isFeatured;
  if (parsed.data.isActive !== undefined) updates.is_active = parsed.data.isActive;
  if (parsed.data.sortOrder !== undefined) updates.sort_order = parsed.data.sortOrder;
  updates.updated_at = new Date().toISOString();

  const { error } = await context.supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .eq("business_id", context.business.id);

  if (error) return NextResponse.json({ error: productMutationError(error.message) }, { status: 400 });

  if (
    parsed.data.imageUrl !== undefined &&
    currentProduct?.image_url &&
    parsed.data.imageUrl !== currentProduct.image_url &&
    process.env.SUPABASE_SECRET_KEY
  ) {
    const oldPath = storagePathFromPublicUrl(currentProduct.image_url);
    if (oldPath) {
      await createAdminClient().storage.from("product-images").remove([oldPath]);
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/cardapio");
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Requisição não permitida." }, { status: 403 });
  const context = await getAdminContext();
  if (!context) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const { id } = await params;
  const { data: product } = await context.supabase
    .from("products")
    .select("image_url")
    .eq("id", id)
    .eq("business_id", context.business.id)
    .maybeSingle();

  const { error } = await context.supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("business_id", context.business.id);

  if (error) return NextResponse.json({ error: productMutationError(error.message) }, { status: 400 });

  const storagePath = storagePathFromPublicUrl(product?.image_url ?? "");
  if (storagePath && process.env.SUPABASE_SECRET_KEY) {
    await createAdminClient().storage.from("product-images").remove([storagePath]);
  }

  revalidatePath("/");
  revalidatePath("/admin/cardapio");
  return NextResponse.json({ ok: true });
}

function storagePathFromPublicUrl(url: string) {
  const marker = "/storage/v1/object/public/product-images/";
  const index = url.indexOf(marker);
  return index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : null;
}

function productMutationError(message: string) {
  if (message.includes("foreign key")) {
    return "Este produto possui vínculos que impedem a exclusão direta.";
  }
  return "Não foi possível concluir a alteração do produto.";
}
