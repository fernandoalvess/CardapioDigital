"use client";

import { useCallback, useEffect, useState } from "react";

export type StoreStatusResponse = {
  isOpen: boolean;
  label: string;
  message: string;
};

export async function fetchStoreStatus(): Promise<StoreStatusResponse> {
  const response = await fetch("/api/store/status", { cache: "no-store" });
  const result = await response.json().catch(() => null);

  if (!response.ok || !result || typeof result.isOpen !== "boolean") {
    throw new Error(
      result?.message ??
        "Não foi possível confirmar o horário da FB Burguer agora.",
    );
  }

  return {
    isOpen: result.isOpen,
    label: String(result.label ?? ""),
    message: String(result.message ?? "Estamos fechados no momento."),
  };
}

export function useStoreStatus(initialData?: StoreStatusResponse) {
  const [data, setData] = useState<StoreStatusResponse | undefined>(initialData);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(!initialData);
  const [isFetching, setIsFetching] = useState(false);

  const refetch = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    try {
      const next = await fetchStoreStatus();
      setData(next);
      return { data: next, error: null as Error | null };
    } catch (caught) {
      const nextError =
        caught instanceof Error
          ? caught
          : new Error("Não foi possível confirmar o horário da loja.");
      setError(nextError);
      return { data: undefined, error: nextError };
    } finally {
      setIsPending(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetchStoreStatus()
      .then((next) => {
        if (!active) return;
        setData(next);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          caught instanceof Error
            ? caught
            : new Error("Não foi possível confirmar o horário da loja."),
        );
      })
      .finally(() => {
        if (active) setIsPending(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    data,
    error,
    isPending,
    isFetching,
    isError: Boolean(error),
    refetch,
  };
}
