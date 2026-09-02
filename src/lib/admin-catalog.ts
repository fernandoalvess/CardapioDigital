import { getAdminContext } from "@/lib/admin-auth";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

export type AdminProduct = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
};

export async function getAdminCatalog() {
  const context = await getAdminContext();
  if (!context) {
    return { categories: [] as AdminCategory[], products: [] as AdminProduct[] };
  }

  const [{ data: categories }, { data: products }] = await Promise.all([
    context.supabase
      .from("categories")
      .select("id,name,slug,sort_order,is_active")
      .eq("business_id", context.business.id)
      .order("sort_order")
      .order("name"),
    context.supabase
      .from("products")
      .select(
        "id,category_id,name,slug,description,price,image_url,is_available,is_featured,is_active,sort_order",
      )
      .eq("business_id", context.business.id)
      .order("sort_order")
      .order("name"),
  ]);

  return {
    categories: (categories ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      sortOrder: category.sort_order,
      isActive: category.is_active,
    })),
    products: (products ?? []).map((product) => ({
      id: product.id,
      categoryId: product.category_id,
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      price: Number(product.price),
      imageUrl: product.image_url ?? "",
      isAvailable: product.is_available,
      isFeatured: product.is_featured,
      isActive: product.is_active,
      sortOrder: product.sort_order,
    })),
  };
}

export async function getAvailableProductsForOrder() {
  const context = await getAdminContext();
  if (!context) return [];

  const { data: categoryRows } = await context.supabase
    .from("categories")
    .select("id")
    .eq("business_id", context.business.id)
    .eq("is_active", true);

  const categoryIds = (categoryRows ?? []).map((category) => category.id);
  if (categoryIds.length === 0) return [];

  const { data } = await context.supabase
    .from("products")
    .select("id,name,price")
    .eq("business_id", context.business.id)
    .eq("is_active", true)
    .eq("is_available", true)
    .in("category_id", categoryIds)
    .order("name");

  return (data ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    price: Number(product.price),
  }));
}
