"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatBRL } from "@/lib/format";
import type { Catalog, Product } from "@/types/catalog";
import { useCart } from "./cart-provider";

type Props = {
  catalog: Catalog;
  open: boolean;
  hoursLabel: string;
};

export function Storefront({ catalog, open, hoursLabel }: Props) {
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const cart = useCart();

  const normalized = query.trim().toLocaleLowerCase("pt-BR");

  const categories = useMemo(
    () =>
      catalog.categories
        .map((category) => ({
          ...category,
          products: category.products.filter((product) => {
            if (!normalized) return true;
            return `${product.name} ${product.description}`
              .toLocaleLowerCase("pt-BR")
              .includes(normalized);
          }),
        }))
        .filter((category) => category.products.length > 0),
    [catalog.categories, normalized],
  );

  return (
    <main className="min-h-screen pb-28">
      <section className="relative isolate overflow-hidden bg-zinc-950 text-white">
        <Image
          src="/legacy/hero-bg.webp"
          alt=""
          fill
          preload
          className="object-cover opacity-35"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/45 to-zinc-950/30" />

        <div className="container-app relative flex min-h-[390px] flex-col justify-end py-10 md:min-h-[440px]">
          <div className="flex items-end gap-5">
            <Image
              src="/legacy/hamb-1.webp"
              alt="FB Hamburgueria"
              width={112}
              height={112}
              className="h-24 w-24 rounded-3xl border border-white/15 object-cover shadow-2xl md:h-28 md:w-28"
            />
            <div className="min-w-0 pb-1">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                  open
                    ? "bg-emerald-400 text-emerald-950"
                    : "bg-rose-400 text-rose-950"
                }`}
              >
                {open ? "Aberto agora" : "Fechado agora"}
              </span>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                {catalog.business.name}
              </h1>
            </div>
          </div>

          <div className="mt-6 grid gap-2 text-sm text-zinc-200 md:grid-cols-2">
            <p>📍 {catalog.business.address}</p>
            <p>🕒 {hoursLabel}</p>
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-30 border-b border-zinc-200 bg-[#f8f7f4]/95 backdrop-blur">
        <div className="container-app py-3">
          <label className="block">
            <span className="sr-only">Buscar no cardápio</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar hambúrguer, bebida, sobremesa..."
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
            />
          </label>

          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {catalog.categories.map((category) => (
              <a
                key={category.id}
                href={`#${category.slug}`}
                className="shrink-0 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700 hover:border-zinc-300"
              >
                {category.name}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="container-app py-8 md:py-12">
        {categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <p className="font-bold">Nenhum item encontrado.</p>
            <p className="mt-1 text-sm text-zinc-500">
              Tente buscar por outro nome ou categoria.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => (
              <section
                id={category.slug}
                key={category.id}
                className="scroll-mt-36"
              >
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-600">
                      Cardápio
                    </p>
                    <h2 className="mt-1 text-2xl font-black md:text-3xl">
                      {category.name}
                    </h2>
                  </div>
                  <span className="text-sm text-zinc-500">
                    {category.products.length}{" "}
                    {category.products.length === 1 ? "item" : "itens"}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {category.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={() => cart.add(product)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {cart.itemCount > 0 && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-4 pt-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl gap-3">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="flex flex-1 items-center justify-between rounded-2xl bg-zinc-950 px-5 py-4 text-left font-bold text-white shadow-xl"
            >
              <span>
                {cart.itemCount} {cart.itemCount === 1 ? "item" : "itens"}
              </span>
              <span>{formatBRL(cart.subtotal)}</span>
            </button>
          </div>
        </div>
      )}

      {cartOpen && (
        <CartDrawer
          onClose={() => setCartOpen(false)}
          onCheckout={() => setCartOpen(false)}
        />
      )}
    </main>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: () => void;
}) {
  return (
    <article
      className={`card-shadow overflow-hidden rounded-3xl border border-zinc-100 bg-white ${
        !product.isAvailable ? "opacity-65" : ""
      }`}
    >
      <div className="flex h-full min-h-44 gap-4 p-3">
        <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 sm:h-40 sm:w-40">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 144px, 160px"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-black leading-tight">{product.name}</h3>
            {product.isFeatured && (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-900">
                Destaque
              </span>
            )}
          </div>

          <p className="mt-2 line-clamp-3 text-sm leading-5 text-zinc-500">
            {product.description}
          </p>

          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <strong className="text-lg">{formatBRL(product.price)}</strong>
            <button
              type="button"
              disabled={!product.isAvailable}
              onClick={onAdd}
              className="grid h-10 w-10 place-items-center rounded-xl bg-rose-600 text-xl font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
              aria-label={`Adicionar ${product.name}`}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function CartDrawer({
  onClose,
  onCheckout,
}: {
  onClose: () => void;
  onCheckout: () => void;
}) {
  const cart = useCart();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Carrinho"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className="ml-auto flex h-full w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-zinc-100 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-600">
              Seu pedido
            </p>
            <h2 className="text-2xl font-black">Carrinho</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-100 px-3 py-2 font-bold"
          >
            Fechar
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {cart.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-3 rounded-2xl border border-zinc-100 p-3"
            >
              <Image
                src={item.imageUrl}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{item.name}</p>
                <p className="text-sm text-zinc-500">
                  {formatBRL(item.price)}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cart.decrement(item.productId)}
                    className="h-8 w-8 rounded-lg bg-zinc-100 font-black"
                  >
                    −
                  </button>
                  <strong className="min-w-6 text-center">{item.quantity}</strong>
                  <button
                    type="button"
                    onClick={() =>
                      cart.add({
                        id: item.productId,
                        categoryId: "",
                        name: item.name,
                        slug: "",
                        description: "",
                        price: item.price,
                        imageUrl: item.imageUrl,
                        isAvailable: true,
                        isFeatured: false,
                        sortOrder: 0,
                      })
                    }
                    className="h-8 w-8 rounded-lg bg-zinc-950 font-black text-white"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => cart.remove(item.productId)}
                className="text-xs font-bold text-rose-600"
              >
                Remover
              </button>
            </div>
          ))}
        </div>

        <footer className="border-t border-zinc-100 p-5">
          <div className="mb-4 flex items-center justify-between text-lg">
            <span>Subtotal</span>
            <strong>{formatBRL(cart.subtotal)}</strong>
          </div>
          <Link
            href="/checkout"
            onClick={onCheckout}
            className="block rounded-2xl bg-rose-600 px-5 py-4 text-center font-black text-white hover:bg-rose-700"
          >
            Continuar para o checkout
          </Link>
        </footer>
      </div>
    </div>
  );
}
