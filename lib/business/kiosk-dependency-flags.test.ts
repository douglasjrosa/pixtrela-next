import { describe, expect, it } from "vitest";

import { buildDependencyFlagHintsForItem } from "./kiosk-dependency-flags";

describe("buildDependencyFlagHintsForItem", () => {
  it("shows predecessor flags when predecessor is outside the enriched batch", () => {
    const hints = buildDependencyFlagHintsForItem(
      ["pred-1"],
      new Map([
        [
          "pred-1",
          {
            name: "Corte",
            status: "finished",
            subTaskCategoryId: "cat-1",
          },
        ],
      ]),
      new Map([["pred-1", ["C-3"]]]),
      new Map([["pred-1", [{ id: "flag-1", code: "C-3" }]]]),
    );

    expect(hints).toEqual([
      {
        predecessorId: "pred-1",
        predecessorName: "Corte",
        codes: ["C-3"],
        flags: [{ id: "flag-1", code: "C-3" }],
        semBandeira: false,
      },
    ]);
  });

  it("marks sem bandeira only when predecessor has no category", () => {
    const hints = buildDependencyFlagHintsForItem(
      ["pred-1"],
      new Map([
        ["pred-1", { name: "Base", status: "finished", subTaskCategoryId: null }],
      ]),
      new Map(),
      new Map(),
    );

    expect(hints[0]?.semBandeira).toBe(true);
  });
});
