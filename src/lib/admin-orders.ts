import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { AdminOrder, AdminOrderItem, OrderStatus } from "@/types/order";

type OrderItemRow = {
  id: string;
  product_id: string | null;
  product_name_snapshot: string;
  unit_price: number | string;
  quantity: number;
  total: number | string;
};

type OrderRow = {
  id: string;
  order_number: number | null;
  customer_name: string;
  customer_phone: string;
  address_text: string;
  payment_method: "pix" | "cash" | "card_on_delivery";
  notes: string | null;
  admin_notes: string | null;
  subtotal: number | string;
  delivery_fee: number | string;
  discount: number | string;
  total: number | string;
  status: OrderStatus;
  created_at: string;
  whatsapp_redirected_at: string | null;
  closed_at: string | null;
  cancelled_at: string | null;
  order_items?: OrderItemRow[] | null;
};

export type AdminBusiness = {
  id: string;
  name: string;
  timezone: string;
};

export async function getAdminBusiness(): Promise<AdminBusiness | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const slug = process.env.NEXT_PUBLIC_BUSINESS_SLUG ?? "fb-burguer";
  const { data } = await supabase
    .from("businesses")
    .select("id,name,timezone")
    .eq("slug", slug)
    .single();

  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    timezone: data.timezone ?? "America/Fortaleza",
  };
}

export async function listAdminOrders(limit = 100): Promise<AdminOrder[]> {
  const business = await getAdminBusiness();
  if (!business) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id,order_number,customer_name,customer_phone,address_text,payment_method,notes,admin_notes,subtotal,delivery_fee,discount,total,status,created_at,whatsapp_redirected_at,closed_at,cancelled_at,order_items(id,product_id,product_name_snapshot,unit_price,quantity,total)",
    )
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as OrderRow[]).map(mapOrder);
}

export async function getAdminOrder(orderId: string): Promise<AdminOrder | null> {
  const business = await getAdminBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id,order_number,customer_name,customer_phone,address_text,payment_method,notes,admin_notes,subtotal,delivery_fee,discount,total,status,created_at,whatsapp_redirected_at,closed_at,cancelled_at,order_items(id,product_id,product_name_snapshot,unit_price,quantity,total)",
    )
    .eq("business_id", business.id)
    .eq("id", orderId)
    .maybeSingle();

  return data ? mapOrder(data as OrderRow) : null;
}

export function getTodaySalesMetrics(orders: AdminOrder[], timezone: string) {
  const today = dateKey(new Date(), timezone);
  const closedToday = orders.filter(
    (order) =>
      order.status === "completed" &&
      order.closedAt &&
      dateKey(new Date(order.closedAt), timezone) === today,
  );
  const open = orders.filter((order) => order.status === "pending");
  const revenue = closedToday.reduce((sum, order) => sum + order.total, 0);

  return {
    openCount: open.length,
    salesCount: closedToday.length,
    revenue,
    averageTicket: closedToday.length ? revenue / closedToday.length : 0,
  };
}

function dateKey(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function mapOrder(row: OrderRow): AdminOrder {
  const items: AdminOrderItem[] = (row.order_items ?? []).map((item) => ({
    id: item.id,
    productId: item.product_id,
    name: item.product_name_snapshot,
    unitPrice: Number(item.unit_price),
    quantity: item.quantity,
    total: Number(item.total),
  }));

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    address: row.address_text,
    paymentMethod: row.payment_method,
    notes: row.notes ?? "",
    adminNotes: row.admin_notes ?? "",
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    discount: Number(row.discount),
    total: Number(row.total),
    status: row.status,
    createdAt: row.created_at,
    whatsappRedirectedAt: row.whatsapp_redirected_at,
    closedAt: row.closed_at,
    cancelledAt: row.cancelled_at,
    items,
  };
}
