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
    <main className="grid min-h-screen place-items-center bg-zinc-950 p-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur md:p-9">
        <Link href="/" className="text-sm font-bold text-rose-300">
          ← Cardápio
        </Link>
        <div className="mt-7">
          <span className="inline-flex rounded-xl bg-rose-500 px-3 py-2 text-sm font-black">
            FB
          </span>
          <h1 className="mt-5 text-3xl font-black">Painel administrativo</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Acesso reservado à equipe da hamburgueria.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            Supabase ainda não configurado. O cardápio público funciona em modo demo,
            mas o login só será liberado após preencher o <code>.env.local</code>.
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
            {error}
          </div>
        )}

        <form action={login} className="mt-7 grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm font-bold">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 outline-none focus:border-rose-400"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-bold">Senha</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 outline-none focus:border-rose-400"
            />
          </label>
          <button className="rounded-2xl bg-rose-600 px-5 py-4 font-black hover:bg-rose-500">
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
