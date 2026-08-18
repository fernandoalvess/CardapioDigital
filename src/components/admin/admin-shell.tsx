import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/comandas", label: "Comandas" },
  { href: "/admin/cardapio", label: "Cardápio" },
];

export function AdminShell({ children, demo }: { children: ReactNode; demo: boolean }) {
  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="grid min-h-screen lg:grid-cols-[250px_1fr]">
        <aside className="border-r border-zinc-800 bg-[#171714] p-5 text-white">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/brand/logo.webp" alt="FB Burguer" width={48} height={48} className="h-12 w-12 rounded-xl object-cover" />
            <div>
              <strong className="block">FB Burguer</strong>
              <span className="text-xs text-zinc-400">Administração</span>
            </div>
          </Link>

          <nav className="mt-9 grid gap-1.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-4 py-3 text-sm font-bold text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 grid gap-3 border-t border-white/10 pt-5">
            <Link href="/" className="text-sm font-bold text-zinc-400 hover:text-white">
              Ver cardápio ↗
            </Link>
            <form action="/admin/logout" method="post">
              <button type="submit" className="text-sm font-bold text-zinc-500 hover:text-white">
                Sair do painel
              </button>
            </form>
          </div>
        </aside>

        <div>
          {demo && (
            <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900">
              <strong>Modo demo:</strong> conecte o Supabase para registrar comandas, autenticar o administrador e contabilizar vendas.
            </div>
          )}
          <div className="p-5 md:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
