export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export type AdminOrderItem = {
  id: string;
  productId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  total: number;
};

export type AdminOrder = {
  id: string;
  orderNumber: number | null;
  customerName: string;
  customerPhone: string;
  address: string;
  paymentMethod: "pix" | "cash" | "card_on_delivery";
  notes: string;
  adminNotes: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  whatsappRedirectedAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
  items: AdminOrderItem[];
};
