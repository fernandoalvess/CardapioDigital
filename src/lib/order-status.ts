import type { OrderStatus } from "@/types/order";

export const orderStatusView: Record<
  OrderStatus,
  { label: string; shortLabel: string; className: string }
> = {
  pending: {
    label: "Novo pedido",
    shortLabel: "Novo",
    className: "bg-orange-100 text-orange-700",
  },
  accepted: {
    label: "Confirmado",
    shortLabel: "Confirmado",
    className: "bg-blue-100 text-blue-700",
  },
  preparing: {
    label: "Em preparo",
    shortLabel: "Preparando",
    className: "bg-amber-100 text-amber-800",
  },
  ready: {
    label: "Pronto",
    shortLabel: "Pronto",
    className: "bg-violet-100 text-violet-700",
  },
  out_for_delivery: {
    label: "Saiu para entrega",
    shortLabel: "Em entrega",
    className: "bg-cyan-100 text-cyan-700",
  },
  completed: {
    label: "Venda confirmada",
    shortLabel: "Concluído",
    className: "bg-emerald-100 text-emerald-700",
  },
  cancelled: {
    label: "Cancelado",
    shortLabel: "Cancelado",
    className: "bg-zinc-200 text-zinc-600",
  },
};

const nextActions: Partial<
  Record<OrderStatus, { status: OrderStatus; label: string }>
> = {
  pending: { status: "accepted", label: "Confirmar pedido" },
  accepted: { status: "preparing", label: "Iniciar preparo" },
  preparing: { status: "ready", label: "Marcar como pronto" },
  ready: { status: "out_for_delivery", label: "Saiu para entrega" },
  out_for_delivery: { status: "completed", label: "Concluir venda" },
};

export function nextOrderAction(status: OrderStatus) {
  return nextActions[status] ?? null;
}

export function isOpenOrderStatus(status: OrderStatus) {
  return status !== "completed" && status !== "cancelled";
}
