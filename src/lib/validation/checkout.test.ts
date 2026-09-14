import { describe, expect, it } from "vitest";
import { checkoutFormSchema, orderRequestSchema } from "@/lib/validation/checkout";

describe("validação do checkout", () => {
  it("aceita um formulário válido", () => {
    const result = checkoutFormSchema.safeParse({
      customerName: "Fernando Alves",
      phone: "(88) 99874-5423",
      address: "Rua Principal, 100, Centro",
      paymentMethod: "pix",
      cashChangeFor: "",
      notes: "Sem cebola",
      website: "",
    });

    expect(result.success).toBe(true);
  });

  it("recusa telefone incompleto", () => {
    const result = checkoutFormSchema.safeParse({
      customerName: "Fernando Alves",
      phone: "8899",
      address: "Rua Principal, 100, Centro",
      paymentMethod: "pix",
      cashChangeFor: "",
      notes: "",
      website: "",
    });

    expect(result.success).toBe(false);
  });

  it("recusa pedido sem itens no backend", () => {
    const result = orderRequestSchema.safeParse({
      customerName: "Fernando Alves",
      phone: "(88) 99874-5423",
      address: "Rua Principal, 100, Centro",
      paymentMethod: "cash",
      cashChangeFor: 50,
      notes: "",
      website: "",
      items: [],
    });

    expect(result.success).toBe(false);
  });
});
