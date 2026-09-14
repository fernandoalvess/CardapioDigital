import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria.").max(80),
  sortOrder: z.number().int().min(0).max(9999),
  isActive: z.boolean(),
});

export const categoryPatchSchema = categorySchema.partial();

export const productSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do produto.").max(120),
  description: z.string().trim().max(500),
  price: z.number().min(0, "O preço não pode ser negativo.").max(100000),
  categoryId: z.string().uuid("Selecione uma categoria."),
  imageUrl: z.string().trim().max(1000),
  isAvailable: z.boolean(),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

export const productPatchSchema = productSchema.partial();

export type CategoryFormValues = z.infer<typeof categorySchema>;
export type ProductFormValues = z.infer<typeof productSchema>;
