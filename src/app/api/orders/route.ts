import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseSecret } from "@/lib/supabase/env";
import { formatBRL } from "@/lib/format";
import { getBusinessStoreStatus } from "@/lib/business-hours";
import { exceedsContentLength, getClientIp, isSameOriginRequest, rateLimit } from "@/lib/security";

const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .min(10)
    .max(20)
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length === 10 || digits.length === 11;
    }, "Telefone inválido."),
  address: z.string().trim().min(5).max(500),
  paymentMethod: z.enum(["pix", "cash", "card_on_delivery"]),
  cashChangeFor: z.number().min(0).max(100000).nullable().optional().default(null),
  notes: z.string().trim().max(500).optional().default(""),
  website: z.string().max(0).optional().default(""),
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

const paymentLabels: Record<string, string> = {
  pix: "Pix",
  cash: "Dinheiro",
  card_on_delivery: "Cartão na entrega",
};

export async function POST(request: Request) {
  if (!hasSupabaseSecret) {
    return NextResponse.json(
      { error: "Pedidos temporariamente indisponíveis. Tente novamente em instantes." },
      { status: 503 },
    );
  }

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Requisição não permitida." }, { status: 403 });
  }

  if (exceedsContentLength(request, 100 * 1024)) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 413 });
  }

  const clientIp = getClientIp(request.headers);
  const ipAllowed = await rateLimit({
    scope: "create-order-ip",
    identifier: clientIp,
    limit: 10,
    windowSeconds: 10 * 60,
  });

  if (!ipAllowed) {
    return NextResponse.json(
      { error: "Muitos pedidos em pouco tempo. Aguarde alguns minutos e tente novamente." },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }

  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados do pedido inválidos." },
      { status: 400 },
    );
  }

  const phoneAllowed = await rateLimit({
    scope: "create-order-phone",
    identifier: parsed.data.phone.replace(/\D/g, ""),
    limit: 5,
    windowSeconds: 10 * 60,
  });

  if (!phoneAllowed) {
    return NextResponse.json(
      { error: "Muitos pedidos para este telefone. Aguarde alguns minutos e tente novamente." },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }

  const supabase = createAdminClient();
  const businessSlug = process.env.NEXT_PUBLIC_BUSINESS_SLUG ?? "fb-burguer";

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id,name,whatsapp,timezone")
    .eq("slug", businessSlug)
    .eq("is_active", true)
    .single();

  if (businessError || !business) {
    return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });
  }

  let storeStatus;
  try {
    storeStatus = await getBusinessStoreStatus(
      supabase,
      business.id,
      business.timezone ?? "America/Fortaleza",
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível confirmar o horário da FB Burguer. Tente novamente em instantes." },
      { status: 503 },
    );
  }

  if (!storeStatus.isOpen) {
    return NextResponse.json(
      { error: storeStatus.message, code: "STORE_CLOSED" },
      { status: 409 },
    );
  }

  const whatsapp = String(business.whatsapp ?? "").replace(/\D/g, "");
  if (!whatsapp) {
    return NextResponse.json(
      { error: "O WhatsApp da loja ainda não está configurado." },
      { status: 503 },
    );
  }

  const requested = parsed.data.items;
  const ids = [...new Set(requested.map((item) => item.productId))];

  const { data: activeCategories } = await supabase
    .from("categories")
    .select("id")
    .eq("business_id", business.id)
    .eq("is_active", true);
  const activeCategoryIds = (activeCategories ?? []).map((category) => category.id);

  if (activeCategoryIds.length === 0) {
    return NextResponse.json({ error: "O cardápio está sem categorias ativas." }, { status: 409 });
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,name,price,is_available,is_active")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .in("category_id", activeCategoryIds)
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
  const cashChangeFor =
    parsed.data.paymentMethod === "cash" ? parsed.data.cashChangeFor : null;

  if (cashChangeFor !== null && cashChangeFor !== undefined && cashChangeFor < total) {
    return NextResponse.json(
      { error: "O valor informado para troco deve ser igual ou maior que o total do pedido." },
      { status: 400 },
    );
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      business_id: business.id,
      customer_name: parsed.data.customerName,
      customer_phone: parsed.data.phone,
      address_text: parsed.data.address,
      payment_method: parsed.data.paymentMethod,
      cash_change_for: cashChangeFor ?? null,
      notes: parsed.data.notes,
      subtotal,
      delivery_fee: deliveryFee,
      discount,
      total,
      status: "pending",
      whatsapp_redirected_at: new Date().toISOString(),
    })
    .select("id,order_number")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "Não foi possível criar a comanda. O WhatsApp não foi aberto." },
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
      { error: "Não foi possível salvar os itens da comanda. O WhatsApp não foi aberto." },
      { status: 500 },
    );
  }

  const commandNumber = order.order_number ?? order.id.slice(0, 8).toUpperCase();
  const message = buildWhatsAppMessage({
    commandNumber,
    customerName: parsed.data.customerName,
    phone: parsed.data.phone,
    address: parsed.data.address,
    paymentMethod: parsed.data.paymentMethod,
    cashChangeFor: cashChangeFor ?? null,
    notes: parsed.data.notes,
    items: pricedItems,
    total,
  });

  return NextResponse.json(
    {
      orderNumber: commandNumber,
      whatsappUrl: `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`,
    },
    { status: 201 },
  );
}

function buildWhatsAppMessage({
  commandNumber,
  customerName,
  phone,
  address,
  paymentMethod,
  cashChangeFor,
  notes,
  items,
  total,
}: {
  commandNumber: string | number;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: string;
  cashChangeFor: number | null;
  notes: string;
  items: Array<{ name: string; unitPrice: number; quantity: number; total: number }>;
  total: number;
}) {
  const itemLines = items
    .map((item) => `• ${item.quantity}x ${item.name} — ${formatBRL(item.total)}`)
    .join("\n");

  return [
    `*COMANDA #${commandNumber}*`,
    "",
    `👤 *Cliente:* ${customerName}`,
    `📱 *Telefone:* ${phone}`,
    `📍 *Entrega:* ${address}`,
    "",
    "*ITENS*",
    itemLines,
    "",
    `💰 *Total:* ${formatBRL(total)}`,
    `💳 *Forma de pagamento:* ${paymentLabels[paymentMethod] ?? paymentMethod}`,
    paymentMethod === "cash" && cashChangeFor !== null
      ? `💵 *Troco para:* ${formatBRL(cashChangeFor)}`
      : "",
    notes ? `📝 *Observação:* ${notes}` : "",
    "",
  ]
    .filter(Boolean)
    .join("\n");
}
