"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { formatBRL } from "@/lib/format";
import type { AdminOrder } from "@/types/order";

type ProductOption = {
  id: string;
  name: string;
  price: number;
};

type EditableItem = {
  key: string;
  orderItemId: string | null;
  productId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
};

export function OrderEditor({
  order,
  availableProducts,
}: {
  order: AdminOrder;
  availableProducts: ProductOption[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"save" | "close" | "cancel" | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [items, setItems] = useState<EditableItem[]>(
    order.items.map((item) => ({
      key: item.id,
      orderItemId: item.id,
      productId: item.productId,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    })),
  );
  const [selectedProductId, setSelectedProductId] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(String(order.deliveryFee));
  const [discount, setDiscount] = useState(String(order.discount));
  const [adminNotes, setAdminNotes] = useState(order.adminNotes);
  const editable = order.status === "pending";

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );
  const deliveryFeeNumber = parseNumber(deliveryFee);
  const discountNumber = parseNumber(discount);
  const estimatedTotal = Math.max(0, subtotal + deliveryFeeNumber - discountNumber);
  const estimatedChange =
    order.paymentMethod === "cash" && order.cashChangeFor !== null
      ? Math.max(0, order.cashChangeFor - estimatedTotal)
      : null;

  function changeQuantity(key: string, nextQuantity: number) {
    setItems((current) =>
      current.map((item) =>
        item.key === key
          ? { ...item, quantity: Math.max(1, Math.min(100, nextQuantity)) }
          : item,
      ),
    );
  }

  function removeItem(key: string) {
    if (items.length <= 1) {
      setMessage({
        type: "error",
        text: "A comanda precisa permanecer com pelo menos um item.",
      });
      return;
    }
    setItems((current) => current.filter((item) => item.key !== key));
  }

  function addProduct() {
    const product = availableProducts.find((item) => item.id === selectedProductId);
    if (!product) return;

    const existing = items.find((item) => item.productId === product.id);
    if (existing) {
      changeQuantity(existing.key, existing.quantity + 1);
    } else {
      setItems((current) => [
        ...current,
        {
          key: `new:${crypto.randomUUID()}`,
          orderItemId: null,
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: 1,
        },
      ]);
    }

    setSelectedProductId("");
    setMessage(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable || items.length === 0) return;
    setBusy("save");
    setMessage(null);

    const response = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "update",
        adminNotes,
        deliveryFee: deliveryFeeNumber,
        discount: discountNumber,
        items: items.map((item) => ({
          orderItemId: item.orderItemId,
          productId: item.productId,
          quantity: item.quantity,
        })),
      }),
    });

    const result = await response.json().catch(() => ({}));
    setBusy(null);

    if (!response.ok) {
      setMessage({
        type: "error",
        text: result.error ?? "Não foi possível salvar a comanda.",
      });
      return;
    }

    setMessage({ type: "success", text: "Pedido da comanda atualizado." });
    router.refresh();
  }

  async function runAction(action: "close" | "cancel") {
    const question =
      action === "close"
        ? "Fechar esta comanda e contabilizar como venda confirmada?"
        : "Cancelar esta comanda? Ela não será contabilizada como venda.";
    if (!window.confirm(question)) return;

    setBusy(action);
    setMessage(null);

    const response = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const result = await response.json().catch(() => ({}));
    setBusy(null);

    if (!response.ok) {
      setMessage({
        type: "error",
        text: result.error ?? "Não foi possível atualizar a comanda.",
      });
      return;
    }

    router.push("/admin/comandas");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-zinc-500">Cliente</p>
              <h2 className="mt-1 text-xl font-black">Dados informados no pedido</h2>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <ReadOnlyInfo label="Nome" value={order.customerName} />
            <ReadOnlyInfo label="Telefone" value={order.customerPhone} />
          </div>
          <div className="mt-4">
            <ReadOnlyInfo label="Endereço" value={order.address} multiline />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ReadOnlyInfo label="Forma de pagamento" value={paymentLabel(order.paymentMethod)} />
            {order.paymentMethod === "cash" && order.cashChangeFor !== null ? (
              <ReadOnlyInfo label="Troco para" value={formatBRL(order.cashChangeFor)} />
            ) : (
              <ReadOnlyInfo label="Troco" value="Não informado" />
            )}
          </div>
          <div className="mt-4">
            <ReadOnlyInfo
              label="Observação do cliente"
              value={order.notes || "Nenhuma observação."}
              multiline
            />
          </div>

          <p className="mt-4 rounded-xl bg-zinc-50 px-4 py-3 text-xs leading-5 text-zinc-500">
            Esses dados representam o que o cliente informou ao finalizar o pedido e ficam preservados na comanda.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-zinc-500">Pedido</p>
              <h2 className="mt-1 text-xl font-black">Itens da comanda</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Ajuste aqui quando o cliente pedir para adicionar, remover ou alterar quantidades.
              </p>
            </div>
          </div>

          {editable && (
            <div className="mt-5 flex flex-col gap-2 rounded-2xl bg-orange-50 p-4 sm:flex-row">
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-orange-200 bg-white px-3 text-sm outline-none focus:border-orange-400"
              >
                <option value="">Selecionar produto para adicionar</option>
                {availableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {formatBRL(product.price)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addProduct}
                disabled={!selectedProductId}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ff6500] px-4 text-sm font-black text-white transition hover:bg-[#e85b00] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Adicionar item
              </button>
            </div>
          )}

          <div className="mt-5 divide-y divide-zinc-100">
            {items.map((item) => (
              <div
                key={item.key}
                className="grid gap-4 py-4 first:pt-0 sm:grid-cols-[1fr_auto_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="font-bold text-zinc-950">{item.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {formatBRL(item.unitPrice)} cada · {formatBRL(item.unitPrice * item.quantity)}
                  </p>
                </div>

                <div className="inline-flex h-10 w-fit items-center rounded-xl border border-zinc-200 bg-white">
                  <button
                    type="button"
                    aria-label={`Diminuir ${item.name}`}
                    disabled={!editable || item.quantity <= 1}
                    onClick={() => changeQuantity(item.key, item.quantity - 1)}
                    className="inline-flex h-10 w-10 items-center justify-center text-zinc-600 disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-9 text-center text-sm font-black">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Aumentar ${item.name}`}
                    disabled={!editable || item.quantity >= 100}
                    onClick={() => changeQuantity(item.key, item.quantity + 1)}
                    className="inline-flex h-10 w-10 items-center justify-center text-zinc-600 disabled:opacity-30"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {editable && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 px-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sm:hidden">Remover</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6">
          <p className="text-sm font-bold text-zinc-500">Ajustes internos</p>
          <h2 className="mt-1 text-xl font-black">Valores e anotação</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Taxa de entrega"
              value={deliveryFee}
              onChange={setDeliveryFee}
              disabled={!editable}
            />
            <NumberField
              label="Desconto"
              value={discount}
              onChange={setDiscount}
              disabled={!editable}
            />
          </div>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold">Anotação administrativa</span>
            <textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              disabled={!editable}
              rows={3}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-zinc-50"
              placeholder="Ex.: cliente pediu mais 1 refrigerante pelo WhatsApp"
            />
          </label>
        </section>
      </div>

      <aside className="h-fit space-y-4 xl:sticky xl:top-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-black">Resumo atualizado</h2>
          <div className="mt-4 space-y-3 text-sm">
            <SummaryRow label="Subtotal" value={formatBRL(subtotal)} />
            <SummaryRow label="Entrega" value={formatBRL(deliveryFeeNumber)} />
            <SummaryRow label="Desconto" value={`- ${formatBRL(discountNumber)}`} />
            <div className="flex justify-between border-t border-zinc-200 pt-4 text-lg">
              <strong>Total</strong>
              <strong>{formatBRL(estimatedTotal)}</strong>
            </div>
            {estimatedChange !== null && (
              <>
                <SummaryRow label="Troco para" value={formatBRL(order.cashChangeFor ?? 0)} />
                <SummaryRow label="Troco estimado" value={formatBRL(estimatedChange)} />
              </>
            )}
          </div>
          {editable && (
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              O total acima é uma prévia. Ao salvar, o servidor recalcula a comanda e valida os itens adicionados.
            </p>
          )}
        </section>

        {message && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {editable && (
          <div className="grid gap-3">
            <button
              type="submit"
              disabled={Boolean(busy) || items.length === 0}
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3.5 font-black text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
            >
              {busy === "save" ? "Salvando..." : "Salvar alterações do pedido"}
            </button>
            <button
              type="button"
              onClick={() => runAction("close")}
              disabled={Boolean(busy)}
              className="rounded-xl bg-emerald-600 px-5 py-3.5 font-black text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy === "close" ? "Fechando..." : "Fechar comanda e confirmar venda"}
            </button>
            <button
              type="button"
              onClick={() => runAction("cancel")}
              disabled={Boolean(busy)}
              className="rounded-xl px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {busy === "cancel" ? "Cancelando..." : "Cancelar comanda"}
            </button>
          </div>
        )}
      </aside>
    </form>
  );
}

function ReadOnlyInfo({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-zinc-800 ${multiline ? "whitespace-pre-line" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold">{label}</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-zinc-50"
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ status }: { status: AdminOrder["status"] }) {
  if (status === "completed") {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
        Venda confirmada
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-black text-zinc-600">
        Cancelada
      </span>
    );
  }
  return (
    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
      Comanda aberta
    </span>
  );
}

function paymentLabel(method: AdminOrder["paymentMethod"]) {
  if (method === "pix") return "Pix direto com a loja";
  if (method === "cash") return "Dinheiro";
  return "Cartão na entrega";
}

function parseNumber(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
