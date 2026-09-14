"use client";

import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { useCartStore } from "@/stores/cart-store";

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  return (
    <>
      {children}
      <Toaster richColors position="top-center" closeButton />
    </>
  );
}
