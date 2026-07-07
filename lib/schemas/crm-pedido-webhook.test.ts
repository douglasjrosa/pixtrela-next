import { describe, expect, it } from "vitest";

import { crmPedidoWebhookSchema } from "@/lib/schemas/crm-pedido-webhook";

describe("crmPedidoWebhookSchema", () => {
  it("parses a valid payload", () => {
    const parsed = crmPedidoWebhookSchema.parse({
      pedidoId: 42,
      Bpedido: "B-100",
      itens: [{ Qtd: 1, prodId: 2, nomeProd: "Item" }],
      dataEntrega: "2026-07-15",
      empresaNome: "Empresa",
    });

    expect(parsed.pedidoId).toBe(42);
    expect(parsed.Bpedido).toBe("B-100");
  });

  it("rejects invalid pedidoId", () => {
    expect(() =>
      crmPedidoWebhookSchema.parse({
        pedidoId: 0,
        Bpedido: "B-1",
        itens: [],
        empresaNome: "X",
      }),
    ).toThrow();
  });
});
