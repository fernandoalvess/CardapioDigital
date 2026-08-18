import Link from "next/link";
import { listAdminOrders } from "@/lib/admin-orders";
import { formatBRL } from "@/lib/format";
import type { AdminOrder } from "@/types/order";

export default async function ComandasPage() {
  const orders = await listAdminOrders(200);
  const open = orders.filter((order) => order.status === "pending");
  const closed = orders.filter((order) => order.status === "completed");
  const cancelled = orders.filter((order) => order.status === "cancelled");

  return (
    <main>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6500]">Pedidos</p>
      <h1 className="mt-1 text-3xl font-black">Comandas</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
        Comandas abertas ainda não são vendas confirmadas. Revise, ajuste se necessário e feche a comanda somente quando o pedido estiver confirmado.
      </p>

      <section className="mt-8">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-black">Abertas</h2>
          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-black text-orange-700">{open.length}</span>
        </div>
        {open.length ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {open.map((order) => <OrderCard key={order.id} order={order} />)}
          </div>
        ) : (
          <EmptyState text="Nenhuma comanda aberta no momento." />
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-black">Vendas confirmadas</h2>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">{closed.length}</span>
        </div>
        {closed.length ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {closed.slice(0, 30).map((order) => <OrderCard key={order.id} order={order} />)}
          </div>
        ) : (
          <EmptyState text="Nenhuma venda confirmada ainda." />
        )}
      </section>

      {cancelled.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-xl font-black">Canceladas</h2>
            <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-black text-zinc-600">{cancelled.length}</span>
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            {cancelled.slice(0, 20).map((order) => <OrderCard key={order.id} order={order} />)}
          </div>
        </section>
      )}
    </main>
  );
}

function OrderCard({ order }: { order: AdminOrder }) {
  const status = statusView(order.status);
  return (
    <Link href={`/admin/comandas/${order.id}`} className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-lg">Comanda #{order.orderNumber ?? order.id.slice(0, 8)}</strong>
            <span className={`rounded-full px-2 py-1 text-[11px] font-black ${status.className}`}>{status.label}</span>
          </div>
          <p className="mt-2 font-bold text-zinc-700">{order.customerName}</p>
          <p className="mt-1 text-xs text-zinc-400">{formatDate(order.createdAt)}</p>
        </div>
        <strong className="text-lg">{formatBRL(order.total)}</strong>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 text-sm">
        <span className="text-zinc-500">{order.items.reduce((sum, item) => sum + item.quantity, 0)} itens</span>
        <span className="font-bold text-[#ff6500]">Abrir comanda →</span>
      </div>
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">{text}</div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Fortaleza",
  }).format(new Date(value));
}

function statusView(status: AdminOrder["status"]) {
  if (status === "completed") return { label: "Venda confirmada", className: "bg-emerald-100 text-emerald-700" };
  if (status === "cancelled") return { label: "Cancelada", className: "bg-zinc-200 text-zinc-600" };
  return { label: "Aberta", className: "bg-orange-100 text-orange-700" };
}
