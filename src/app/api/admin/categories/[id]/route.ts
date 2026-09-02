import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/admin-auth";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getAdminContext();
  if (!context) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados da categoria inválidos." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.sortOrder !== undefined) updates.sort_order = parsed.data.sortOrder;
  if (parsed.data.isActive !== undefined) updates.is_active = parsed.data.isActive;
  updates.updated_at = new Date().toISOString();

  const { error } = await context.supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .eq("business_id", context.business.id);

  if (error) return NextResponse.json({ error: cleanError(error.message) }, { status: 400 });

  revalidatePath("/");
  revalidatePath("/admin/cardapio");
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getAdminContext();
  if (!context) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const { id } = await params;
  const { error } = await context.supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("business_id", context.business.id);

  if (error) return NextResponse.json({ error: cleanError(error.message) }, { status: 400 });

  revalidatePath("/");
  revalidatePath("/admin/cardapio");
  return NextResponse.json({ ok: true });
}

function cleanError(message: string) {
  if (message.includes("foreign key") || message.includes("violates foreign key")) {
    return "Essa categoria ainda possui produtos. Mova ou exclua os produtos antes de removê-la.";
  }
  return message.replace(/^.*?: /, "");
}
