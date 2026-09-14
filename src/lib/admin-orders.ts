import { getAdminContext } from "@/lib/admin-auth";
import { isOpenOrderStatus } from "@/lib/order-status";
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
  cash_change_for: number | string | null;
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

export type PaymentSalesSummary = {
  method: AdminOrder["paymentMethod"];
  count: number;
  total: number;
};

export type ProductSalesSummary = {
  name: string;
  quantity: number;
  total: number;
};

export async function getAdminBusiness(): Promise<AdminBusiness | null> {
  const context = await getAdminContext();
  if (!context) return null;

  return {
    id: context.business.id,
    name: context.business.name,
    timezone: context.business.timezone,
  };
}

export async function listAdminOrders(limit = 100): Promise<AdminOrder[]> {
  const context = await getAdminContext();
  if (!context) return [];

  const { data } = await context.supabase
    .from("orders")
    .select(
      "id,order_number,customer_name,customer_phone,address_text,payment_method,cash_change_for,notes,admin_notes,subtotal,delivery_fee,discount,total,status,created_at,whatsapp_redirected_at,closed_at,cancelled_at,order_items(id,product_id,product_name_snapshot,unit_price,quantity,total)",
    )
    .eq("business_id", context.business.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as OrderRow[]).map(mapOrder);
}

export async function getAdminOrder(orderId: string): Promise<AdminOrder | null> {
  const context = await getAdminContext();
  if (!context) return null;

  const { data } = await context.supabase
    .from("orders")
    .select(
      "id,order_number,customer_name,customer_phone,address_text,payment_method,cash_change_for,notes,admin_notes,subtotal,delivery_fee,discount,total,status,created_at,whatsapp_redirected_at,closed_at,cancelled_at,order_items(id,product_id,product_name_snapshot,unit_price,quantity,total)",
    )
    .eq("business_id", context.business.id)
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
  const open = orders.filter((order) => isOpenOrderStatus(order.status));
  const createdToday = orders.filter(
    (order) => dateKey(new Date(order.createdAt), timezone) === today,
  );
  const cancelledToday = orders.filter(
    (order) =>
      order.status === "cancelled" &&
      order.cancelledAt &&
      dateKey(new Date(order.cancelledAt), timezone) === today,
  );
  const revenue = closedToday.reduce((sum, order) => sum + order.total, 0);

  return {
    openCount: open.length,
    salesCount: closedToday.length,
    revenue,
    averageTicket: closedToday.length ? revenue / closedToday.length : 0,
    createdTodayCount: createdToday.length,
    cancelledTodayCount: cancelledToday.length,
  };
}

export function getTodaySalesInsights(orders: AdminOrder[], timezone: string) {
  const today = dateKey(new Date(), timezone);
  const closedToday = orders.filter(
    (order) =>
      order.status === "completed" &&
      order.closedAt &&
      dateKey(new Date(order.closedAt), timezone) === today,
  );

  const paymentMap = new Map<AdminOrder["paymentMethod"], PaymentSalesSummary>();
  for (const order of closedToday) {
    const current = paymentMap.get(order.paymentMethod) ?? {
      method: order.paymentMethod,
      count: 0,
      total: 0,
    };
    current.count += 1;
    current.total += order.total;
    paymentMap.set(order.paymentMethod, current);
  }

  const productMap = new Map<string, ProductSalesSummary>();
  for (const order of closedToday) {
    for (const item of order.items) {
      const current = productMap.get(item.name) ?? {
        name: item.name,
        quantity: 0,
        total: 0,
      };
      current.quantity += item.quantity;
      current.total += item.total;
      productMap.set(item.name, current);
    }
  }

  return {
    paymentSummary: Array.from(paymentMap.values()).sort(
      (a, b) => b.total - a.total,
    ),
    topProducts: Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity || b.total - a.total)
      .slice(0, 5),
    recentOpenOrders: orders
      .filter((order) => isOpenOrderStatus(order.status))
      .slice(0, 5),
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
    cashChangeFor: row.cash_change_for === null ? null : Number(row.cash_change_for),
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
