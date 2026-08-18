import Image from "next/image";
import { getCatalog } from "@/lib/catalog";
import { formatBRL } from "@/lib/format";

export default async function AdminCatalogPage() {
  const catalog = await getCatalog();

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6500]">
            Gestão
          </p>
          <h1 className="mt-1 text-3xl font-black">Cardápio</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Visualização da migração inicial dos produtos da versão antiga.
          </p>
        </div>
        <button
          disabled
          className="cursor-not-allowed rounded-2xl bg-zinc-300 px-5 py-3 text-sm font-black text-zinc-500"
          title="Será habilitado na etapa de CRUD"
        >
          + Novo produto
        </button>
      </div>

      <div className="mt-8 space-y-8">
        {catalog.categories.map((category) => (
          <section key={category.id} className="rounded-3xl bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">{category.name}</h2>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600">
                {category.products.length} itens
              </span>
            </div>

            <div className="mt-5 divide-y divide-zinc-100">
              {category.products.map((product) => (
                <div key={product.id} className="flex items-center gap-4 py-4">
                  <Image
                    src={product.imageUrl}
                    alt=""
                    width={72}
                    height={72}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{product.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {formatBRL(product.price)}
                    </p>
                  </div>
                  <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 sm:inline-flex">
                    Disponível
                  </span>
                  <button
                    disabled
                    className="cursor-not-allowed rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-400"
                  >
                    Editar
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
