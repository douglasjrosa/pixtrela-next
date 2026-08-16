import { describe, expect, it } from "vitest";

import {
  applyHeadAssigneePropagation,
  assigneesAfterLinkToPrevious,
  canEditAssignees,
  chainHasExternalDependencyBlock,
  findChainContaining,
  remainingExecutableMembers,
  resolveChains,
  type ChainSubTask,
} from "./subtask-chain";

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

describe("resolveChains", () => {
  it("groups consecutive linked rows", () => {
    const items = [
      item({ documentId: "a", index: 0 }),
      item({ documentId: "b", index: 1, linkedToPrevious: true }),
      item({ documentId: "c", index: 2, linkedToPrevious: true }),
      item({ documentId: "d", index: 3 }),
    ];
    expect(resolveChains(items)).toEqual([
      { headId: "a", memberIds: ["a", "b", "c"] },
      { headId: "d", memberIds: ["d"] },
    ]);
  });

  it("starts a new chain when linkedToPrevious is false", () => {
    const items = [
      item({ documentId: "a", index: 0, linkedToPrevious: true }),
      item({ documentId: "b", index: 1 }),
    ];
    expect(resolveChains(items).map((chain) => chain.memberIds)).toEqual([
      ["a"],
      ["b"],
    ]);
  });
});

describe("remainingExecutableMembers", () => {
  it("skips finished and disabled without splitting the chain", () => {
    const items = [
      item({ documentId: "a", index: 0, status: "finished" }),
      item({
        documentId: "b",
        index: 1,
        linkedToPrevious: true,
        activationStatus: "disabled",
      }),
      item({ documentId: "c", index: 2, linkedToPrevious: true }),
    ];
    const chain = resolveChains(items)[0]!;
    const byId = new Map(items.map((row) => [row.documentId, row]));
    expect(
      remainingExecutableMembers(chain, byId).map((row) => row.documentId),
    ).toEqual(["c"]);
  });
});

describe("chainHasExternalDependencyBlock", () => {
  it("ignores deps inside the chain and blocks on unfinished external deps", () => {
    const siblings = new Map([
      ["a", { status: "waiting" }],
      ["b", { status: "waiting" }],
      ["out", { status: "waiting" }],
      ["done", { status: "finished" }],
    ]);
    const memberIds = new Set(["a", "b"]);
    expect(
      chainHasExternalDependencyBlock(
        memberIds,
        [{ dependencyIds: ["a"] }],
        siblings,
      ),
    ).toBe(false);
    expect(
      chainHasExternalDependencyBlock(
        memberIds,
        [{ dependencyIds: ["done"] }],
        siblings,
      ),
    ).toBe(false);
    expect(
      chainHasExternalDependencyBlock(
        memberIds,
        [{ dependencyIds: ["out"] }],
        siblings,
      ),
    ).toBe(true);
  });
});

describe("assignees", () => {
  it("copies previous assignees when linking", () => {
    expect(assigneesAfterLinkToPrevious(["u1", "u1", "u2"])).toEqual([
      "u1",
      "u2",
    ]);
  });

  it("only allows head or max>1 helper edits", () => {
    const chain = { headId: "a", memberIds: ["a", "b", "c"] };
    expect(canEditAssignees("a", 1, chain)).toBe("head");
    expect(canEditAssignees("b", 2, chain)).toBe("helper");
    expect(canEditAssignees("c", 1, chain)).toBe("none");
  });

  it("propagates head assignees and keeps extras on max>1 members", () => {
    const result = applyHeadAssigneePropagation(
      [
        { documentId: "a", assignedToIds: ["u1"], maxSameTimeWorkers: 1 },
        {
          documentId: "b",
          assignedToIds: ["u1", "helper"],
          maxSameTimeWorkers: 2,
        },
        { documentId: "c", assignedToIds: ["u1"], maxSameTimeWorkers: 1 },
      ],
      "a",
      ["u1"],
      ["u2"],
    );
    expect(result).toEqual([
      { documentId: "a", assignedToIds: ["u2"] },
      { documentId: "b", assignedToIds: ["u2", "helper"] },
      { documentId: "c", assignedToIds: ["u2"] },
    ]);
  });
});

describe("findChainContaining", () => {
  it("returns the chain for a member", () => {
    const chains = resolveChains([
      item({ documentId: "a", index: 0 }),
      item({ documentId: "b", index: 1, linkedToPrevious: true }),
    ]);
    expect(findChainContaining(chains, "b")?.headId).toBe("a");
    expect(findChainContaining(chains, "missing")).toBeNull();
  });
});
