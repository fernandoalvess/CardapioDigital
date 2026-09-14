"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CircleCheckBig,
  CircleX,
  Clock3,
  LoaderCircle,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RefreshButton } from "@/components/admin/refresh-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL, paymentMethodLabel } from "@/lib/format";
import {
  isOpenOrderStatus,
  nextOrderAction,
  orderStatusView,
} from "@/lib/order-status";
import type { AdminOrder, OrderStatus } from "@/types/order";

type BoardMode = "operation" | "completed" | "cancelled";

export function OrdersBoard({
  initialOrders,
  timezone,
}: {
  initialOrders: AdminOrder[];
  timezone: string;
}) {
  const router = useRouter();
  const orders = initialOrders;
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<BoardMode>("operation");
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const query = search.trim().toLowerCase();
  const visibleOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesMode =
          mode === "operation"
            ? isOpenOrderStatus(order.status)
            : order.status === mode;

        if (!matchesMode) return false;
        if (!query) return true;

        return [
          order.orderNumber ? String(order.orderNumber) : "",
          order.customerName,
          order.customerPhone,
          order.address,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      }),
    [mode, orders, query],
  );

  const counts = {
    operation: orders.filter((order) => isOpenOrderStatus(order.status)).length,
    completed: orders.filter((order) => order.status === "completed").length,
    cancelled: orders.filter((order) => order.status === "cancelled").length,
  };

  async function changeStatus(order: AdminOrder, status: OrderStatus) {
    if (status === "completed") {
      const confirmed = window.confirm(
        "Concluir esta comanda e contabilizar a venda?",
      );
      if (!confirmed) return;
    }

    setBusyOrderId(order.id);
    const response = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "status", status }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setBusyOrderId(null);
      toast.error(result.error ?? "Não foi possível atualizar o pedido.");
      return;
    }

    setBusyOrderId(null);
    toast.success(orderStatusView[status].label);
    router.refresh();
  }

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--brand)]">
            Pedidos
          </p>
          <h1 className="mt-1 text-3xl font-black">Comandas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Acompanhe os pedidos e avance cada comanda pela operação.
          </p>
        </div>
        <RefreshButton />
      </div>

      <section className="mt-7 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nº, cliente, telefone ou endereço"
              className="pl-10"
            />
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            <ModeButton
              active={mode === "operation"}
              onClick={() => setMode("operation")}
              label="Em andamento"
              count={counts.operation}
            />
            <ModeButton
              active={mode === "completed"}
              onClick={() => setMode("completed")}
              label="Concluídas"
              count={counts.completed}
            />
            <ModeButton
              active={mode === "cancelled"}
              onClick={() => setMode("cancelled")}
              label="Canceladas"
              count={counts.cancelled}
            />
          </div>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {visibleOrders.length ? (
          <div className="divide-y divide-zinc-100">
            {visibleOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                timezone={timezone}
                busy={busyOrderId === order.id}
                onAdvance={changeStatus}
              />
            ))}
          </div>
        ) : (
          <EmptyState mode={mode} />
        )}
      </section>
    </main>
  );
}

function OrderRow({
  order,
  timezone,
  busy,
  onAdvance,
}: {
  order: AdminOrder;
  timezone: string;
  busy: boolean;
  onAdvance: (order: AdminOrder, status: OrderStatus) => void;
}) {
  const view = orderStatusView[order.status];
  const nextAction = nextOrderAction(order.status);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/comandas/${order.id}`}
            className="font-black text-zinc-950 hover:text-[var(--brand)]"
          >
            Comanda #{order.orderNumber ?? order.id.slice(0, 8)}
          </Link>
          <span className={`rounded-full px-2.5 py-1 text-xs font-black ${view.className}`}>
            {view.shortLabel}
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-bold text-zinc-700">
          {order.customerName}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            {formatDate(order.createdAt, timezone)}
          </span>
          <span>{paymentMethodLabel(order.paymentMethod)}</span>
          <span>{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <strong className="mr-1 text-base">{formatBRL(order.total)}</strong>
        <Link
          href={`/admin/comandas/${order.id}`}
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-zinc-200 px-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50"
        >
          Detalhes
        </Link>
        {nextAction && (
          <Button
            type="button"
            disabled={busy}
            onClick={() => onAdvance(order, nextAction.status)}
          >
            {busy ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {nextAction.label}
          </Button>
        )}
      </div>
    </article>
  );
}

function ModeButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-black transition ${
        active
          ? "bg-[var(--brand)] text-white"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
      }`}
    >
      {label}
      <span className={`rounded-full px-1.5 py-0.5 ${active ? "bg-white/20" : "bg-white"}`}>
        {count}
      </span>
    </button>
  );
}

function EmptyState({ mode }: { mode: BoardMode }) {
  const Icon = mode === "cancelled" ? CircleX : CircleCheckBig;
  return (
    <div className="px-5 py-14 text-center">
      <Icon className="mx-auto h-8 w-8 text-zinc-300" />
      <p className="mt-3 font-black text-zinc-700">Nenhuma comanda encontrada</p>
      <p className="mt-1 text-sm text-zinc-500">
        Ajuste a busca ou aguarde novos pedidos.
      </p>
    </div>
  );
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
