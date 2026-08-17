import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/store/cart-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://fbhamburgueria.vercel.app"),
  title: {
    default: "FB Hamburgueria",
    template: "%s | FB Hamburgueria",
  },
  description:
    "Cardápio digital da FB Hamburgueria. Faça seu pedido de forma rápida e simples.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "FB Hamburgueria",
    title: "FB Hamburgueria",
    description: "Hambúrgueres, salgados, bebidas e sobremesas.",
    images: ["/legacy/hamb-1.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
