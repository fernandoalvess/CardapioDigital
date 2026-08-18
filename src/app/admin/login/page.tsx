import Image from "next/image";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { login } from "./actions";

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[#171714] px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm font-bold text-orange-300">
          ← Voltar ao cardápio
        </Link>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl md:p-8">
          <div className="flex items-center gap-4">
            <Image
              src="/brand/logo.webp"
              alt="FB Burguer"
              width={64}
              height={64}
              priority
              className="h-16 w-16 rounded-2xl object-cover"
            />
            <div>
              <p className="text-sm font-bold text-orange-400">FB Burguer</p>
              <h1 className="text-2xl font-black">Área administrativa</h1>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-zinc-400">
            Acesse para acompanhar comandas, confirmar vendas e administrar o cardápio.
          </p>

          {!isSupabaseConfigured && (
            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
              O projeto está em modo demo. Configure as variáveis do Supabase para habilitar o login real.
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
              {error}
            </div>
          )}

          <form action={login} className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-bold">E-mail</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 outline-none focus:border-orange-400"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Senha</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 outline-none focus:border-orange-400"
              />
            </label>
            <button className="rounded-xl bg-[#ff6500] px-5 py-4 font-black hover:bg-[#df5700]">
              Entrar
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
