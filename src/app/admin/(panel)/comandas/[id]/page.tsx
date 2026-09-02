import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageCircle, Phone } from "lucide-react";
import { OrderEditor } from "@/components/admin/order-editor";
import { getAvailableProductsForOrder } from "@/lib/admin-catalog";
import { getAdminBusiness, getAdminOrder } from "@/lib/admin-orders";

export default async function ComandaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, business, availableProducts] = await Promise.all([
    getAdminOrder(id),
    getAdminBusiness(),
    getAvailableProductsForOrder(),
  ]);
  if (!order) notFound();

  const timezone = business?.timezone ?? "America/Fortaleza";
  const phoneDigits = order.customerPhone.replace(/\D/g, "");
  const whatsappDigits = phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits}`;

  return (
    <main>
      <Link
        href="/admin/comandas"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-500 transition hover:text-zinc-950"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar para comandas
      </Link>

      <div className="mt-5 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6500]">
            Comanda
          </p>
          <h1 className="mt-1 text-3xl font-black">
            #{order.orderNumber ?? order.id.slice(0, 8)}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Criada em {formatDate(order.createdAt, timezone)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`tel:${phoneDigits}`}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
          >
            <Phone className="h-4 w-4" />
            Ligar
          </a>
          <a
            href={`https://wa.me/${whatsappDigits}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </div>

      <OrderEditor order={order} availableProducts={availableProducts} />
    </main>
  );
}

function formatDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));
}
