import { beforeEach, describe, expect, it, vi } from "vitest";

const findTemplateWithSubTasksByCode = vi.fn();
const cloneTemplateTaskByCode = vi.fn();
const createTemplateTask = vi.fn();
const updateTemplateTask = vi.fn();
const findSubTaskPresetByName = vi.fn();
const fetchBoxTemplateData = vi.fn();

vi.mock("@/lib/repos/templates", () => ({
  findTemplateWithSubTasksByCode: (...args: unknown[]) =>
    findTemplateWithSubTasksByCode(...args),
  cloneTemplateTaskByCode: (...args: unknown[]) =>
    cloneTemplateTaskByCode(...args),
  createTemplateTask: (...args: unknown[]) => createTemplateTask(...args),
  updateTemplateTask: (...args: unknown[]) => updateTemplateTask(...args),
}));

vi.mock("@/lib/repos/sub-task-presets", () => ({
  findSubTaskPresetByName: (...args: unknown[]) =>
    findSubTaskPresetByName(...args),
}));

vi.mock("@/integrations/ribermax/rbx/rbx-client", () => ({
  fetchBoxTemplateData: (...args: unknown[]) => fetchBoxTemplateData(...args),
}));

import {
  ensureTemplateTaskForProdId,
  resolveTemplateSourceCodes,
} from "./ensure-template-for-prod-id";

describe("resolveTemplateSourceCodes", () => {
  it("returns current prodId first then versions newest-to-oldest", () => {
    expect(resolveTemplateSourceCodes(1277, ["1234", "1255", "1266"])).toEqual([
      "1277",
      "1266",
      "1255",
      "1234",
    ]);
  });

  it("dedupes and skips invalid entries", () => {
    expect(
      resolveTemplateSourceCodes(10, ["10", "9", "", "9", "abc", "8"]),
    ).toEqual(["10", "8", "9"]);
  });

  it("works without versions", () => {
    expect(resolveTemplateSourceCodes(42)).toEqual(["42"]);
  });
});

describe("ensureTemplateTaskForProdId", () => {
  beforeEach(() => {
    findTemplateWithSubTasksByCode.mockReset();
    cloneTemplateTaskByCode.mockReset();
    createTemplateTask.mockReset();
    updateTemplateTask.mockReset();
    findSubTaskPresetByName.mockReset();
    fetchBoxTemplateData.mockReset();
  });

  it("returns existing template for current prodId without cloning or RBX", async () => {
    findTemplateWithSubTasksByCode.mockResolvedValueOnce({
      template: { id: "tpl-current", code: "1277", name: "Current", active: true },
      subTasks: [{ id: "st-1" }],
    });

    const id = await ensureTemplateTaskForProdId(1277, "Empresa - Caixa", [
      "1266",
    ]);

    expect(id).toBe("tpl-current");
    expect(cloneTemplateTaskByCode).not.toHaveBeenCalled();
    expect(fetchBoxTemplateData).not.toHaveBeenCalled();
  });

  it("clones from the newest ancestral template when current is missing", async () => {
    findTemplateWithSubTasksByCode
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        template: {
          id: "tpl-1266",
          code: "1266",
          name: "Edited",
          active: true,
        },
        subTasks: [{ id: "st-1" }],
      });
    cloneTemplateTaskByCode.mockResolvedValue({
      id: "tpl-cloned",
      code: "1277",
      name: "Empresa - Caixa",
      active: true,
    });

    const id = await ensureTemplateTaskForProdId(1277, "Empresa - Caixa", [
      "1234",
      "1266",
    ]);

    expect(id).toBe("tpl-cloned");
    expect(cloneTemplateTaskByCode).toHaveBeenCalledWith({
      fromCode: "1266",
      toCode: "1277",
      name: "Empresa - Caixa",
    });
    expect(fetchBoxTemplateData).not.toHaveBeenCalled();
  });

  it("falls back to RBX when no ancestral template exists", async () => {
    findTemplateWithSubTasksByCode.mockResolvedValue(null);
    createTemplateTask.mockResolvedValue({
      id: "tpl-new",
      code: "1277",
      name: "Empresa - Caixa",
      active: true,
    });
    fetchBoxTemplateData.mockResolvedValue({
      prodId: 1277,
      empresaNome: "Empresa",
      boxName: "Caixa",
      subtasks: [{ presetName: "Corte", qty: 1, actionUnits: 10 }],
    });
    findSubTaskPresetByName.mockResolvedValue({
      id: "p1",
      name: "Corte",
      sharingType: "duration",
      maxSameTimeWorkers: 1,
      actionUnitTime: 1,
      subTaskCategoryId: null,
    });
    updateTemplateTask.mockResolvedValue({
      id: "tpl-new",
      code: "1277",
      name: "Empresa - Caixa",
      active: true,
    });

    const id = await ensureTemplateTaskForProdId(1277, "Empresa - Caixa", [
      "1266",
    ]);

    expect(id).toBe("tpl-new");
    expect(fetchBoxTemplateData).toHaveBeenCalledWith(1277);
    expect(updateTemplateTask).toHaveBeenCalled();
  });
});
