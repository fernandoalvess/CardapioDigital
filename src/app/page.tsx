import { Storefront } from "@/components/store/storefront";
import { isStoreOpenNow } from "@/lib/business-hours";
import { getCatalog } from "@/lib/catalog";

export default async function Home() {
  const catalog = await getCatalog();
  const status = isStoreOpenNow(catalog.business.timezone);

  return (
    <Storefront
      catalog={catalog}
      open={status.isOpen}
      hoursLabel={status.label}
    />
  );
}
