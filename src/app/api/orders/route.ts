import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseSecret } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";

const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  address: z.string().trim().min(5).max(500),
  paymentMethod: z.enum(["pix", "cash", "card_on_delivery"]),
  notes: z.string().trim().max(500).optional().default(""),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(50),
});

export async function POST(request: Request) {
  if (!hasSupabaseSecret) {
    return NextResponse.json(
      {
        error:
          "Modo de demonstração: configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY para registrar pedidos.",
      },
      { status: 503 },
    );
  }

  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados do pedido inválidos.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const businessSlug =
    process.env.NEXT_PUBLIC_BUSINESS_SLUG ?? "fb-hamburgueria";

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", businessSlug)
    .eq("is_active", true)
    .single();

  if (businessError || !business) {
    return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });
  }

  const requested = parsed.data.items;
  const ids = [...new Set(requested.map((item) => item.productId))];

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,name,price,is_available")
    .eq("business_id", business.id)
    .in("id", ids);

  if (productsError || !products || products.length !== ids.length) {
    return NextResponse.json(
      { error: "Um ou mais produtos não foram encontrados." },
      { status: 400 },
    );
  }

  if (products.some((product) => !product.is_available)) {
    return NextResponse.json(
      { error: "Um ou mais produtos ficaram indisponíveis." },
      { status: 409 },
    );
  }

  const pricedItems = requested.map((requestedItem) => {
    const product = products.find(
      (candidate) => candidate.id === requestedItem.productId,
    )!;
    const unitPrice = Number(product.price);
    return {
      productId: product.id,
      name: product.name,
      unitPrice,
      quantity: requestedItem.quantity,
      total: unitPrice * requestedItem.quantity,
    };
  });

  const subtotal = pricedItems.reduce((sum, item) => sum + item.total, 0);
  const deliveryFee = 0;
  const discount = 0;
  const total = subtotal + deliveryFee - discount;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      business_id: business.id,
      customer_name: parsed.data.customerName,
      customer_phone: parsed.data.phone,
      address_text: parsed.data.address,
      payment_method: parsed.data.paymentMethod,
      notes: parsed.data.notes,
      subtotal,
      delivery_fee: deliveryFee,
      discount,
      total,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "Não foi possível criar o pedido." },
      { status: 500 },
    );
  }

  const { error: itemError } = await supabase.from("order_items").insert(
    pricedItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name_snapshot: item.name,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      total: item.total,
    })),
  );

  if (itemError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json(
      { error: "Não foi possível salvar os itens do pedido." },
      { status: 500 },
    );
  }

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
