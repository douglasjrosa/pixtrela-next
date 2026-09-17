import { beforeEach, describe, expect, it, vi } from "vitest";

const resolvePresetByName = vi.fn();

vi.mock("@/lib/templates/resolve-preset-for-import", () => ({
  resolvePresetByName: (...args: unknown[]) => resolvePresetByName(...args),
}));

import {
  loadPresetCategoryIdsBySubTaskName,
  mergeSubTaskCategoryId,
  resolveSubTaskCategoryId,
} from "./resolve-subtask-category-id";

describe("mergeSubTaskCategoryId", () => {
  it("prefers the stored sub-task category", () => {
    expect(mergeSubTaskCategoryId("stored", "preset")).toBe("stored");
  });

  it("falls back to preset category when stored is empty", () => {
    expect(mergeSubTaskCategoryId(null, "preset")).toBe("preset");
  });
});

describe("resolveSubTaskCategoryId", () => {
  beforeEach(() => {
    resolvePresetByName.mockReset();
  });

  it("uses preset category when the sub-task row has none", async () => {
    resolvePresetByName.mockResolvedValue({
      subTaskCategoryId: "cat-1",
    });

    await expect(
      resolveSubTaskCategoryId("Corte dos sarrafos da embalagem", null),
    ).resolves.toBe("cat-1");
    expect(resolvePresetByName).toHaveBeenCalledWith(
      "Corte dos sarrafos da embalagem",
    );
  });
});

describe("loadPresetCategoryIdsBySubTaskName", () => {
  beforeEach(() => {
    resolvePresetByName.mockReset();
  });

  it("deduplicates names before preset lookup", async () => {
    resolvePresetByName.mockResolvedValue({ subTaskCategoryId: "cat-1" });

    const map = await loadPresetCategoryIdsBySubTaskName([
      "Corte das tábuas",
      "Corte das tábuas",
    ]);

    expect(resolvePresetByName).toHaveBeenCalledTimes(1);
    expect(map.get("Corte das tábuas")).toBe("cat-1");
  });
});
