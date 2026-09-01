"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { formatBRL } from "@/lib/format";
import type { AdminOrder } from "@/types/order";

export function OrderEditor({ order }: { order: AdminOrder }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"save" | "close" | "cancel" | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState(order.paymentMethod);
  const [cashChangeFor, setCashChangeFor] = useState(
    order.cashChangeFor === null ? "" : String(order.cashChangeFor),
  );
  const editable = order.status === "pending";

  const cashChangeNumber = parseOptionalNumber(cashChangeFor);
  const estimatedChange =
    paymentMethod === "cash" && cashChangeNumber !== null
      ? Math.max(0, cashChangeNumber - order.total)
      : null;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable) return;
    setBusy("save");
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const items = order.items.map((item) => ({
      id: item.id,
      quantity: Number(form.get(`quantity:${item.id}`) ?? item.quantity),
      unitPrice: Number(form.get(`unitPrice:${item.id}`) ?? item.unitPrice),
    }));

    const response = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "update",
        customerName: String(form.get("customerName") ?? ""),
        customerPhone: String(form.get("customerPhone") ?? ""),
        address: String(form.get("address") ?? ""),
        paymentMethod,
        cashChangeFor: paymentMethod === "cash" ? cashChangeNumber : null,
        notes: String(form.get("notes") ?? ""),
        adminNotes: String(form.get("adminNotes") ?? ""),
        deliveryFee: Number(form.get("deliveryFee") ?? 0),
        discount: Number(form.get("discount") ?? 0),
        items,
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

    setMessage({ type: "success", text: "Comanda atualizada." });
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
              <h2 className="mt-1 text-xl font-black">Dados da comanda</h2>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Nome"
              name="customerName"
              defaultValue={order.customerName}
              disabled={!editable}
            />
            <Field
              label="Telefone"
              name="customerPhone"
              defaultValue={order.customerPhone}
              disabled={!editable}
            />
          </div>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold">Endereço</span>
            <textarea
              name="address"
              defaultValue={order.address}
              disabled={!editable}
              rows={3}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none disabled:bg-zinc-50"
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold">Forma informada</span>
              <select
                name="paymentMethod"
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target.value as AdminOrder["paymentMethod"],
                  )
                }
                disabled={!editable}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm disabled:bg-zinc-50"
              >
                <option value="pix">Pix direto com a loja</option>
                <option value="cash">Dinheiro</option>
                <option value="card_on_delivery">Cartão na entrega</option>
              </select>
            </label>
            <Field
              label="Taxa de entrega"
              name="deliveryFee"
              type="number"
              step="0.01"
              min="0"
              defaultValue={String(order.deliveryFee)}
              disabled={!editable}
            />
          </div>

          {paymentMethod === "cash" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-bold">Cliente precisa de troco para</span>
                <input
                  name="cashChangeFor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cashChangeFor}
                  onChange={(event) => setCashChangeFor(event.target.value)}
                  disabled={!editable}
                  placeholder="Ex.: 50,00"
                  className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-zinc-50"
                />
              </label>

              <div className="rounded-xl bg-orange-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                  Troco estimado
                </p>
                <p className="mt-1 text-xl font-black text-zinc-950">
                  {estimatedChange === null ? "—" : formatBRL(estimatedChange)}
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Cálculo administrativo com base no total atual da comanda.
                </p>
              </div>
            </div>
          )}

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold">Observação do cliente</span>
            <textarea
              name="notes"
              defaultValue={order.notes}
              disabled={!editable}
              rows={3}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none disabled:bg-zinc-50"
            />
          </label>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold">Anotação administrativa</span>
            <textarea
              name="adminNotes"
              defaultValue={order.adminNotes}
              disabled={!editable}
              rows={3}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none disabled:bg-zinc-50"
              placeholder="Ex.: cliente confirmou por telefone"
            />
          </label>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6">
          <p className="text-sm font-bold text-zinc-500">Itens</p>
          <h2 className="mt-1 text-xl font-black">Produtos da comanda</h2>

          <div className="mt-5 divide-y divide-zinc-100">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 py-4 first:pt-0 sm:grid-cols-[1fr_100px_130px] sm:items-end"
              >
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Subtotal atual: {formatBRL(item.total)}
                  </p>
                </div>
                <Field
                  label="Qtd."
                  name={`quantity:${item.id}`}
                  type="number"
                  min="1"
                  max="100"
                  defaultValue={String(item.quantity)}
                  disabled={!editable}
                  compact
                />
                <Field
                  label="Valor un."
                  name={`unitPrice:${item.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={String(item.unitPrice)}
                  disabled={!editable}
                  compact
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="h-fit space-y-4 xl:sticky xl:top-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-black">Resumo</h2>
          <div className="mt-4 space-y-3 text-sm">
            <SummaryRow label="Subtotal" value={formatBRL(order.subtotal)} />
            <SummaryRow label="Entrega" value={formatBRL(order.deliveryFee)} />
            <div className="grid gap-2">
              <Field
                label="Desconto"
                name="discount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={String(order.discount)}
                disabled={!editable}
                compact
              />
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-4 text-lg">
              <strong>Total</strong>
              <strong>{formatBRL(order.total)}</strong>
            </div>
            {paymentMethod === "cash" && order.cashChangeFor !== null && !editable && (
              <>
                <SummaryRow label="Troco para" value={formatBRL(order.cashChangeFor)} />
                <SummaryRow
                  label="Troco estimado"
                  value={formatBRL(Math.max(0, order.cashChangeFor - order.total))}
                />
              </>
            )}
          </div>
          {editable && (
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Ao alterar itens, taxa ou desconto, salve a comanda para o total ser recalculado no servidor.
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
              disabled={Boolean(busy)}
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3.5 font-black text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
            >
              {busy === "save" ? "Salvando..." : "Salvar alterações"}
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

function Field({
  label,
  name,
  defaultValue,
  disabled,
  type = "text",
  step,
  min,
  max,
  compact = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled?: boolean;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
  compact?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className={`${compact ? "text-xs" : "text-sm"} font-bold`}>
        {label}
      </span>
      <input
        name={name}
        type={type}
        step={step}
        min={min}
        max={max}
        defaultValue={defaultValue}
        disabled={disabled}
        required
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

function parseOptionalNumber(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
