import type { PaymentMethod } from "@/types/order";

export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export function paymentMethodLabel(method: PaymentMethod) {
  if (method === "cash") return "Dinheiro";
  if (method === "card_on_delivery") return "Cartão na entrega";
  return "Pix";
}
