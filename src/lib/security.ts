import { createHmac } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseSecret } from "@/lib/supabase/env";

export function getClientIp(headers: Headers) {
  const forwarded =
    headers.get("x-vercel-forwarded-for") ??
    headers.get("x-forwarded-for") ??
    headers.get("x-real-ip") ??
    "unknown";

  return forwarded.split(",")[0]?.trim() || "unknown";
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? (host.includes("localhost") ? "http" : "https");

  return origin === `${protocol}://${host}`;
}

export function exceedsContentLength(request: Request, maxBytes: number) {
  const value = request.headers.get("content-length");
  if (!value) return false;
  const size = Number(value);
  return Number.isFinite(size) && size > maxBytes;
}

function hashRateLimitIdentifier(value: string) {
  const key = process.env.SUPABASE_SECRET_KEY ?? "fb-burguer-rate-limit";
  return createHmac("sha256", key).update(value).digest("hex");
}

export async function rateLimit({
  scope,
  identifier,
  limit,
  windowSeconds,
}: {
  scope: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
}) {
  // Em desenvolvimento sem backend, não impede o fluxo local.
  if (!hasSupabaseSecret) return true;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_scope: scope,
      p_identifier_hash: hashRateLimitIdentifier(identifier),
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error("Rate limit indisponível:", error.code ?? "unknown");
      return true;
    }

    return data === true;
  } catch {
    return true;
  }
}
