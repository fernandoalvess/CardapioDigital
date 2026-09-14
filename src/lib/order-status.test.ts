import { describe, expect, it } from "vitest";
import { nextOrderAction } from "@/lib/order-status";

describe("fluxo operacional da comanda", () => {
  it("expõe a próxima ação esperada para cada etapa", () => {
    expect(nextOrderAction("pending")).toEqual({
      status: "accepted",
      label: "Confirmar pedido",
    });
    expect(nextOrderAction("accepted")?.status).toBe("preparing");
    expect(nextOrderAction("preparing")?.status).toBe("ready");
    expect(nextOrderAction("ready")?.status).toBe("out_for_delivery");
    expect(nextOrderAction("out_for_delivery")?.status).toBe("completed");
  });

  it("não oferece ação para estados terminais", () => {
    expect(nextOrderAction("completed")).toBeNull();
    expect(nextOrderAction("cancelled")).toBeNull();
  });
});
