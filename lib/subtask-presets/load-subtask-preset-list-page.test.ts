import { beforeEach, describe, expect, it, vi } from "vitest";

import { sampleSubTaskPreset } from "@/test/sample-subtask-preset";

const listSubTaskPresetsPaged = vi.fn();

vi.mock("@/lib/repos/sub-task-presets", () => ({
  listSubTaskPresetsPaged: (...args: unknown[]) =>
    listSubTaskPresetsPaged(...args),
}));

import { loadSubtaskPresetListPage } from "./load-subtask-preset-list-page";

describe("loadSubtaskPresetListPage", () => {
  beforeEach(() => {
    listSubTaskPresetsPaged.mockReset();
  });

  it("maps presets and derives pagination", async () => {
    listSubTaskPresetsPaged.mockResolvedValueOnce({
      items: [sampleSubTaskPreset({ documentId: "p1", name: "Corte" })],
      total: 12,
    });

    const result = await loadSubtaskPresetListPage(
      { column: "name", direction: "asc" },
      1,
    );

    expect(listSubTaskPresetsPaged).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      sort: { column: "name", direction: "asc" },
    });
    expect(result.hasMore).toBe(true);
    expect(result.pageCount).toBe(2);
    expect(result.presets).toHaveLength(1);
  });
});
