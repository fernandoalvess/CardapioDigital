import Link from "next/link";
import {
  ChevronRight,
  ClipboardList,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { RefreshButton } from "@/components/admin/refresh-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  getAdminBusiness,
  getTodaySalesInsights,
  getTodaySalesMetrics,
  listAdminOrders,
} from "@/lib/admin-orders";
import { formatBRL, paymentMethodLabel } from "@/lib/format";
import { orderStatusView } from "@/lib/order-status";

export default async function AdminDashboard() {
  const [business, orders] = await Promise.all([
    getAdminBusiness(),
    listAdminOrders(300),
  ]);

  const timezone = business?.timezone ?? "America/Fortaleza";
  const metrics = getTodaySalesMetrics(orders, timezone);
  const insights = getTodaySalesInsights(orders, timezone);

  const cards = [
    {
      label: "Comandas abertas",
      value: String(metrics.openCount),
      note: "em alguma etapa da operação",
      icon: ClipboardList,
      className: "bg-orange-50 text-orange-700",
    },
    {
      label: "Vendas hoje",
      value: String(metrics.salesCount),
      note: `${metrics.createdTodayCount} pedidos criados hoje`,
      icon: ShoppingBag,
      className: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Faturamento hoje",
      value: formatBRL(metrics.revenue),
      note: "somente comandas concluídas",
      icon: ReceiptText,
      className: "bg-blue-50 text-blue-700",
    },
    {
      label: "Ticket médio",
      value: formatBRL(metrics.averageTicket),
      note:
        metrics.cancelledTodayCount > 0
          ? `${metrics.cancelledTodayCount} cancelada(s) hoje`
          : "nenhuma comanda cancelada hoje",
      icon: TrendingUp,
      className: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--brand)]">
            Visão geral
          </p>
          <h1 className="mt-1 text-3xl font-black">Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Acompanhe a operação e as vendas confirmadas da FB Burguer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
          <Link
            href="/admin/comandas"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-black text-white transition hover:bg-[var(--brand-dark)]"
          >
            Ver comandas
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="overflow-hidden">
              <CardContent className="pt-5 md:pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-zinc-500">{card.label}</p>
                    <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
                      {card.value}
                    </p>
                  </div>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.className}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-zinc-400">{card.note}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-7 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-zinc-500">Operação</p>
              <h2 className="mt-1 text-xl font-black">Comandas em andamento</h2>
            </div>
            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-black text-orange-700">
              {metrics.openCount}
            </span>
          </CardHeader>
          <CardContent className="pt-5">
            {insights.recentOpenOrders.length ? (
              <div className="divide-y divide-zinc-100">
                {insights.recentOpenOrders.map((order) => {
                  const status = orderStatusView[order.status];
                  return (
                    <Link
                      key={order.id}
                      href={`/admin/comandas/${order.id}`}
                      className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="truncate text-sm text-zinc-950">
                            Comanda #{order.orderNumber ?? order.id.slice(0, 8)}
                          </strong>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-black ${status.className}`}>
                            {status.shortLabel}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-zinc-500">
                          {order.customerName} · {formatTime(order.createdAt, timezone)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <strong className="text-sm">{formatBRL(order.total)}</strong>
                        <ChevronRight className="h-4 w-4 text-zinc-400" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
                <ClipboardList className="mx-auto h-7 w-7 text-zinc-300" />
                <p className="mt-3 text-sm font-bold text-zinc-700">Nenhuma comanda em andamento</p>
                <p className="mt-1 text-xs text-zinc-500">Novos pedidos aparecerão aqui.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-black">Meios de pagamento hoje</h2>
            </CardHeader>
            <CardContent className="pt-5">
              {insights.paymentSummary.length ? (
                <div className="space-y-3">
                  {insights.paymentSummary.map((item) => (
                    <div key={item.method} className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-zinc-600">
                        {paymentMethodLabel(item.method)} · {item.count}
                      </span>
                      <strong>{formatBRL(item.total)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Nenhuma venda concluída hoje.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-black">Produtos mais vendidos hoje</h2>
            </CardHeader>
            <CardContent className="pt-5">
              {insights.topProducts.length ? (
                <div className="space-y-3">
                  {insights.topProducts.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-4 text-sm">
                      <span className="min-w-0 truncate text-zinc-600">{item.name}</span>
                      <strong className="shrink-0">{item.quantity} un.</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Ainda não há produtos vendidos hoje.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function formatTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}
