import { beforeEach, describe, expect, it, vi } from "vitest";

const findTemplateByCode = vi.fn();
const findTemplateWithSubTasksByCode = vi.fn();
const cloneTemplateTaskByCode = vi.fn();
const archiveActiveTemplateByCode = vi.fn();
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
  archiveActiveTemplateByCode: (...args: unknown[]) =>
    archiveActiveTemplateByCode(...args),
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
    archiveActiveTemplateByCode.mockReset();
    archiveActiveTemplateByCode.mockResolvedValue(true);
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

    expect(result).toMatchObject({ templateId: "cloned", source: "legacy" });
    expect(archiveActiveTemplateByCode).toHaveBeenCalledWith(
      "20",
      "Modelo arquivado devido a atualização de versão. " +
        "Substituído pelo Modelo de código 30.",
    );
    expect(createTemplateTask).not.toHaveBeenCalled();
  });

  it("skips archived ancestors and clones from the next active one", async () => {
    findTemplateWithSubTasksByCode.mockImplementation(async (ancestorCode) => {
      if (ancestorCode === "20") return null;
      if (ancestorCode === "10") {
        return {
          template: { id: "legacy", code: "10", active: true },
          subTasks: [{ id: "s1" }],
        };
      }
      return null;
    });
    cloneTemplateTaskByCode.mockResolvedValue({ id: "cloned", code: "30" });

    const result = await ensureTemplateForTaskCode({
      code: "30",
      fallbackName: "Box",
      versions: ["10", "20"],
    });

    expect(result).toMatchObject({ templateId: "cloned", source: "legacy" });
    expect(cloneTemplateTaskByCode).toHaveBeenCalledWith({
      fromCode: "10",
      toCode: "30",
      name: "Box",
    });
    expect(archiveActiveTemplateByCode).toHaveBeenCalledWith(
      "10",
      "Modelo arquivado devido a atualização de versão. " +
        "Substituído pelo Modelo de código 30.",
    );
  });

  it("ignores archived shells for the current code", async () => {
    findTemplateWithSubTasksByCode.mockResolvedValue(null);
    findTemplateByCode.mockResolvedValue({
      id: "archived-shell",
      code: "30",
      active: false,
    });
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

    expect(result).toMatchObject({ templateId: "new", source: "payload" });
  });

  it("reuses existing shell and ignores payload", async () => {
    findTemplateWithSubTasksByCode.mockResolvedValue(null);
    findTemplateByCode.mockResolvedValue({
      id: "shell",
      code: "30",
      active: true,
    });

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

    expect(result).toMatchObject({ templateId: "shell", source: "existing" });
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

    expect(result).toMatchObject({ templateId: "new", source: "payload" });
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
    expect(result).toMatchObject({ templateId: "rbx-new", source: "rbx" });
  });
});
