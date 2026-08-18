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
    <main className="min-h-screen pb-2">
      <section className="border-b border-zinc-200 bg-white">
        <div className="container-app py-7 md:py-9">
          <div className="flex items-start gap-4 md:gap-6">
            <Image
              src="/brand/logo.webp"
              alt="Logo da FB Burguer"
              width={120}
              height={120}
              priority
              className="h-24 w-24 shrink-0 rounded-2xl border border-zinc-200 object-cover md:h-28 md:w-28"
            />

            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                  {catalog.business.name}
                </h1>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
                    open
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {open ? "Aberto" : "Fechado"}
                </span>
              </div>

              <p className="mt-2 text-sm text-zinc-600">
                {catalog.business.address}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600">
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon /> {hoursLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="container-app py-3">
          <label className="relative block">
            <span className="pointer-events-none absolute inset-y-0 left-4 grid place-items-center text-zinc-400">
              <SearchIcon />
            </span>
            <span className="sr-only">Buscar no cardápio</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busque por um item do cardápio"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <nav className="mt-3 flex gap-1 overflow-x-auto pb-1">
            {catalog.categories.map((category) => (
              <a
                key={category.id}
                href={`#${category.slug}`}
                className="shrink-0 rounded-full px-4 py-2 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
              >
                {category.name}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="container-app py-7 md:py-10">
        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <p className="font-bold">Nenhum item encontrado.</p>
            <p className="mt-1 text-sm text-zinc-500">
              Tente buscar por outro nome ou categoria.
            </p>
          </div>
        ) : (
          <div className="space-y-9">
            {categories.map((category) => (
              <section
                id={category.slug}
                key={category.id}
                className="scroll-mt-36"
              >
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black md:text-2xl">
                      {category.name}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {category.products.length}{" "}
                      {category.products.length === 1 ? "item" : "itens"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
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
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="mx-auto flex w-full max-w-2xl items-center justify-between rounded-xl bg-[#ff6500] px-5 py-4 text-left font-black text-white shadow-lg transition hover:bg-[#df5700]"
          >
            <span>
              Ver pedido · {cart.itemCount}{" "}
              {cart.itemCount === 1 ? "item" : "itens"}
            </span>
            <span>{formatBRL(cart.subtotal)}</span>
          </button>
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
      className={`min-h-[150px] rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 ${
        !product.isAvailable ? "opacity-60" : ""
      }`}
    >
      <div className="flex h-full gap-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold leading-tight">{product.name}</h3>
            {product.isFeatured && (
              <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-orange-700">
                Destaque
              </span>
            )}
          </div>

          <p className="mt-2 line-clamp-3 text-sm leading-5 text-zinc-500">
            {product.description}
          </p>

          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
            <div>
              <strong className="text-base">{formatBRL(product.price)}</strong>
              {!product.isAvailable && (
                <p className="mt-1 text-xs font-bold text-red-600">
                  Indisponível
                </p>
              )}
            </div>
            <AddButton
              disabled={!product.isAvailable}
              onClick={onAdd}
              name={product.name}
            />
          </div>
        </div>

        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-32 sm:w-32">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="128px"
          />
        </div>
      </div>
    </article>
  );
}

function AddButton({
  disabled,
  onClick,
  name,
}: {
  disabled: boolean;
  onClick: () => void;
  name: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full border border-orange-200 bg-white text-xl font-bold text-[#ff6500] transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-300"
      aria-label={`Adicionar ${name}`}
    >
      +
    </button>
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
      className="fixed inset-0 z-50 flex items-end bg-black/45 sm:items-stretch sm:justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Seu pedido"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none">
        <header className="flex items-center justify-between border-b border-zinc-100 p-5">
          <div>
            <p className="text-sm font-bold text-[#ff6500]">Seu pedido</p>
            <h2 className="text-xl font-black">Sacola</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-bold text-zinc-500 hover:bg-zinc-100"
          >
            Fechar
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {cart.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-3 border-b border-zinc-100 pb-4 last:border-0"
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
                <p className="mt-1 text-sm text-zinc-500">
                  {formatBRL(item.price * item.quantity)}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cart.decrement(item.productId)}
                    className="h-8 w-8 rounded-full border border-zinc-200 font-black"
                  >
                    −
                  </button>
                  <strong className="min-w-6 text-center">
                    {item.quantity}
                  </strong>
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
                    className="h-8 w-8 rounded-full border border-orange-200 font-black text-[#ff6500]"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => cart.remove(item.productId)}
                className="text-xs font-bold text-zinc-400 hover:text-red-600"
              >
                Remover
              </button>
            </div>
          ))}
        </div>

        <footer className="border-t border-zinc-100 p-5">
          <div className="mb-4 flex items-center justify-between text-lg">
            <span>Total dos itens</span>
            <strong>{formatBRL(cart.subtotal)}</strong>
          </div>
          <Link
            href="/checkout"
            onClick={onCheckout}
            className="block rounded-xl bg-[#ff6500] px-5 py-4 text-center font-black text-white transition hover:bg-[#df5700]"
          >
            Continuar
          </Link>
        </footer>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
