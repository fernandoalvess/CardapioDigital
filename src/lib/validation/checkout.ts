import { z } from "zod";

export const paymentMethodSchema = z.enum(["pix", "cash", "card_on_delivery"], {
  message: "Selecione uma forma de pagamento.",
});

const customerOrderBaseSchema = z.object({
  customerName: z.string().trim().min(2, "Informe seu nome.").max(120),
  phone: z
    .string()
    .trim()
    .min(10, "Informe um telefone válido.")
    .max(20)
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length === 10 || digits.length === 11;
    }, "Informe um telefone válido."),
  address: z.string().trim().min(5, "Informe o endereço de entrega.").max(500),
  paymentMethod: paymentMethodSchema,
});

export const checkoutFormSchema = customerOrderBaseSchema.extend({
  cashChangeFor: z.string().max(20),
  notes: z.string().trim().max(500, "A observação deve ter no máximo 500 caracteres."),
  website: z.string().max(0).optional(),
});

export const orderRequestSchema = customerOrderBaseSchema.extend({
  cashChangeFor: z.number().min(0).max(100000).nullable().optional().default(null),
  notes: z.string().trim().max(500).optional().default(""),
  website: z.string().max(0).optional().default(""),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(50),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
