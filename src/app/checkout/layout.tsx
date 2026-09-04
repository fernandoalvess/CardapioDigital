import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  robots: { index: false, follow: false, nocache: true },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
