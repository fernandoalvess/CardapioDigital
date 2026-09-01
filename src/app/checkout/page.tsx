"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart } from "@/components/store/cart-provider";
import { formatBRL } from "@/lib/format";
import { StoreFooter } from "@/components/store/store-footer";

type CheckoutStatus =
  | { type: "idle"; message?: string }
  | { type: "loading"; message?: string }
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
          "Não foi possível registrar a comanda. O pedido não foi encaminhado ao WhatsApp.",
      });
      return;
    }

    if (!result.whatsappUrl) {
      setStatus({
        type: "error",
        message:
          "A comanda foi criada, mas o WhatsApp da loja não está configurado.",
      });
      return;
    }

    cart.clear();
    window.location.assign(result.whatsappUrl);
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="container-app flex h-16 items-center gap-3">
          <Link
            href="/"
            aria-label="Voltar ao cardápio"
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
          >
            ←
          </Link>
          <Image
            src="/brand/logo.webp"
            alt="FB Burguer"
            width={38}
            height={38}
            className="h-9 w-9 rounded-lg object-cover"
          />
          <strong>FB Burguer</strong>
        </div>
      </header>

      <div className="container-app py-7 md:py-10">
        <div className="mb-4">
          <h1 className="mt-1 text-2xl font-black md:text-3xl text-[#ff6500]">
            Finalizar pedido
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
          <form
            onSubmit={submit}
            className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-7"
          >
            <h2 className="text-lg font-black">Informe seus dados</h2>

            <div className="mt-5 grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nome" name="name" autoComplete="name" required />
                <Field
                  label="Telefone / WhatsApp"
                  name="phone"
                  autoComplete="tel"
                  required
                />
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-bold">Endereço de entrega</span>
                <textarea
                  name="address"
                  required
                  rows={3}
                  className="rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  placeholder="Rua, número, bairro e ponto de referência"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold">Forma de pagamento</span>
                <select
                  name="paymentMethod"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
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
                  rows={3}
                  className="rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  placeholder="Ex.: sem cebola, troco para R$ 50, portão azul..."
                />
              </label>
            </div>

            {status.type === "error" && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={!cart.items.length || status.type === "loading"}
              className="mt-7 w-full rounded-xl bg-[#ff6500] px-5 py-4 font-black text-white transition hover:bg-[#df5700] disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {status.type === "loading"
                ? "Criando comanda..."
                : "Enviar pedido"}
            </button>
          </form>

          <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-5 md:p-6">
            <h2 className="text-lg font-black">Resumo do pedido</h2>
            <div className="mt-5 space-y-4">
              {cart.items.length === 0 ? (
                <div>
                  <p className="text-sm text-zinc-500">
                    Sua sacola está vazia.
                  </p>
                  <Link
                    href="/"
                    className="mt-3 inline-block text-sm font-bold text-[#ff6500]"
                  >
                    Voltar ao cardápio
                  </Link>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-3 border-b border-zinc-100 pb-4 last:border-0"
                  >
                    <Image
                      src={item.imageUrl}
                      alt=""
                      width={54}
                      height={54}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">
                        {item.quantity}× {item.name}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {formatBRL(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-5 flex justify-between border-t border-zinc-200 pt-5 text-lg">
              <span>Total dos itens</span>
              <strong>{formatBRL(cart.subtotal)}</strong>
            </div>
          </aside>
        </div>
      </div>
      <StoreFooter />
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
        className="rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      />
    </label>
  );
}
