import Image from "next/image";
import { LoginForm } from "./login-form";

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-dvh place-items-center bg-zinc-950 px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl md:p-8">
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

          <LoginForm initialError={error} />
        </div>
      </div>
    </main>
  );
}
