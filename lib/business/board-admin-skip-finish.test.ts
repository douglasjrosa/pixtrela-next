import { describe, expect, it } from "vitest";

import {
  applySkipFinishDraft,
  eligibleSkipFinishIds,
  expandSkipToChains,
  isSkipFinishDraftActive,
  partitionSkipByOpenSessions,
  uniqueSortedNames,
} from "./board-admin-skip-finish";
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

describe("expandSkipToChains", () => {
  it("expands a selected member to the whole linked chain", () => {
    const items = [
      item({ documentId: "a", index: 0 }),
      item({ documentId: "b", index: 1, linkedToPrevious: true }),
      item({ documentId: "c", index: 2 }),
    ];
    expect(expandSkipToChains(items, ["b"]).sort()).toEqual(["a", "b"]);
  });

  it("keeps an unlinked row as a single id", () => {
    const items = [item({ documentId: "a", index: 0 })];
    expect(expandSkipToChains(items, ["a"])).toEqual(["a"]);
  });
});

describe("partitionSkipByOpenSessions", () => {
  it("blocks the entire chain when any member has an open session", () => {
    const result = partitionSkipByOpenSessions(
      [{ memberIds: ["a", "b"] }, { memberIds: ["c"] }],
      new Map([["b", ["u-1"]]]),
    );
    expect(result.allowedIds).toEqual(["c"]);
    expect(result.blocked).toEqual([
      { memberIds: ["a", "b"], openUserIds: ["u-1"] },
    ]);
  });

  it("allows a chain with no open sessions", () => {
    const result = partitionSkipByOpenSessions(
      [{ memberIds: ["a", "b"] }],
      new Map(),
    );
    expect(result.allowedIds).toEqual(["a", "b"]);
    expect(result.blocked).toEqual([]);
  });
});

describe("eligibleSkipFinishIds", () => {
  it("drops members that are already finished", () => {
    expect(
      eligibleSkipFinishIds(
        [
          item({ documentId: "a", index: 0, status: "waiting" }),
          item({ documentId: "b", index: 1, status: "finished" }),
        ],
        ["a", "b"],
      ),
    ).toEqual(["a"]);
  });
});

describe("isSkipFinishDraftActive", () => {
  it("is active when skip draft covers the selection", () => {
    expect(isSkipFinishDraftActive(["a", "b"], ["a"])).toBe(true);
    expect(isSkipFinishDraftActive(["a"], ["a", "b"])).toBe(false);
    expect(isSkipFinishDraftActive([], ["a"])).toBe(false);
    expect(isSkipFinishDraftActive(["a"], [])).toBe(true);
  });
});

describe("applySkipFinishDraft", () => {
  it("patches only skip ids", () => {
    const next = applySkipFinishDraft(
      [
        { documentId: "a", status: "waiting", assignedTo: ["u-1"] },
        { documentId: "b", status: "producing", assignedTo: ["u-2"] },
      ],
      new Set(["a"]),
      { status: "finished", assignedTo: [] },
    );
    expect(next).toEqual([
      { documentId: "a", status: "finished", assignedTo: [] },
      { documentId: "b", status: "producing", assignedTo: ["u-2"] },
    ]);
  });
});

describe("uniqueSortedNames", () => {
  it("dedupes and sorts names", () => {
    expect(uniqueSortedNames(["Bob", "Ana", "Bob", ""])).toEqual([
      "Ana",
      "Bob",
    ]);
  });
});
