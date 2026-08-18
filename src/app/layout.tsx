import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/store/cart-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://fbhamburgueria.vercel.app"),
  title: {
    default: "FB Burguer",
    template: "%s | FB Burguer",
  },
  description:
    "Cardápio digital da FB Burguer. Monte seu pedido e envie direto pelo WhatsApp.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "FB Burguer",
    title: "FB Burguer",
    description: "Hambúrgueres, salgados, bebidas e sobremesas.",
    images: ["/brand/logo.webp"],
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
