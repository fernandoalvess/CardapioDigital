"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  if (!isSupabaseConfigured) {
    redirect("/admin/login?error=Configure+o+Supabase+antes+de+entrar");
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/admin/login?error=Informe+email+e+senha");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/admin/login?error=Email+ou+senha+inválidos");
  }

  redirect("/admin");
}
