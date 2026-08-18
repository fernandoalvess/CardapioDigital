import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseSecret } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBRL } from "@/lib/format";

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

const paymentLabels: Record<string, string> = {
  pix: "Pix direto com a loja",
  cash: "Dinheiro",
  card_on_delivery: "Cartão na entrega",
};

export async function POST(request: Request) {
  if (!hasSupabaseSecret) {
    return NextResponse.json(
      {
        error:
          "A FB Burguer ainda está em modo de demonstração. Conecte o Supabase para garantir que todo pedido enviado ao WhatsApp gere uma comanda.",
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
  const businessSlug = process.env.NEXT_PUBLIC_BUSINESS_SLUG ?? "fb-burguer";

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id,name,whatsapp")
    .eq("slug", businessSlug)
    .eq("is_active", true)
    .single();

  if (businessError || !business) {
    return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });
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
    businessName: business.name,
    commandNumber,
    customerName: parsed.data.customerName,
    phone: parsed.data.phone,
    address: parsed.data.address,
    paymentMethod: parsed.data.paymentMethod,
    notes: parsed.data.notes,
    items: pricedItems,
    total,
  });

  return NextResponse.json(
    {
      orderId: order.id,
      orderNumber: commandNumber,
      whatsappUrl: `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`,
    },
    { status: 201 },
  );
}

function buildWhatsAppMessage({
  businessName,
  commandNumber,
  customerName,
  phone,
  address,
  paymentMethod,
  notes,
  items,
  total,
}: {
  businessName: string;
  commandNumber: string | number;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: string;
  notes: string;
  items: Array<{ name: string; unitPrice: number; quantity: number; total: number }>;
  total: number;
}) {
  const itemLines = items
    .map(
      (item) =>
        `• ${item.quantity}x ${item.name} — ${formatBRL(item.total)}`,
    )
    .join("\n");

  return [
    `🍔 *${businessName.toUpperCase()}*`,
    `*COMANDA #${commandNumber}*`,
    "",
    `👤 *Cliente:* ${customerName}`,
    `📱 *Telefone:* ${phone}`,
    `📍 *Entrega:* ${address}`,
    "",
    "*ITENS*",
    itemLines,
    "",
    `💰 *Total dos itens:* ${formatBRL(total)}`,
    `💳 *Forma informada:* ${paymentLabels[paymentMethod] ?? paymentMethod}`,
    notes ? `📝 *Observação:* ${notes}` : "",
    "",
    "Esta comanda será confirmada como venda pela administração da FB Burguer.",
  ]
    .filter(Boolean)
    .join("\n");
}
