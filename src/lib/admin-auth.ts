import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const getAdminContext = cache(async () => {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const slug = process.env.NEXT_PUBLIC_BUSINESS_SLUG ?? "fb-burguer";
  const { data: business } = await supabase
    .from("businesses")
    .select("id,name,slug,timezone")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!business) return null;

  const { data: membership } = await supabase
    .from("business_members")
    .select("role")
    .eq("business_id", business.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (membership?.role !== "owner" && membership?.role !== "manager") {
    return null;
  }

  return {
    supabase,
    userId,
    business: {
      ...business,
      timezone: business.timezone ?? "America/Fortaleza",
    },
    role: membership.role,
  };
});
