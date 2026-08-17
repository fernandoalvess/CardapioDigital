import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const claims = claimsData?.claims;

    if (!claims?.sub) {
      redirect("/admin/login");
    }

    const slug = process.env.NEXT_PUBLIC_BUSINESS_SLUG ?? "fb-hamburgueria";
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!business) {
      redirect("/admin/login?error=Loja+não+encontrada");
    }

    const { data: membership } = await supabase
      .from("business_members")
      .select("role")
      .eq("business_id", business.id)
      .eq("user_id", claims.sub)
      .maybeSingle();

    if (!membership) {
      redirect("/admin/login?error=Usuário+sem+permissão+administrativa");
    }
  }

  return <AdminShell demo={!isSupabaseConfigured}>{children}</AdminShell>;
}
