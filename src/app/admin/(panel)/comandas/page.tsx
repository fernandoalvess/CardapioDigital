import Link from "next/link";
import {
  Banknote,
  ChevronRight,
  CircleX,
  Clock3,
  CreditCard,
  QrCode,
  Search,
} from "lucide-react";
import { RefreshButton } from "@/components/admin/refresh-button";
import { Card } from "@/components/ui/card";
import { getAdminBusiness, listAdminOrders } from "@/lib/admin-orders";
import { formatBRL } from "@/lib/format";
import type { AdminOrder } from "@/types/order";

type StatusFilter = "all" | "pending" | "completed" | "cancelled";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
};

export default async function ComandasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [orders, business] = await Promise.all([
    listAdminOrders(300),
    getAdminBusiness(),
  ]);
  const timezone = business?.timezone ?? "America/Fortaleza";
  const status = normalizeStatus(params.status);
  const query = (params.q ?? "").trim().toLowerCase();

  const counts = {
    all: orders.length,
    pending: orders.filter((order) => isOpenStatus(order.status)).length,
    completed: orders.filter((order) => order.status === "completed").length,
    cancelled: orders.filter((order) => order.status === "cancelled").length,
  };

  const filtered = orders.filter((order) => {
    if (status === "pending" && !isOpenStatus(order.status)) return false;
    if (status === "completed" && order.status !== "completed") return false;
    if (status === "cancelled" && order.status !== "cancelled") return false;
    if (!query) return true;

    const haystack = [
      order.orderNumber ? String(order.orderNumber) : "",
      order.customerName,
      order.customerPhone,
      order.address,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  const tabs: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: "Todas" },
    { value: "pending", label: "Abertas" },
    { value: "completed", label: "Vendas" },
    { value: "cancelled", label: "Canceladas" },
  ];

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6500]">
            Pedidos
          </p>
          <h1 className="mt-1 text-3xl font-black">Comandas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Localize pedidos, revise os dados e confirme a venda ao fechar a comanda.
          </p>
        </div>
        <RefreshButton />
      </div>

      <Card className="mt-7 overflow-hidden">
        <div className="border-b border-zinc-100 p-4 md:p-5">
          <form action="/admin/comandas" method="get" className="flex flex-col gap-3 sm:flex-row">
            <input type="hidden" name="status" value={status} />
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Buscar por nº, cliente, telefone ou endereço"
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-black text-white transition hover:bg-zinc-800"
            >
              Buscar
            </button>
          </form>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => {
              const active = tab.value === status;
              return (
                <Link
                  key={tab.value}
                  href={buildFilterUrl(tab.value, params.q)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-black transition ${
                    active
                      ? "bg-[#ff6500] text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      active ? "bg-white/20 text-white" : "bg-white text-zinc-500"
                    }`}
                  >
                    {counts[tab.value]}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {filtered.length ? (
          <div className="divide-y divide-zinc-100">
            {filtered.map((order) => (
              <OrderRow key={order.id} order={order} timezone={timezone} />
            ))}
          </div>
        ) : (
          <EmptyState hasQuery={Boolean(query)} />
        )}
      </Card>
    </main>
  );
}

function OrderRow({ order, timezone }: { order: AdminOrder; timezone: string }) {
  const status = statusView(order.status);
  const payment = paymentView(order.paymentMethod);
  const PaymentIcon = payment.icon;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href={`/admin/comandas/${order.id}`}
      className="group block p-4 transition hover:bg-zinc-50 md:p-5"
    >
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-base text-zinc-950 md:text-lg">
              Comanda #{order.orderNumber ?? order.id.slice(0, 8)}
            </strong>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${status.className}`}>
              {status.label}
            </span>
          </div>

          <p className="mt-2 truncate text-sm font-bold text-zinc-700">
            {order.customerName}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              {formatDate(order.createdAt, timezone)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PaymentIcon className="h-3.5 w-3.5" />
              {payment.label}
            </span>
            <span>{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 md:justify-end">
          <div className="text-left md:text-right">
            <p className="text-xs text-zinc-400">Total</p>
            <strong className="text-lg text-zinc-950">{formatBRL(order.total)}</strong>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 transition group-hover:bg-orange-100 group-hover:text-[#ff6500]">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="px-5 py-14 text-center">
      {hasQuery ? (
        <Search className="mx-auto h-8 w-8 text-zinc-300" />
      ) : (
        <CircleX className="mx-auto h-8 w-8 text-zinc-300" />
      )}
      <p className="mt-3 font-black text-zinc-700">
        {hasQuery ? "Nenhuma comanda encontrada" : "Nenhuma comanda nesta situação"}
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        {hasQuery
          ? "Tente buscar por outro número, nome ou telefone."
          : "Quando houver registros, eles aparecerão aqui."}
      </p>
    </div>
  );
}

function isOpenStatus(status: AdminOrder["status"]) {
  return status !== "completed" && status !== "cancelled";
}

function normalizeStatus(value?: string): StatusFilter {
  if (value === "pending" || value === "completed" || value === "cancelled") {
    return value;
  }
  return "all";
}

function buildFilterUrl(status: StatusFilter, query?: string) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (query?.trim()) params.set("q", query.trim());
  const qs = params.toString();
  return `/admin/comandas${qs ? `?${qs}` : ""}`;
}

function formatDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}

function statusView(status: AdminOrder["status"]) {
  if (status === "completed") {
    return { label: "Venda confirmada", className: "bg-emerald-100 text-emerald-700" };
  }
  if (status === "cancelled") {
    return { label: "Cancelada", className: "bg-zinc-200 text-zinc-600" };
  }
  return { label: "Aberta", className: "bg-orange-100 text-orange-700" };
}

function paymentView(method: AdminOrder["paymentMethod"]) {
  if (method === "cash") return { label: "Dinheiro", icon: Banknote };
  if (method === "card_on_delivery") return { label: "Cartão na entrega", icon: CreditCard };
  return { label: "Pix", icon: QrCode };
}
