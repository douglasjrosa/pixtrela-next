import { describe, expect, it } from "vitest";

import {
  applyChainLinkToggle,
  applyHeadAssigneePropagation,
  assigneesAfterLinkToPrevious,
  canEditAssignees,
  constrainHelperAssignees,
  chainHasExternalDependencyBlock,
  findChainContaining,
  chainItemsFromBoard,
  reconcileChainReorder,
  remainingExecutableMembers,
  resolveChains,
  nextChainSubtaskClick,
  chainIdsForClickSelection,
  shouldPropagateHeadAssigneeSave,
  type ChainAssigneeState,
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

describe("nextChainSubtaskClick", () => {
  it("selects the whole chain when the clicked row is max=1", () => {
    expect(
      nextChainSubtaskClick({
        clickedId: "b",
        clickedMaxWorkers: 1,
        current: null,
      }),
    ).toEqual({ selectedId: "b", scope: "group" });
  });

  it("clears selection on a second click of the same max=1 row", () => {
    expect(
      nextChainSubtaskClick({
        clickedId: "b",
        clickedMaxWorkers: 1,
        current: { selectedId: "b", scope: "group" },
      }),
    ).toBeNull();
  });

  it("starts max>1 on self and toggles to group then self", () => {
    const first = nextChainSubtaskClick({
      clickedId: "b",
      clickedMaxWorkers: 2,
      current: null,
    });
    expect(first).toEqual({ selectedId: "b", scope: "self" });
    const second = nextChainSubtaskClick({
      clickedId: "b",
      clickedMaxWorkers: 2,
      current: first,
    });
    expect(second).toEqual({ selectedId: "b", scope: "group" });
    expect(
      nextChainSubtaskClick({
        clickedId: "b",
        clickedMaxWorkers: 2,
        current: second,
      }),
    ).toEqual({ selectedId: "b", scope: "self" });
  });

  it("starts a different max>1 row on self", () => {
    expect(
      nextChainSubtaskClick({
        clickedId: "c",
        clickedMaxWorkers: 2,
        current: { selectedId: "b", scope: "group" },
      }),
    ).toEqual({ selectedId: "c", scope: "self" });
  });

  it("lists every member id for group scope", () => {
    const chains = [{ headId: "a", memberIds: ["a", "b", "c"] }];
    expect(
      chainIdsForClickSelection(chains, { selectedId: "b", scope: "group" }),
    ).toEqual(["a", "b", "c"]);
    expect(
      chainIdsForClickSelection(chains, { selectedId: "b", scope: "self" }),
    ).toEqual(["b"]);
  });

  it("propagates a head save only when every member already matches", () => {
    expect(
      shouldPropagateHeadAssigneeSave([["u1"], ["u1"]], ["u1", "u2"]),
    ).toBe(false);
    expect(
      shouldPropagateHeadAssigneeSave([["u1", "u2"], ["u1", "u2"]], ["u2", "u1"]),
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

  it("propagates head assignees and discards extras on every member", () => {
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
      ["u2"],
    );
    expect(result).toEqual([
      { documentId: "a", assignedToIds: ["u2"] },
      { documentId: "b", assignedToIds: ["u2"] },
      { documentId: "c", assignedToIds: ["u2"] },
    ]);
  });
});

function state(
  partial: Pick<ChainAssigneeState, "documentId"> &
    Partial<ChainAssigneeState>,
): ChainAssigneeState {
  return {
    linkedToPrevious: false,
    maxSameTimeWorkers: 1,
    assignedToIds: [],
    ...partial,
  };
}

function idsOf(items: readonly ChainAssigneeState[]): string[] {
  return items.map((item) => item.documentId);
}

function byId(
  items: readonly ChainAssigneeState[],
  documentId: string,
): ChainAssigneeState {
  return items.find((item) => item.documentId === documentId)!;
}

function asChainItems(items: readonly ChainAssigneeState[]): ChainSubTask[] {
  return items.map((row, index) => ({
    documentId: row.documentId,
    index,
    status: "waiting",
    linkedToPrevious: row.linkedToPrevious,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    assignedToIds: row.assignedToIds,
    dependencyIds: [],
  }));
}

describe("chain board rules", () => {
  it("1. linking inherits head assignees and discards later members", () => {
    const next = applyChainLinkToggle(
      [
        state({ documentId: "a", assignedToIds: ["head"] }),
        state({ documentId: "b", assignedToIds: ["old-b"] }),
        state({
          documentId: "c",
          linkedToPrevious: true,
          assignedToIds: ["old-c"],
        }),
      ],
      "b",
      true,
    );
    expect(byId(next, "a").assignedToIds).toEqual(["head"]);
    expect(byId(next, "b")).toMatchObject({
      linkedToPrevious: true,
      assignedToIds: ["head"],
    });
    expect(byId(next, "c")).toMatchObject({
      linkedToPrevious: true,
      assignedToIds: ["head"],
    });
  });

  it("2. head assignee changes propagate to every chain member", () => {
    const members = [
      { documentId: "a", assignedToIds: ["u1"], maxSameTimeWorkers: 1 },
      { documentId: "b", assignedToIds: ["u1"], maxSameTimeWorkers: 1 },
      { documentId: "c", assignedToIds: ["u1"], maxSameTimeWorkers: 1 },
    ];
    expect(applyHeadAssigneePropagation(members, "a", ["u2"])).toEqual([
      { documentId: "a", assignedToIds: ["u2"] },
      { documentId: "b", assignedToIds: ["u2"] },
      { documentId: "c", assignedToIds: ["u2"] },
    ]);
  });

  it("3. max_same_time_workers=1 members only accept assignees from the head", () => {
    const chain = { headId: "a", memberIds: ["a", "b"] };
    expect(canEditAssignees("b", 1, chain)).toBe("none");
    expect(canEditAssignees("a", 1, chain)).toBe("head");
  });

  it("keeps head assignees on a helper and allows extras to change", () => {
    expect(constrainHelperAssignees(["head"], ["extra"])).toEqual([
      "head",
      "extra",
    ]);
    expect(constrainHelperAssignees(["head"], [])).toEqual(["head"]);
    expect(constrainHelperAssignees(["head"], ["head", "extra"])).toEqual([
      "head",
      "extra",
    ]);
    expect(constrainHelperAssignees(["head", "h2"], ["h2", "extra"])).toEqual([
      "head",
      "h2",
      "extra",
    ]);
    expect(constrainHelperAssignees(["head"], ["head"])).toEqual(["head"]);
  });

  it("4. max>1 extras stay local until a later head change replaces them", () => {
    const chain = { headId: "a", memberIds: ["a", "b", "c"] };
    expect(canEditAssignees("b", 2, chain)).toBe("helper");
    const afterHelper = [
      state({ documentId: "a", assignedToIds: ["head"] }),
      state({
        documentId: "b",
        linkedToPrevious: true,
        maxSameTimeWorkers: 2,
        assignedToIds: ["head", "extra"],
      }),
      state({
        documentId: "c",
        linkedToPrevious: true,
        assignedToIds: ["head"],
      }),
    ];
    expect(byId(afterHelper, "a").assignedToIds).toEqual(["head"]);
    expect(byId(afterHelper, "c").assignedToIds).toEqual(["head"]);
    expect(
      applyHeadAssigneePropagation(
        afterHelper.map((item) => ({
          documentId: item.documentId,
          assignedToIds: item.assignedToIds,
          maxSameTimeWorkers: item.maxSameTimeWorkers,
        })),
        "a",
        ["next"],
      ),
    ).toEqual([
      { documentId: "a", assignedToIds: ["next"] },
      { documentId: "b", assignedToIds: ["next"] },
      { documentId: "c", assignedToIds: ["next"] },
    ]);
  });

  it("5. unlinking keeps assignees and makes the row the next group head", () => {
    const next = applyChainLinkToggle(
      [
        state({ documentId: "a", assignedToIds: ["head"] }),
        state({
          documentId: "b",
          linkedToPrevious: true,
          assignedToIds: ["head"],
        }),
        state({
          documentId: "c",
          linkedToPrevious: true,
          assignedToIds: ["head"],
        }),
      ],
      "b",
      false,
    );
    expect(byId(next, "b")).toMatchObject({
      linkedToPrevious: false,
      assignedToIds: ["head"],
    });
    expect(byId(next, "c")).toMatchObject({
      linkedToPrevious: true,
      assignedToIds: ["head"],
    });
    const chains = resolveChains(asChainItems(next));
    expect(chains).toEqual([
      { headId: "a", memberIds: ["a"] },
      { headId: "b", memberIds: ["b", "c"] },
    ]);
  });

  it("6. moving the head down makes the next row the new head", () => {
    const next = reconcileChainReorder(
      [
        state({ documentId: "a", assignedToIds: ["head"] }),
        state({
          documentId: "b",
          linkedToPrevious: true,
          assignedToIds: ["head"],
        }),
        state({
          documentId: "c",
          linkedToPrevious: true,
          assignedToIds: ["head"],
        }),
      ],
      ["b", "a", "c"],
      "a",
    );
    expect(idsOf(next)).toEqual(["b", "a", "c"]);
    expect(byId(next, "b").linkedToPrevious).toBe(false);
    expect(byId(next, "a").linkedToPrevious).toBe(true);
    expect(byId(next, "c").linkedToPrevious).toBe(true);
    expect(resolveChains(asChainItems(next))).toEqual([
      { headId: "b", memberIds: ["b", "a", "c"] },
    ]);
  });

  it("7. moving a member out of the group unlinks it and keeps assignees", () => {
    const next = reconcileChainReorder(
      [
        state({ documentId: "a", assignedToIds: ["head"] }),
        state({
          documentId: "b",
          linkedToPrevious: true,
          assignedToIds: ["head", "extra"],
          maxSameTimeWorkers: 2,
        }),
        state({
          documentId: "c",
          linkedToPrevious: true,
          assignedToIds: ["head"],
        }),
        state({ documentId: "d", assignedToIds: ["solo"] }),
      ],
      ["a", "c", "d", "b"],
      "b",
    );
    expect(byId(next, "b")).toMatchObject({
      linkedToPrevious: false,
      assignedToIds: ["head", "extra"],
    });
    expect(byId(next, "c").linkedToPrevious).toBe(true);
    expect(
      resolveChains(asChainItems(next)).map((chain) => chain.memberIds),
    ).toEqual([["a", "c"], ["d"], ["b"]]);
  });

  it("8. moving a row into a group inherits head assignees and discards its own", () => {
    const next = reconcileChainReorder(
      [
        state({ documentId: "a", assignedToIds: ["head"] }),
        state({
          documentId: "b",
          linkedToPrevious: true,
          assignedToIds: ["head"],
        }),
        state({
          documentId: "c",
          maxSameTimeWorkers: 2,
          assignedToIds: ["keep-me"],
        }),
      ],
      ["a", "c", "b"],
      "c",
    );
    expect(byId(next, "c")).toMatchObject({
      linkedToPrevious: true,
      assignedToIds: ["head"],
    });
    expect(resolveChains(asChainItems(next))).toEqual([
      { headId: "a", memberIds: ["a", "c", "b"] },
    ]);
  });

  it("9. moving a max>1 member keeps its extras until the head changes", () => {
    const extras = ["head", "extra"];
    const before = [
      state({ documentId: "a", assignedToIds: ["head"] }),
      state({
        documentId: "b",
        linkedToPrevious: true,
        maxSameTimeWorkers: 2,
        assignedToIds: extras,
      }),
      state({
        documentId: "c",
        linkedToPrevious: true,
        assignedToIds: ["head"],
      }),
    ];
    const movedDown = reconcileChainReorder(before, ["a", "c", "b"], "b");
    expect(byId(movedDown, "b").assignedToIds).toEqual(extras);
    const movedInside = reconcileChainReorder(before, ["a", "b", "c"], "b");
    expect(byId(movedInside, "b").assignedToIds).toEqual(extras);
    expect(
      applyHeadAssigneePropagation(
        [
          { documentId: "a", assignedToIds: ["head"], maxSameTimeWorkers: 1 },
          {
            documentId: "b",
            assignedToIds: extras,
            maxSameTimeWorkers: 2,
          },
        ],
        "a",
        ["next"],
      ),
    ).toEqual([
      { documentId: "a", assignedToIds: ["next"] },
      { documentId: "b", assignedToIds: ["next"] },
    ]);
  });

  it("treats a moved former head as a member using list order, not stale index", () => {
    const items = [
      {
        documentId: "b",
        index: 1,
        status: "waiting",
        linkedToPrevious: false,
        maxSameTimeWorkers: 1,
        assignedTo: [{ documentId: "u-b" }],
      },
      {
        documentId: "a",
        index: 0,
        status: "waiting",
        linkedToPrevious: true,
        maxSameTimeWorkers: 1,
        assignedTo: [{ documentId: "u-a" }],
      },
      {
        documentId: "c",
        index: 2,
        status: "waiting",
        linkedToPrevious: true,
        maxSameTimeWorkers: 1,
        assignedTo: [{ documentId: "u-c" }],
      },
    ];
    expect(resolveChains(chainItemsFromBoard(items))).toEqual([
      { headId: "b", memberIds: ["b", "a", "c"] },
    ]);
    expect(
      applyHeadAssigneePropagation(
        items.map((row) => ({
          documentId: row.documentId,
          assignedToIds: row.assignedTo.map((assignee) => assignee.documentId),
          maxSameTimeWorkers: row.maxSameTimeWorkers,
        })),
        "b",
        ["u-b-new"],
      ),
    ).toEqual([
      { documentId: "b", assignedToIds: ["u-b-new"] },
      { documentId: "a", assignedToIds: ["u-b-new"] },
      { documentId: "c", assignedToIds: ["u-b-new"] },
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
