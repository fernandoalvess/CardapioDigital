import { StoreFooter } from "@/components/store/store-footer";
import { Storefront } from "@/components/store/storefront";
import {
  getBusinessStoreStatus,
  getFallbackStoreStatus,
} from "@/lib/business-hours";
import { getCatalog } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const catalog = await getCatalog();
  let status = getFallbackStoreStatus(catalog.business.timezone);

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      status = await getBusinessStoreStatus(
        supabase,
        catalog.business.id,
        catalog.business.timezone,
      );
    } catch {
      status = {
        isOpen: false,
        label: "Horário indisponível",
        message: "Não foi possível confirmar o horário da FB Burguer agora.",
      };
    }
  }

  return (
    <>
      <Storefront
        catalog={catalog}
        open={status.isOpen}
        hoursLabel={status.label}
        closedMessage={status.message}
      />
      <StoreFooter />
    </>
  );
}
