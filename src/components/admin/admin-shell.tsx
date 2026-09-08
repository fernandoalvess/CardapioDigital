"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  UtensilsCrossed,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/comandas", label: "Comandas", icon: ClipboardList },
  { href: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-zinc-800 bg-[#171714] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:p-5">
          <Link href="/" className="flex items-center gap-3 rounded-xl">
            <Image
              src="/brand/logo.webp"
              alt="FB Burguer"
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <div>
              <strong className="block">FB Burguer</strong>
              <span className="text-xs text-zinc-400">Administração</span>
            </div>
          </Link>

          <nav className="mt-9 grid gap-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                    active
                      ? "bg-[#ff6500] text-white shadow-sm"
                      : "text-zinc-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto grid gap-2 border-t border-white/10 pt-5">
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Ver cardápio
            </Link>
            <form action="/admin/logout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-zinc-500 transition hover:bg-white/5 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sair do painel
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-center gap-2.5">
                <Image
                  src="/brand/logo.webp"
                  alt="FB Burguer"
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-lg object-cover"
                />
                <div>
                  <strong className="block text-sm leading-4">FB Burguer</strong>
                  <span className="text-[11px] text-zinc-500">Administração</span>
                </div>
              </Link>
              <form action="/admin/logout" method="post">
                <button
                  type="submit"
                  aria-label="Sair do painel"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
            <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
              {links.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      active
                        ? "bg-orange-50 text-[#e85b00]"
                        : "text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <div className="p-4 sm:p-5 md:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
