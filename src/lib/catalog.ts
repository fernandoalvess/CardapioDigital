import { seedCatalog } from "@/data/seed-catalog";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Catalog, Category, Product } from "@/types/catalog";

type ProductRow = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export async function getCatalog(): Promise<Catalog> {
  if (!isSupabaseConfigured) {
    return seedCatalog;
  }

  try {
    const supabase = await createClient();
    const slug = process.env.NEXT_PUBLIC_BUSINESS_SLUG ?? "fb-burguer";

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id,name,slug,address,whatsapp,timezone")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (businessError || !business) return seedCatalog;

    const [{ data: categoryRows }, { data: productRows }] = await Promise.all([
      supabase
        .from("categories")
        .select("id,name,slug,sort_order")
        .eq("business_id", business.id)
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("products")
        .select(
          "id,category_id,name,slug,description,price,image_url,is_available,is_featured,sort_order",
        )
        .eq("business_id", business.id)
        .order("sort_order"),
    ]);

    const products = (productRows ?? []).map(
      (row: ProductRow): Product => ({
        id: row.id,
        categoryId: row.category_id,
        name: row.name,
        slug: row.slug,
        description: row.description ?? "",
        price: Number(row.price),
        imageUrl: row.image_url ?? "/legacy/hamb-1.webp",
        isAvailable: row.is_available,
        isFeatured: row.is_featured,
        sortOrder: row.sort_order,
      }),
    );

    const categories = (categoryRows ?? []).map(
      (row: CategoryRow): Category => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        sortOrder: row.sort_order,
        products: products.filter((product) => product.categoryId === row.id),
      }),
    );

    return {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        address: business.address ?? "",
        whatsapp: business.whatsapp ?? "",
        timezone: business.timezone ?? "America/Fortaleza",
      },
      categories,
    };
  } catch {
    return seedCatalog;
  }
}
