"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
    >
      <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
      Atualizar
    </Button>
  );
}
