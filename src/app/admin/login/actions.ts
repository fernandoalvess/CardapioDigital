"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/security";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(256),
  website: z.string().max(0).optional().default(""),
});

export async function login(formData: FormData) {
  if (!isSupabaseConfigured) {
    redirect("/admin/login?error=Área+administrativa+temporariamente+indisponível");
  }

  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    website: String(formData.get("website") ?? ""),
  });

  if (!parsed.success) {
    redirect("/admin/login?error=Email+ou+senha+inválidos");
  }

  const requestHeaders = await headers();
  const clientIp = getClientIp(requestHeaders);

  const ipAllowed = await rateLimit({
    scope: "admin-login-ip",
    identifier: clientIp,
    limit: 8,
    windowSeconds: 15 * 60,
  });

  const accountAllowed = await rateLimit({
    scope: "admin-login-account",
    identifier: `${clientIp}:${parsed.data.email.toLowerCase()}`,
    limit: 5,
    windowSeconds: 15 * 60,
  });

  if (!ipAllowed || !accountAllowed) {
    redirect("/admin/login?error=Muitas+tentativas.+Aguarde+alguns+minutos+e+tente+novamente");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirect("/admin/login?error=Email+ou+senha+inválidos");
  }

  redirect("/admin");
}
