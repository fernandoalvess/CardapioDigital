import Link from "next/link";
import {
  Banknote,
  ChevronRight,
  ClipboardList,
  CreditCard,
  QrCode,
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
import { formatBRL } from "@/lib/format";
import type { AdminOrder } from "@/types/order";

export default async function AdminDashboard() {
  const [business, orders] = await Promise.all([
    getAdminBusiness(),
    listAdminOrders(500),
  ]);

  const timezone = business?.timezone ?? "America/Fortaleza";
  const metrics = getTodaySalesMetrics(orders, timezone);
  const insights = getTodaySalesInsights(orders, timezone);

  const cards = [
    {
      label: "Comandas abertas",
      value: String(metrics.openCount),
      note: "aguardando confirmação",
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
      note: "somente comandas fechadas",
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
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6500]">
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
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#ff6500] px-4 py-2 text-sm font-black text-white transition hover:bg-[#df5700]"
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
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.className}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-zinc-400">{card.note}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-7 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-zinc-500">Operação</p>
              <h2 className="mt-1 text-xl font-black">Comandas abertas</h2>
            </div>
            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-black text-orange-700">
              {metrics.openCount}
            </span>
          </CardHeader>
          <CardContent className="pt-5">
            {insights.recentOpenOrders.length ? (
              <div className="divide-y divide-zinc-100">
                {insights.recentOpenOrders.map((order) => (
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
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-orange-700">
                          Aberta
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
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
                <ClipboardList className="mx-auto h-7 w-7 text-zinc-300" />
                <p className="mt-3 text-sm font-bold text-zinc-700">
                  Nenhuma comanda aberta
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Novos pedidos aparecerão aqui.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-bold text-zinc-500">Hoje</p>
            <h2 className="mt-1 text-xl font-black">Formas de pagamento</h2>
          </CardHeader>
          <CardContent className="pt-5">
            {insights.paymentSummary.length ? (
              <div className="space-y-3">
                {insights.paymentSummary.map((payment) => {
                  const view = paymentView(payment.method);
                  const Icon = view.icon;
                  return (
                    <div
                      key={payment.method}
                      className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-zinc-700 shadow-sm">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{view.label}</p>
                          <p className="text-xs text-zinc-500">
                            {payment.count} venda{payment.count === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                      <strong className="text-sm">{formatBRL(payment.total)}</strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl bg-zinc-50 p-5 text-center text-sm text-zinc-500">
                As formas de pagamento aparecem após as primeiras vendas do dia.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-zinc-500">Vendas confirmadas hoje</p>
            <h2 className="mt-1 text-xl font-black">Produtos mais vendidos</h2>
          </div>
          <ReceiptText className="h-5 w-5 text-zinc-400" />
        </CardHeader>
        <CardContent className="pt-5">
          {insights.topProducts.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {insights.topProducts.map((product, index) => (
                <div key={product.name} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-[#ff6500]">#{index + 1}</span>
                    <span className="text-xs font-bold text-zinc-400">
                      {product.quantity} un.
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-black text-zinc-900">
                    {product.name}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">{formatBRL(product.total)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-zinc-50 p-5 text-center text-sm text-zinc-500">
              Ainda não há produtos vendidos hoje.
            </p>
          )}
        </CardContent>
      </Card>
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

function paymentView(method: AdminOrder["paymentMethod"]) {
  if (method === "cash") return { label: "Dinheiro", icon: Banknote };
  if (method === "card_on_delivery") return { label: "Cartão na entrega", icon: CreditCard };
  return { label: "Pix", icon: QrCode };
}
