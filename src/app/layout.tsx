import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://fbburguer.vercel.app"),
  title: {
    default: "FB Burguer",
    template: "%s | FB Burguer",
  },
  description:
    "Cardápio digital da FB Burguer. Monte seu pedido e envie direto pelo WhatsApp.",
  applicationName: "FB Burguer",
  appleWebApp: {
    capable: true,
    title: "FB Burguer",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "FB Burguer",
    title: "FB Burguer",
    description: "Hambúrgueres, salgados, bebidas e sobremesas.",
    images: ["/brand/logo.webp"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
