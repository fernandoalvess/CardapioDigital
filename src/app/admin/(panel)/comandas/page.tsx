import { OrdersBoard } from "@/components/admin/orders-board";
import { getAdminBusiness, listAdminOrders } from "@/lib/admin-orders";

export default async function ComandasPage() {
  const [orders, business] = await Promise.all([
    listAdminOrders(300),
    getAdminBusiness(),
  ]);

  return (
    <OrdersBoard
      initialOrders={orders}
      timezone={business?.timezone ?? "America/Fortaleza"}
    />
  );
}
