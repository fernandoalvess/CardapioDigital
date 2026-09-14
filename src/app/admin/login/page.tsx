import Image from "next/image";
import Link from "next/link";
import { login } from "./actions";

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 px-4 py-10 text-white">
      
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
            Acesse para acompanhar comandas, confirmar vendas e administrar o
            cardápio.
          </p>

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
                autoComplete="username"
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
            <button className="rounded-xl bg-[var(--brand)] px-5 py-4 font-black hover:bg-[var(--brand-dark)]">
              Entrar
            </button>
            <div className="mt-2 text-center">
              <Link href="/" className="text-sm font-bold text-orange-400">
                Voltar ao cardápio
              </Link>
            </div>
          </form>
        </div>
    </main>
  );
}
