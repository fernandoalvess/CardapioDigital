"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/security";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";

export type LoginActionResult = {
  error?: string;
};

export async function login(
  input: FormData | LoginFormValues,
): Promise<LoginActionResult> {
  if (!isSupabaseConfigured) {
    return { error: "Área administrativa temporariamente indisponível." };
  }

  const raw =
    input instanceof FormData
      ? {
          email: String(input.get("email") ?? ""),
          password: String(input.get("password") ?? ""),
        }
      : input;

  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "E-mail ou senha inválidos." };
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
    return {
      error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "E-mail ou senha inválidos." };
  }

  redirect("/admin");
}
