import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AdminRole = "owner" | "manager" | "kitchen" | "delivery";

export async function getAdminContext(
  allowedRoles: AdminRole[] = ["owner", "manager"],
) {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const slug = process.env.NEXT_PUBLIC_BUSINESS_SLUG ?? "fb-burguer";
  const { data: business } = await supabase
    .from("businesses")
    .select("id,name,slug")
    .eq("slug", slug)
    .single();

  if (!business) return null;

  const { data: membership } = await supabase
    .from("business_members")
    .select("role")
    .eq("business_id", business.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership || !allowedRoles.includes(membership.role as AdminRole)) {
    return null;
  }

  return {
    supabase,
    userId,
    business,
    role: membership.role as AdminRole,
  };
}
