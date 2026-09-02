"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronUp } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useCart } from "@/components/store/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { formatBRL } from "@/lib/format";

type CheckoutStatus =
  | { type: "idle"; message?: string }
  | { type: "loading"; message?: string }
  | { type: "error"; message: string };

type PaymentMethod = "pix" | "cash" | "card_on_delivery";

type StoreAvailability = {
  state: "checking" | "open" | "closed" | "error";
  message: string;
};

export default function CheckoutPage() {
  const cart = useCart();
  const [status, setStatus] = useState<CheckoutStatus>({ type: "idle" });
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [cashChangeFor, setCashChangeFor] = useState("");
  const [showAllItems, setShowAllItems] = useState(false);
  const [storeAvailability, setStoreAvailability] = useState<StoreAvailability>({
    state: "checking",
    message: "Verificando o horário de funcionamento...",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadStoreAvailability() {
      const result = await fetchStoreAvailability();
      if (!cancelled) setStoreAvailability(result);
    }

    loadStoreAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleItems = showAllItems ? cart.items : cart.items.slice(0, 5);
  const hiddenItemsCount = Math.max(0, cart.items.length - 5);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    if (!cart.items.length || !paymentMethod) return;

    if (storeAvailability.state !== "open") {
      setStatus({
        type: "error",
        message: storeAvailability.message || "A FB Burguer está fechada no momento.",
      });
      return;
    }

    setStatus({ type: "loading" });

    // Revalida imediatamente antes de criar a comanda. A API de pedidos
    // também faz a mesma validação de forma definitiva no servidor.
    const latestAvailability = await fetchStoreAvailability();
    setStoreAvailability(latestAvailability);
    if (latestAvailability.state !== "open") {
      setStatus({
        type: "error",
        message: latestAvailability.message,
      });
      return;
    }

    const parsedCashChange = parseMoneyInput(cashChangeFor);
    if (
      paymentMethod === "cash" &&
      parsedCashChange !== null &&
      parsedCashChange < cart.subtotal
    ) {
      setStatus({
        type: "error",
        message: "O valor informado para troco deve ser igual ou maior que o total do pedido.",
      });
      return;
    }

    const payload = {
      customerName: String(form.get("name") ?? ""),
      phone,
      address: String(form.get("address") ?? ""),
      paymentMethod,
      cashChangeFor: paymentMethod === "cash" ? parsedCashChange : null,
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
            aria-label="Voltar para o cardápio"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100"
          >
            <ChevronLeft className="h-5 w-5" />
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
        <div className="mb-5">
          <h1 className="text-2xl font-black tracking-tight">Finalizar pedido</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Revise sua sacola e informe os dados para enviar o pedido.
          </p>
        </div>


        {storeAvailability.state !== "open" && (
          <div
            className={`mb-5 rounded-2xl border p-4 text-sm leading-6 ${
              storeAvailability.state === "checking"
                ? "border-zinc-200 bg-white text-zinc-600"
                : storeAvailability.state === "closed"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <strong className="block">
              {storeAvailability.state === "checking"
                ? "Verificando horário"
                : storeAvailability.state === "closed"
                  ? "Pedidos indisponíveis agora"
                  : "Não foi possível confirmar o horário"}
            </strong>
            <span>{storeAvailability.message}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_390px] lg:items-start">
          <Card>
            <form onSubmit={submit}>
              <CardHeader>
                <h2 className="text-lg font-black">Dados para entrega</h2>
              </CardHeader>

              <CardContent className="pt-5">
                <div className="grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Nome" name="name" autoComplete="name" required />

                    <label className="grid gap-2">
                      <span className="text-sm font-bold">Telefone / WhatsApp</span>
                      <Input
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="(88) 99874-5423"
                        value={phone}
                        onChange={(event) => setPhone(formatPhoneBR(event.target.value))}
                        maxLength={15}
                        required
                      />
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold">Endereço de entrega</span>
                    <Textarea
                      name="address"
                      required
                      rows={3}
                      placeholder="Rua, número, bairro e ponto de referência"
                    />
                  </label>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold">Forma de pagamento</span>
                      <NativeSelect
                        name="paymentMethod"
                        value={paymentMethod}
                        onChange={(event) => {
                          const next = event.target.value as PaymentMethod | "";
                          setPaymentMethod(next);
                          if (next !== "cash") setCashChangeFor("");
                        }}
                        required
                      >
                        <option value="" disabled>
                          Selecionar
                        </option>
                        <option value="pix">Pix</option>
                        <option value="cash">Dinheiro</option>
                        <option value="card_on_delivery">Cartão na entrega</option>
                      </NativeSelect>
                    </label>

                    {paymentMethod === "cash" && (
                      <label className="grid gap-2">
                        <span className="text-sm font-bold">Troco para quanto?</span>
                        <Input
                          name="cashChangeFor"
                          inputMode="decimal"
                          placeholder="Ex.: 50,00"
                          value={cashChangeFor}
                          onChange={(event) => setCashChangeFor(sanitizeMoneyInput(event.target.value))}
                        />
                        <span className="text-xs text-zinc-500">
                          Deixe em branco se não precisar de troco.
                        </span>
                      </label>
                    )}
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold">Observação</span>
                    <Textarea
                      name="notes"
                      rows={3}
                      placeholder="Ex.: sem cebola, portão azul..."
                    />
                  </label>
                </div>

                {status.type === "error" && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
                    {status.message}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    !cart.items.length ||
                    !paymentMethod ||
                    status.type === "loading" ||
                    storeAvailability.state !== "open"
                  }
                  className="mt-7 min-h-14 w-full text-base font-black"
                >
                  {status.type === "loading"
                    ? "Criando comanda..."
                    : storeAvailability.state === "checking"
                      ? "Verificando horário..."
                      : storeAvailability.state !== "open"
                        ? "Estabelecimento fechado"
                        : "Enviar pedido"}
                </Button>
              </CardContent>
            </form>
          </Card>

          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader>
              <h2 className="text-lg font-black">Resumo do pedido</h2>
              {cart.items.length > 0 && (
                <p className="mt-1 text-sm text-zinc-500">
                  {cart.itemCount} {cart.itemCount === 1 ? "item" : "itens"} na sacola
                </p>
              )}
            </CardHeader>

            <CardContent className="pt-5">
              {cart.items.length === 0 ? (
                <div>
                  <p className="text-sm text-zinc-500">Sua sacola está vazia.</p>
                  <Link href="/" className="mt-3 inline-block text-sm font-bold text-[#ff6500]">
                    Voltar ao cardápio
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {visibleItems.map((item) => (
                      <div
                        key={item.productId}
                        className="flex gap-3 border-b border-zinc-100 pb-4 last:border-0 last:pb-0"
                      >
                        <Image
                          src={item.imageUrl}
                          alt=""
                          width={54}
                          height={54}
                          className="h-14 w-14 shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-bold">
                            {item.quantity}× {item.name}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500">
                            {formatBRL(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {cart.items.length > 5 && (
                    <Button
                      type="button"
                      variant="ghost"
                      aria-expanded={showAllItems}
                      onClick={() => setShowAllItems((current) => !current)}
                      className="mt-3 w-full text-[#ff6500] hover:bg-orange-50 hover:text-[#df5700]"
                    >
                      {showAllItems ? (
                        <>
                          Ver menos <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Ver mais ({hiddenItemsCount}) <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}

                  <div className="mt-5 flex justify-between border-t border-zinc-200 pt-5 text-lg">
                    <span>Total dos itens</span>
                    <strong>{formatBRL(cart.subtotal)}</strong>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

async function fetchStoreAvailability(): Promise<StoreAvailability> {
  try {
    const response = await fetch("/api/store/status", { cache: "no-store" });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result || typeof result.isOpen !== "boolean") {
      return {
        state: "error",
        message: "Não foi possível confirmar o horário da FB Burguer agora. Tente novamente em instantes.",
      };
    }

    return {
      state: result.isOpen ? "open" : "closed",
      message: result.message ?? (result.isOpen ? "Estamos aceitando pedidos." : "Estamos fechados no momento."),
    };
  } catch {
    return {
      state: "error",
      message: "Não foi possível confirmar o horário da FB Burguer agora. Tente novamente em instantes.",
    };
  }
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
      <Input name={name} autoComplete={autoComplete} required={required} />
    </label>
  );
}

function formatPhoneBR(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);
  if (number.length <= 4) return `(${ddd}) ${number}`;

  const firstBlockSize = number.length === 9 ? 5 : 4;
  return `(${ddd}) ${number.slice(0, firstBlockSize)}-${number.slice(firstBlockSize)}`;
}

function sanitizeMoneyInput(value: string) {
  const cleaned = value.replace(/[^\d,.]/g, "").replace(/\./g, ",");
  const [integer = "", ...decimalParts] = cleaned.split(",");
  const decimal = decimalParts.join("").slice(0, 2);
  return decimalParts.length ? `${integer},${decimal}` : integer;
}

function parseMoneyInput(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}
