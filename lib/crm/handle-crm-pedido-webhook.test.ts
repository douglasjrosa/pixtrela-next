import { beforeEach, describe, expect, it, vi } from "vitest";

const upsertTasksFromPedido = vi.fn();

vi.mock("@/lib/crm/upsert-tasks-from-pedido", () => ({
  isEligiblePedidoPayload: (payload: { Bpedido: string }) =>
    Boolean(payload.Bpedido?.trim()),
  upsertTasksFromPedido: (...args: unknown[]) => upsertTasksFromPedido(...args),
}));

import { signWebhookPayload } from "@/lib/crm/verify-webhook-signature";
import { processCrmPedidoWebhook } from "@/lib/crm/handle-crm-pedido-webhook";

const SECRET = "webhook-test-secret";

const VALID_BODY = JSON.stringify({
  pedidoId: 42,
  Bpedido: "B-100",
  itens: [{ Qtd: 1, prodId: 2, nomeProd: "Item" }],
  dataEntrega: "2026-07-15",
  empresaNome: "Empresa",
});

describe("processCrmPedidoWebhook", () => {
  beforeEach(() => {
    upsertTasksFromPedido.mockReset();
    upsertTasksFromPedido.mockResolvedValue({ created: 1, updated: 0, skipped: 0 });
  });

  it("returns 401 when signature is invalid", async () => {
    const result = await processCrmPedidoWebhook(VALID_BODY, "sha256=bad", SECRET);
    expect(result.status).toBe(401);
  });

  it("returns 400 for invalid payload", async () => {
    const body = JSON.stringify({ pedidoId: "x" });
    const signature = signWebhookPayload(body, SECRET);
    const result = await processCrmPedidoWebhook(body, signature, SECRET);
    expect(result.status).toBe(400);
  });

  it("skips when Bpedido is empty", async () => {
    const body = JSON.stringify({
      pedidoId: 1,
      Bpedido: "",
      itens: [],
      empresaNome: "X",
    });
    const signature = signWebhookPayload(body, SECRET);
    const result = await processCrmPedidoWebhook(body, signature, SECRET);
    expect(result.body).toEqual({ status: "skipped", reason: "no_bpedido" });
    expect(upsertTasksFromPedido).not.toHaveBeenCalled();
  });

  it("processes valid webhook and flags revalidation", async () => {
    const signature = signWebhookPayload(VALID_BODY, SECRET);
    const result = await processCrmPedidoWebhook(VALID_BODY, signature, SECRET);

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ status: "ok", created: 1, updated: 0, skipped: 0 });
    expect(result.revalidateTasks).toBe(true);
    expect(upsertTasksFromPedido).toHaveBeenCalledOnce();
  });
});
