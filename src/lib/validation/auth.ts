import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .email("Informe um e-mail válido.")
    .max(254, "O e-mail deve ter no máximo 254 caracteres."),
  password: z
    .string()
    .min(1, "Informe sua senha.")
    .max(256, "A senha deve ter no máximo 256 caracteres."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
