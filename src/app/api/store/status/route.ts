import { NextResponse } from "next/server";
import {
  getBusinessStoreStatus,
  getFallbackStoreStatus,
} from "@/lib/business-hours";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseSecret } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" };

  if (!hasSupabaseSecret) {
    const status = getFallbackStoreStatus();
    return NextResponse.json(status, { headers: noStoreHeaders });
  }

  const supabase = createAdminClient();
  const businessSlug = process.env.NEXT_PUBLIC_BUSINESS_SLUG ?? "fb-burguer";

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id,timezone")
    .eq("slug", businessSlug)
    .eq("is_active", true)
    .single();

  if (businessError || !business) {
    return NextResponse.json(
      {
        isOpen: false,
        label: "Horário indisponível",
        message: "Não foi possível confirmar o horário da FB Burguer agora.",
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  try {
    const status = await getBusinessStoreStatus(
      supabase,
      business.id,
      business.timezone ?? "America/Fortaleza",
    );
    return NextResponse.json(status, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json(
      {
        isOpen: false,
        label: "Horário indisponível",
        message: "Não foi possível confirmar o horário da FB Burguer agora.",
      },
      { status: 503, headers: noStoreHeaders },
    );
  }
}
