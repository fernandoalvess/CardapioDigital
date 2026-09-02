import { CatalogManager } from "@/components/admin/catalog-manager";
import { getAdminCatalog } from "@/lib/admin-catalog";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
  const catalog = await getAdminCatalog();
  return <CatalogManager categories={catalog.categories} products={catalog.products} />;
}
