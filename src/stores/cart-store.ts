"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Product } from "@/types/catalog";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (product: Pick<Product, "id" | "name" | "price" | "imageUrl">) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "fb-burguer:v2:cart";

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add(product) {
        set((state) => {
          const existing = state.items.find((item) => item.productId === product.id);

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity: 1,
              },
            ],
          };
        });
      },
      decrement(productId) {
        set((state) => ({
          items: state.items
            .map((item) =>
              item.productId === productId
                ? { ...item, quantity: item.quantity - 1 }
                : item,
            )
            .filter((item) => item.quantity > 0),
        }));
      },
      remove(productId) {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },
      clear() {
        set({ items: [] });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      skipHydration: true,
    },
  ),
);

export function useCart() {
  const items = useCartStore((state) => state.items);
  const add = useCartStore((state) => state.add);
  const decrement = useCartStore((state) => state.decrement);
  const remove = useCartStore((state) => state.remove);
  const clear = useCartStore((state) => state.clear);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return { items, itemCount, subtotal, add, decrement, remove, clear };
}
