import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderEditor } from "@/components/admin/order-editor";
import { getAdminOrder } from "@/lib/admin-orders";

export default async function ComandaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  return (
    <main>
      <Link href="/admin/comandas" className="text-sm font-bold text-zinc-500 hover:text-zinc-950">← Voltar para comandas</Link>
      <div className="mt-5 mb-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6500]">Comanda</p>
        <h1 className="mt-1 text-3xl font-black">#{order.orderNumber ?? order.id.slice(0, 8)}</h1>
        <p className="mt-2 text-sm text-zinc-500">Criada em {formatDate(order.createdAt)}</p>
      </div>
      <OrderEditor order={order} />
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Fortaleza",
  }).format(new Date(value));
}
