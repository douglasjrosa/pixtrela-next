import { beforeEach, describe, expect, it, vi } from "vitest";

const listSteps = vi.fn();
const listActiveTasksForBoard = vi.fn();
const findTaskByCrmItemKey = vi.fn();
const createTask = vi.fn();
const updateCrmPedidoTaskFields = vi.fn();
const ensureTemplateTaskForProdId = vi.fn();

vi.mock("@/lib/repos/steps", () => ({
  listSteps: (...args: unknown[]) => listSteps(...args),
}));

vi.mock("@/lib/repos/tasks", () => ({
  listActiveTasksForBoard: (...args: unknown[]) => listActiveTasksForBoard(...args),
  findTaskByCrmItemKey: (...args: unknown[]) => findTaskByCrmItemKey(...args),
  createTask: (...args: unknown[]) => createTask(...args),
  updateCrmPedidoTaskFields: (...args: unknown[]) => updateCrmPedidoTaskFields(...args),
}));

vi.mock("@/lib/business/ensure-template-for-prod-id", () => ({
  ensureTemplateTaskForProdId: (...args: unknown[]) =>
    ensureTemplateTaskForProdId(...args),
}));

import {
  isEligiblePedidoPayload,
  upsertTasksFromPedido,
  type CrmPedidoWebhookPayload,
} from "./upsert-tasks-from-pedido";

const BASE_PAYLOAD: CrmPedidoWebhookPayload = {
  pedidoId: 42,
  Bpedido: "B-100",
  itens: [{ Qtd: 10, prodId: 123, nomeProd: "Caixotona" }],
  dataEntrega: "2026-07-15",
  empresaNome: "Max Brasil",
};

function mockDefaultsForCreate(): void {
  listSteps.mockResolvedValue([{ id: "step-1", name: "Fila de produção", index: 0 }]);
  listActiveTasksForBoard.mockResolvedValue([{ index: 0 }]);
  findTaskByCrmItemKey.mockResolvedValue(null);
  createTask.mockResolvedValue({ id: "task-new" });
}

describe("isEligiblePedidoPayload", () => {
  it("returns false when Bpedido is empty", () => {
    expect(isEligiblePedidoPayload({ ...BASE_PAYLOAD, Bpedido: "" })).toBe(false);
    expect(isEligiblePedidoPayload({ ...BASE_PAYLOAD, Bpedido: "   " })).toBe(false);
  });

  it("returns true when Bpedido is set", () => {
    expect(isEligiblePedidoPayload(BASE_PAYLOAD)).toBe(true);
  });
});

describe("upsertTasksFromPedido", () => {
  beforeEach(() => {
    listSteps.mockReset();
    listActiveTasksForBoard.mockReset();
    findTaskByCrmItemKey.mockReset();
    createTask.mockReset();
    updateCrmPedidoTaskFields.mockReset();
    ensureTemplateTaskForProdId.mockReset();
    ensureTemplateTaskForProdId.mockResolvedValue("template-1");
  });

  it("skips when Bpedido is empty", async () => {
    const result = await upsertTasksFromPedido({ ...BASE_PAYLOAD, Bpedido: "" });
    expect(result).toEqual({ created: 0, updated: 0, skipped: 0 });
    expect(listSteps).not.toHaveBeenCalled();
  });

  it("creates a new task when crmItemKey does not exist", async () => {
    mockDefaultsForCreate();

    const result = await upsertTasksFromPedido(BASE_PAYLOAD);

    expect(result.created).toBe(1);
    expect(result.updated).toBe(0);
    expect(ensureTemplateTaskForProdId).toHaveBeenCalledWith(
      123,
      "Max Brasil - Caixotona",
    );
    expect(createTask).toHaveBeenCalledWith({
      name: "Max Brasil - Caixotona",
      qty: 10,
      deliveryDate: "2026-07-15",
      index: 1,
      status: "waiting",
      templateTaskCode: "123",
      stepId: "step-1",
      crmPedidoId: 42,
      crmItemKey: "42:0",
    });
  });

  it("updates an existing task when crmItemKey matches", async () => {
    listSteps.mockResolvedValue([{ id: "step-1", name: "Fila de produção", index: 0 }]);
    listActiveTasksForBoard.mockResolvedValue([{ index: 0 }]);
    findTaskByCrmItemKey.mockResolvedValue({
      id: "task-1",
      name: "Old name",
      qty: 5,
      deliveryDate: "2026-01-01",
    });

    const result = await upsertTasksFromPedido(BASE_PAYLOAD);

    expect(result.created).toBe(0);
    expect(result.updated).toBe(1);
    expect(ensureTemplateTaskForProdId).not.toHaveBeenCalled();
    expect(updateCrmPedidoTaskFields).toHaveBeenCalledWith("task-1", {
      name: "Max Brasil - Caixotona",
      qty: 10,
      deliveryDate: "2026-07-15",
    });
  });

  it("is idempotent when payload is unchanged", async () => {
    listSteps.mockResolvedValue([{ id: "step-1", name: "Fila de produção", index: 0 }]);
    listActiveTasksForBoard.mockResolvedValue([{ index: 0 }]);
    findTaskByCrmItemKey.mockResolvedValue({
      id: "task-1",
      name: "Max Brasil - Caixotona",
      qty: 10,
      deliveryDate: "2026-07-15",
    });

    const first = await upsertTasksFromPedido(BASE_PAYLOAD);
    const second = await upsertTasksFromPedido(BASE_PAYLOAD);

    expect(first).toEqual({ created: 0, updated: 0, skipped: 1 });
    expect(second).toEqual({ created: 0, updated: 0, skipped: 1 });
    expect(updateCrmPedidoTaskFields).not.toHaveBeenCalled();
  });
});
