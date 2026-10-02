import { describe, expect, it } from "vitest";

import { openRunLookupGroupsFromCatalog } from "./kiosk-open-run-groups";
import type { ChainSubTask } from "./subtask-chain";

function item(
  partial: Pick<ChainSubTask, "documentId" | "index"> & Partial<ChainSubTask>,
): ChainSubTask {
  return {
    status: "waiting",
    linkedToPrevious: false,
    maxSameTimeWorkers: 1,
    assignedToIds: [],
    dependencyIds: [],
    ...partial,
  };
}

describe("openRunLookupGroupsFromCatalog", () => {
  it("does not attach a linked member to another task with the same index", () => {
    const groups = openRunLookupGroupsFromCatalog([
      { ...item({ documentId: "alliage-head", index: 0 }), taskDocumentId: "a" },
      {
        ...item({
          documentId: "alliage-next",
          index: 1,
          linkedToPrevious: true,
        }),
        taskDocumentId: "a",
      },
      { ...item({ documentId: "medpej-head", index: 0 }), taskDocumentId: "b" },
      { ...item({ documentId: "medpej-next", index: 1 }), taskDocumentId: "b" },
    ]);

    expect(groups).toEqual([
      {
        headId: "alliage-head",
        memberIds: ["alliage-head", "alliage-next"],
      },
    ]);
  });
});
