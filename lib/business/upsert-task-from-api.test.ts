import { beforeEach, describe, expect, it, vi } from "vitest";

const ensureTemplateForTaskCode = vi.fn();
const findTaskByExternalKey = vi.fn();
const updateCrmPedidoTaskFields = vi.fn();
const createTask = vi.fn();
const getTaskById = vi.fn();
const listActiveTasksForBoard = vi.fn();
const listSteps = vi.fn();
const applyAutoStepTaskOrderingAfterTaskChange = vi.fn();

vi.mock("@/lib/templates/ensure-template-for-task-code", () => ({
  ensureTemplateForTaskCode: (...args: unknown[]) =>
    ensureTemplateForTaskCode(...args),
}));

vi.mock("@/lib/repos/tasks", () => ({
  findTaskByExternalKey: (...args: unknown[]) => findTaskByExternalKey(...args),
  updateCrmPedidoTaskFields: (...args: unknown[]) =>
    updateCrmPedidoTaskFields(...args),
  createTask: (...args: unknown[]) => createTask(...args),
  getTaskById: (...args: unknown[]) => getTaskById(...args),
  listActiveTasksForBoard: (...args: unknown[]) =>
    listActiveTasksForBoard(...args),
}));

vi.mock("@/lib/repos/steps", () => ({
  listSteps: (...args: unknown[]) => listSteps(...args),
}));

vi.mock("@/lib/business/apply-step-task-order", () => ({
  applyAutoStepTaskOrderingAfterTaskChange: (...args: unknown[]) =>
    applyAutoStepTaskOrderingAfterTaskChange(...args),
}));

import { upsertTaskFromApi } from "./upsert-task-from-api";

const baseInput = {
  name: "Cliente - Caixa",
  qty: 10,
  deliveryDate: "2026-07-15",
  externalKey: "123:0",
  templateTaskCode: "16378",
  versions: ["16377"],
  template: {
    prodId: 16378,
    empresaNome: "Cliente",
    boxName: "Caixa",
    subtasks: [] as [],
  },
};

describe("upsertTaskFromApi", () => {
  beforeEach(() => {
    ensureTemplateForTaskCode.mockReset();
    findTaskByExternalKey.mockReset();
    updateCrmPedidoTaskFields.mockReset();
    createTask.mockReset();
    getTaskById.mockReset();
    listActiveTasksForBoard.mockReset();
    listSteps.mockReset();
    applyAutoStepTaskOrderingAfterTaskChange.mockReset();
  });

  it("updates existing task by externalKey without touching template", async () => {
    findTaskByExternalKey.mockResolvedValue({
      id: "t1",
      name: "Old",
      qty: 1,
      deliveryDate: null,
    });
    getTaskById
      .mockResolvedValueOnce({
        id: "t1",
        stepId: "s1",
        deliveryDate: null,
      })
      .mockResolvedValueOnce({
        id: "t1",
        stepId: "s1",
        deliveryDate: "2026-07-15",
      });

    const result = await upsertTaskFromApi(baseInput);

    expect(result).toEqual({ action: "updated", taskId: "t1" });
    expect(ensureTemplateForTaskCode).not.toHaveBeenCalled();
    expect(updateCrmPedidoTaskFields).toHaveBeenCalledWith("t1", {
      name: baseInput.name,
      qty: 10,
      deliveryDate: "2026-07-15",
    });
  });

  it("creates task after ensuring template", async () => {
    findTaskByExternalKey.mockResolvedValue(null);
    ensureTemplateForTaskCode.mockResolvedValue({
      templateId: "tpl",
      source: "payload",
    });
    listSteps.mockResolvedValue([{ id: "s1", name: "Fila" }]);
    listActiveTasksForBoard.mockResolvedValue([{ index: 0 }]);
    createTask.mockResolvedValue({ id: "new" });

    const result = await upsertTaskFromApi(baseInput);

    expect(result).toEqual({
      action: "created",
      taskId: "new",
      templateSource: "payload",
    });
    expect(ensureTemplateForTaskCode).toHaveBeenCalledWith({
      code: "16378",
      fallbackName: baseInput.name,
      versions: ["16377"],
      template: baseInput.template,
    });
    expect(createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        crmItemKey: "123:0",
        crmPedidoId: 123,
        templateTaskCode: "16378",
        stepId: "s1",
        index: 1,
      }),
    );
  });

  it("skips update when fields are unchanged", async () => {
    findTaskByExternalKey.mockResolvedValue({
      id: "t1",
      name: baseInput.name,
      qty: baseInput.qty,
      deliveryDate: baseInput.deliveryDate,
    });

    const result = await upsertTaskFromApi(baseInput);
    expect(result).toEqual({ action: "skipped", taskId: "t1" });
    expect(updateCrmPedidoTaskFields).not.toHaveBeenCalled();
  });
});
