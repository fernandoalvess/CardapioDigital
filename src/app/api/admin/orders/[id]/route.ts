import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  action: z.literal("update"),
  adminNotes: z.string().trim().max(1000),
  deliveryFee: z.number().min(0).max(10000),
  discount: z.number().min(0).max(10000),
  items: z
    .array(
      z.object({
        orderItemId: z.string().uuid().nullable(),
        productId: z.string().uuid().nullable(),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1)
    .max(100),
});

const actionSchema = z.discriminatedUnion("action", [
  updateSchema,
  z.object({ action: z.literal("close") }),
  z.object({ action: z.literal("cancel") }),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Conecte o Supabase para gerenciar comandas." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos para atualizar a comanda." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) {
    return NextResponse.json(
      { error: "Sessão administrativa expirada." },
      { status: 401 },
    );
  }

  if (parsed.data.action === "close") {
    const { error } = await supabase.rpc("close_order_comanda", {
      target_order_id: id,
    });
    return error
      ? NextResponse.json({ error: cleanError(error.message) }, { status: 400 })
      : NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "cancel") {
    const { error } = await supabase.rpc("cancel_order_comanda", {
      target_order_id: id,
    });
    return error
      ? NextResponse.json({ error: cleanError(error.message) }, { status: 400 })
      : NextResponse.json({ ok: true });
  }

  const { error } = await supabase.rpc("update_order_items", {
    target_order_id: id,
    new_admin_notes: parsed.data.adminNotes,
    new_delivery_fee: parsed.data.deliveryFee,
    new_discount: parsed.data.discount,
    new_items: parsed.data.items,
  });

  return error
    ? NextResponse.json({ error: cleanError(error.message) }, { status: 400 })
    : NextResponse.json({ ok: true });
}

function cleanError(message: string) {
  return message.replace(/^.*?: /, "");
}
