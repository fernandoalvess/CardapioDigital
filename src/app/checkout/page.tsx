"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart } from "@/components/store/cart-provider";
import { formatBRL } from "@/lib/format";

type CheckoutStatus =
  | { type: "idle"; message?: string }
  | { type: "loading"; message?: string }
  | { type: "success"; message: string; orderId: string }
  | { type: "error"; message: string };

export default function CheckoutPage() {
  const cart = useCart();
  const [status, setStatus] = useState<CheckoutStatus>({ type: "idle" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart.items.length) return;

    setStatus({ type: "loading" });

    const form = new FormData(event.currentTarget);
    const payload = {
      customerName: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      address: String(form.get("address") ?? ""),
      paymentMethod: String(form.get("paymentMethod") ?? "pix"),
      notes: String(form.get("notes") ?? ""),
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus({
        type: "error",
        message:
          result.error ??
          "O backend de pedidos ainda não está conectado ao Supabase.",
      });
      return;
    }

    cart.clear();
    setStatus({
      type: "success",
      message: "Pedido registrado com sucesso.",
      orderId: result.orderId,
    });
  }

  if (status.type === "success") {
    return (
      <main className="container-app grid min-h-screen place-items-center py-10">
        <div className="card-shadow w-full max-w-lg rounded-3xl bg-white p-8 text-center">
          <span className="text-5xl">✅</span>
          <h1 className="mt-5 text-3xl font-black">Pedido recebido!</h1>
          <p className="mt-3 text-zinc-500">{status.message}</p>
          <p className="mt-4 rounded-2xl bg-zinc-100 p-3 font-mono text-sm">
            {status.orderId}
          </p>
          <Link
            href="/"
            className="mt-6 block rounded-2xl bg-zinc-950 px-5 py-4 font-bold text-white"
          >
            Voltar ao cardápio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container-app py-8 md:py-12">
      <Link href="/" className="text-sm font-bold text-rose-600">
        ← Voltar ao cardápio
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <form onSubmit={submit} className="card-shadow rounded-3xl bg-white p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-600">
            Finalização
          </p>
          <h1 className="mt-1 text-3xl font-black">Checkout</h1>

          <div className="mt-8 grid gap-5">
            <Field label="Nome" name="name" autoComplete="name" required />
            <Field label="Telefone / WhatsApp" name="phone" autoComplete="tel" required />
            <label className="grid gap-2">
              <span className="text-sm font-bold">Endereço de entrega</span>
              <textarea
                name="address"
                required
                rows={3}
                className="rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                placeholder="Rua, número, bairro e referência"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold">Pagamento</span>
              <select
                name="paymentMethod"
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none"
                defaultValue="pix"
              >
                <option value="pix">Pix</option>
                <option value="cash">Dinheiro</option>
                <option value="card_on_delivery">Cartão na entrega</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold">Observação</span>
              <textarea
                name="notes"
                rows={2}
                className="rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                placeholder="Ex.: sem cebola"
              />
            </label>
          </div>

          {status.type === "error" && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={!cart.items.length || status.type === "loading"}
            className="mt-7 w-full rounded-2xl bg-rose-600 px-5 py-4 font-black text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {status.type === "loading" ? "Registrando..." : "Confirmar pedido"}
          </button>
        </form>

        <aside className="h-fit rounded-3xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-black">Resumo</h2>
          <div className="mt-5 space-y-4">
            {cart.items.length === 0 ? (
              <p className="text-sm text-zinc-500">Seu carrinho está vazio.</p>
            ) : (
              cart.items.map((item) => (
                <div key={item.productId} className="flex justify-between gap-4 text-sm">
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <strong>{formatBRL(item.price * item.quantity)}</strong>
                </div>
              ))
            )}
          </div>
          <div className="mt-6 flex justify-between border-t border-zinc-200 pt-5 text-lg">
            <span>Subtotal</span>
            <strong>{formatBRL(cart.subtotal)}</strong>
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            A taxa de entrega será incorporada na próxima etapa, com zonas configuráveis pelo painel.
          </p>
        </aside>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  autoComplete,
  required,
}: {
  label: string;
  name: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold">{label}</span>
      <input
        name={name}
        autoComplete={autoComplete}
        required={required}
        className="rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
      />
    </label>
  );
}
