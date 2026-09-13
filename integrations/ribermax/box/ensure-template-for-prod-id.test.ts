import { beforeEach, describe, expect, it, vi } from "vitest";

const createTemplateTask = vi.fn();
const updateTemplateTask = vi.fn();
const findTemplateByCode = vi.fn();
const fetchBoxTemplateData = vi.fn();
const buildTemplateFromBoxPayload = vi.fn();

vi.mock("@/lib/repos/templates", () => ({
  createTemplateTask: (...args: unknown[]) => createTemplateTask(...args),
  updateTemplateTask: (...args: unknown[]) => updateTemplateTask(...args),
  findTemplateByCode: (...args: unknown[]) => findTemplateByCode(...args),
}));

vi.mock("@/integrations/ribermax/rbx/rbx-client", () => ({
  fetchBoxTemplateData: (...args: unknown[]) => fetchBoxTemplateData(...args),
}));

vi.mock("@/lib/templates/build-template-from-box-payload", () => ({
  buildTemplateFromBoxPayload: (...args: unknown[]) =>
    buildTemplateFromBoxPayload(...args),
  PRESET_NOT_FOUND_PREFIX: "presetNotFound:",
}));

import { ensureTemplateTaskForProdId } from "./ensure-template-for-prod-id";

describe("ensureTemplateTaskForProdId", () => {
  beforeEach(() => {
    createTemplateTask.mockReset();
    updateTemplateTask.mockReset();
    findTemplateByCode.mockReset();
    fetchBoxTemplateData.mockReset();
    buildTemplateFromBoxPayload.mockReset();
  });

  it("returns existing template without calling RBX", async () => {
    findTemplateByCode.mockResolvedValueOnce({
      id: "tpl-current",
      code: "1277",
      name: "Current",
      active: true,
    });

    const id = await ensureTemplateTaskForProdId(1277, "Empresa - Caixa");

    expect(id).toBe("tpl-current");
    expect(fetchBoxTemplateData).not.toHaveBeenCalled();
    expect(createTemplateTask).not.toHaveBeenCalled();
  });

  it("creates shell, loads RBX payload, and updates subtasks", async () => {
    findTemplateByCode.mockResolvedValueOnce(null);
    createTemplateTask.mockResolvedValueOnce({
      id: "tpl-new",
      code: "1277",
      name: "Empresa - Caixa",
      active: true,
    });
    fetchBoxTemplateData.mockResolvedValueOnce({
      prodId: 1277,
      empresaNome: "Empresa",
      boxName: "Caixa",
      subtasks: [{ presetName: "Corte", qty: 1, actionUnits: 10 }],
    });
    buildTemplateFromBoxPayload.mockResolvedValueOnce({
      code: "1277",
      name: "Empresa - Caixa",
      subTask: [
        {
          name: "Corte",
          qty: 1,
          sharingType: "duration",
          maxSameTimeWorkers: 1,
          expectedTime: 10,
        },
      ],
    });

    const id = await ensureTemplateTaskForProdId(1277, "Empresa - Caixa");

    expect(id).toBe("tpl-new");
    expect(fetchBoxTemplateData).toHaveBeenCalledWith(1277);
    expect(updateTemplateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "tpl-new",
        subTasks: expect.arrayContaining([
          expect.objectContaining({ name: "Corte" }),
        ]),
      }),
    );
  });
});
