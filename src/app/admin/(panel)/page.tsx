import Link from "next/link";
import { getAdminBusiness, getTodaySalesMetrics, listAdminOrders } from "@/lib/admin-orders";
import { getCatalog } from "@/lib/catalog";
import { formatBRL } from "@/lib/format";

export default async function AdminDashboard() {
  const [catalog, business, orders] = await Promise.all([
    getCatalog(),
    getAdminBusiness(),
    listAdminOrders(500),
  ]);

  const products = catalog.categories.flatMap((category) => category.products);
  const metrics = getTodaySalesMetrics(
    orders,
    business?.timezone ?? catalog.business.timezone,
  );

  const cards = [
    { label: "Comandas abertas", value: String(metrics.openCount), note: "aguardando confirmação" },
    { label: "Vendas hoje", value: String(metrics.salesCount), note: "comandas fechadas" },
    { label: "Faturamento hoje", value: formatBRL(metrics.revenue), note: "somente vendas confirmadas" },
    { label: "Ticket médio", value: formatBRL(metrics.averageTicket), note: "das vendas fechadas" },
  ];

  return (
    <main>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6500]">Visão geral</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Um pedido enviado ao WhatsApp entra como comanda aberta. O valor só aparece nas vendas depois que a comanda é fechada pela administração.
          </p>
        </div>
        <Link href="/admin/comandas" className="rounded-xl bg-[#ff6500] px-4 py-3 text-sm font-black text-white hover:bg-[#df5700]">
          Ver comandas
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="text-sm font-bold text-zinc-500">{card.label}</p>
            <p className="mt-3 text-3xl font-black">{card.value}</p>
            <p className="mt-2 text-xs text-zinc-400">{card.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <p className="text-sm font-bold text-zinc-500">Operação</p>
          <h2 className="mt-1 text-xl font-black">Fluxo das vendas</h2>
          <ol className="mt-5 grid gap-3 text-sm leading-6 text-zinc-600">
            <li><strong className="text-zinc-900">1.</strong> Cliente monta o pedido.</li>
            <li><strong className="text-zinc-900">2.</strong> O sistema cria a comanda.</li>
            <li><strong className="text-zinc-900">3.</strong> O WhatsApp é aberto com o pedido.</li>
            <li><strong className="text-zinc-900">4.</strong> O administrador ajusta a comanda se necessário.</li>
            <li><strong className="text-zinc-900">5.</strong> “Fechar comanda” confirma e contabiliza a venda.</li>
          </ol>
        </section>

        <section className="rounded-2xl bg-[#171714] p-6 text-white">
          <p className="text-sm font-bold text-orange-400">Cardápio</p>
          <h2 className="mt-1 text-xl font-black">{products.length} produtos cadastrados</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {catalog.categories.length} categorias na base atual. A próxima camada do painel permitirá criar, editar e indisponibilizar itens sem alterar o código.
          </p>
          <Link href="/admin/cardapio" className="mt-5 inline-block text-sm font-black text-orange-400 hover:text-orange-300">
            Abrir cardápio →
          </Link>
        </section>
      </div>
    </main>
  );
}
