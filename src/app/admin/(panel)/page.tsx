import { getCatalog } from "@/lib/catalog";

export default async function AdminDashboard() {
  const catalog = await getCatalog();
  const products = catalog.categories.flatMap((category) => category.products);
  const available = products.filter((product) => product.isAvailable).length;

  const cards = [
    { label: "Produtos", value: String(products.length), note: "migrados da V1" },
    { label: "Disponíveis", value: String(available), note: "no cardápio" },
    { label: "Categorias", value: String(catalog.categories.length), note: "organizadas" },
    { label: "Pedidos hoje", value: "—", note: "após conectar o banco" },
  ];

  return (
    <main>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-600">
        Visão geral
      </p>
      <h1 className="mt-1 text-3xl font-black">Dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
        A fundação do painel já está criada. Os indicadores financeiros serão alimentados pela tabela de pedidos assim que o Supabase for conectado.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-zinc-500">{card.label}</p>
            <p className="mt-3 text-4xl font-black">{card.value}</p>
            <p className="mt-2 text-xs text-zinc-400">{card.note}</p>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-3xl bg-zinc-950 p-6 text-white md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-400">
          Próxima entrega
        </p>
        <h2 className="mt-2 text-2xl font-black">CRUD de cardápio</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Criar, editar, indisponibilizar, ordenar e excluir produtos e categorias sem alterar código ou fazer novo deploy.
        </p>
      </section>
    </main>
  );
}
