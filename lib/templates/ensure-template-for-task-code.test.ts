import { beforeEach, describe, expect, it, vi } from "vitest";

const findTemplateByCode = vi.fn();
const findTemplateWithSubTasksByCode = vi.fn();
const cloneTemplateTaskByCode = vi.fn();
const createTemplateTask = vi.fn();
const buildTemplateFromBoxPayload = vi.fn();
const fetchBoxTemplateData = vi.fn();

vi.mock("@/integrations/ribermax/rbx/rbx-client", () => ({
  fetchBoxTemplateData: (...args: unknown[]) => fetchBoxTemplateData(...args),
}));

vi.mock("@/lib/repos/templates", () => ({
  findTemplateByCode: (...args: unknown[]) => findTemplateByCode(...args),
  findTemplateWithSubTasksByCode: (...args: unknown[]) =>
    findTemplateWithSubTasksByCode(...args),
  cloneTemplateTaskByCode: (...args: unknown[]) =>
    cloneTemplateTaskByCode(...args),
  createTemplateTask: (...args: unknown[]) => createTemplateTask(...args),
}));

vi.mock("@/lib/templates/build-template-from-box-payload", () => ({
  buildTemplateFromBoxPayload: (...args: unknown[]) =>
    buildTemplateFromBoxPayload(...args),
}));

import {
  ensureTemplateForTaskCode,
  resolveTemplateSourceCodes,
} from "./ensure-template-for-task-code";

describe("resolveTemplateSourceCodes", () => {
  it("lists current then versions newest-first", () => {
    expect(resolveTemplateSourceCodes("30", ["10", "20"])).toEqual([
      "30",
      "20",
      "10",
    ]);
  });
});

describe("ensureTemplateForTaskCode", () => {
  beforeEach(() => {
    findTemplateByCode.mockReset();
    findTemplateWithSubTasksByCode.mockReset();
    cloneTemplateTaskByCode.mockReset();
    createTemplateTask.mockReset();
    buildTemplateFromBoxPayload.mockReset();
    fetchBoxTemplateData.mockReset();
  });

  it("clones from legacy version with subtasks first", async () => {
    findTemplateWithSubTasksByCode.mockResolvedValue({
      template: { id: "legacy", code: "20" },
      subTasks: [{ id: "s1" }],
    });
    cloneTemplateTaskByCode.mockResolvedValue({ id: "cloned", code: "30" });

    const result = await ensureTemplateForTaskCode({
      code: "30",
      fallbackName: "Box",
      versions: ["10", "20"],
      template: {
        prodId: 30,
        empresaNome: "X",
        boxName: "Box",
        subtasks: [],
      },
    });

    expect(result).toEqual({ templateId: "cloned", source: "legacy" });
    expect(createTemplateTask).not.toHaveBeenCalled();
  });

  it("reuses existing shell and ignores payload", async () => {
    findTemplateWithSubTasksByCode.mockResolvedValue(null);
    findTemplateByCode.mockResolvedValue({ id: "shell", code: "30" });

    const result = await ensureTemplateForTaskCode({
      code: "30",
      fallbackName: "Box",
      template: {
        prodId: 30,
        empresaNome: "X",
        boxName: "Box",
        subtasks: [{ presetName: "X", qty: 1, actionUnits: 1 }],
      },
    });

    expect(result).toEqual({ templateId: "shell", source: "existing" });
    expect(buildTemplateFromBoxPayload).not.toHaveBeenCalled();
  });

  it("creates from payload when nothing exists", async () => {
    findTemplateWithSubTasksByCode.mockResolvedValue(null);
    findTemplateByCode.mockResolvedValue(null);
    buildTemplateFromBoxPayload.mockResolvedValue({
      name: "X - Box",
      code: "30",
      subTask: [],
    });
    createTemplateTask.mockResolvedValue({ id: "new", code: "30" });

    const result = await ensureTemplateForTaskCode({
      code: "30",
      fallbackName: "Box",
      template: {
        prodId: 30,
        empresaNome: "X",
        boxName: "Box",
        subtasks: [],
      },
    });

    expect(result).toEqual({ templateId: "new", source: "payload" });
  });

  it("fetches RBX when no payload and no existing template", async () => {
    findTemplateWithSubTasksByCode.mockResolvedValue(null);
    findTemplateByCode.mockResolvedValue(null);
    fetchBoxTemplateData.mockResolvedValue({
      prodId: 30,
      empresaNome: "X",
      boxName: "Box",
      subtasks: [{ presetName: "Cut", qty: 1, actionUnits: 1 }],
    });
    buildTemplateFromBoxPayload.mockResolvedValue({
      name: "X - Box",
      code: "30",
      subTask: [],
    });
    createTemplateTask.mockResolvedValue({ id: "rbx-new", code: "30" });

    const result = await ensureTemplateForTaskCode({
      code: "30",
      fallbackName: "Box",
    });

    expect(fetchBoxTemplateData).toHaveBeenCalledWith(30);
    expect(result).toEqual({ templateId: "rbx-new", source: "rbx" });
  });
});
