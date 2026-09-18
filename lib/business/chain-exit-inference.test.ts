import { describe, expect, it } from "vitest";

import type { ChainStopAnswer } from "@/lib/business/subtask-chain-allocation";

import {
  CHAIN_STOP_INCONSISTENT,
  chainExitMembersFromQueue,
  dependencyEdgesWithinChain,
  principalDeclaredFinishFromStopQty,
  recomputeChainExitState,
  requiredSupplierSessionMin,
  resolveChainExitWizardOrder,
  validateChainStopCoherence,
  type ChainExitMember,
} from "./chain-exit-inference";

function member(
  overrides: Partial<ChainExitMember> & Pick<ChainExitMember, "documentId">,
): ChainExitMember {
  return {
    index: 0,
    sharingType: "qty",
    targetQty: 10,
    completedQty: 0,
    dependencyIds: [],
    ...overrides,
  };
}

describe("chain exit wizard order", () => {
  it("puts consumers before suppliers then independents by index", () => {
    const members = [
      member({ documentId: "a", index: 0 }),
      member({ documentId: "b", index: 1, dependencyIds: ["a"] }),
      member({ documentId: "c", index: 2, dependencyIds: ["b"] }),
      member({ documentId: "d", index: 3 }),
    ];
    const edges = dependencyEdgesWithinChain(members);
    expect(resolveChainExitWizardOrder(members, edges)).toEqual([
      "c",
      "b",
      "a",
      "d",
    ]);
  });

  it("keeps parallel suppliers after the shared consumer by index", () => {
    const members = [
      member({ documentId: "a", index: 0 }),
      member({ documentId: "b", index: 1 }),
      member({ documentId: "c", index: 2, dependencyIds: ["a", "b"] }),
    ];
    expect(
      resolveChainExitWizardOrder(members, dependencyEdgesWithinChain(members)),
    ).toEqual(["c", "a", "b"]);
  });
});

describe("requiredSupplierSessionMin", () => {
  it("uses leftover stock plus the consumer session qty", () => {
    const montar = member({
      documentId: "montar",
      targetQty: 100,
      completedQty: 0,
    });
    const cortar = member({
      documentId: "cortar",
      targetQty: 100,
      completedQty: 0,
    });
    expect(requiredSupplierSessionMin(montar, cortar, 20)).toBe(20);
  });

  it("subtracts supplier pieces already recorded", () => {
    const montar = member({
      documentId: "montar",
      targetQty: 100,
      completedQty: 20,
    });
    const cortar = member({
      documentId: "cortar",
      targetQty: 100,
      completedQty: 10,
    });
    expect(requiredSupplierSessionMin(montar, cortar, 30)).toBe(40);
  });
});

describe("recomputeChainExitState", () => {
  it("hides duration supplier when qty consumer finishes", () => {
    const members = [
      member({
        documentId: "cortar",
        index: 0,
        sharingType: "duration",
        targetQty: 1,
      }),
      member({
        documentId: "montar",
        index: 1,
        targetQty: 10,
        dependencyIds: ["cortar"],
      }),
    ];
    const edges = dependencyEdgesWithinChain(members);
    const state = recomputeChainExitState(members, edges, {
      montar: { documentId: "montar", qty: 10 },
    });
    expect(state.steps.find((step) => step.documentId === "cortar")).toMatchObject(
      { visible: false, reason: "inferred" },
    );
    expect(state.answers.cortar).toMatchObject({
      completed: true,
      inferred: true,
      semBandeira: true,
    });
  });

  it("keeps duration supplier visible when qty consumer is partial", () => {
    const members = [
      member({
        documentId: "cortar",
        index: 0,
        sharingType: "duration",
        targetQty: 1,
      }),
      member({
        documentId: "montar",
        index: 1,
        targetQty: 10,
        dependencyIds: ["cortar"],
      }),
    ];
    const state = recomputeChainExitState(
      members,
      dependencyEdgesWithinChain(members),
      { montar: { documentId: "montar", qty: 5 } },
    );
    expect(state.steps.find((step) => step.documentId === "cortar")?.visible)
      .toBe(true);
    expect(state.answers.cortar?.completed).toBeUndefined();
  });

  it("sets qty min to the WIP gap when this peer is last", () => {
    const members = [
      member({ documentId: "cortar", index: 0, targetQty: 10 }),
      member({
        documentId: "montar",
        index: 1,
        targetQty: 5,
        dependencyIds: ["cortar"],
      }),
    ];
    const state = recomputeChainExitState(
      members,
      dependencyEdgesWithinChain(members),
      { montar: { documentId: "montar", qty: 2 } },
    );
    expect(state.fieldConstraints.cortar).toEqual({
      min: 2,
      max: 10,
      defaultQty: 2,
    });
    expect(state.answers.cortar?.qty).toBe(2);
    expect(state.steps.find((step) => step.documentId === "cortar")?.visible)
      .toBe(true);
  });

  it("hides supplier qty when min equals remaining for the last peer", () => {
    const members = [
      member({ documentId: "cortar", index: 0, targetQty: 40, completedQty: 10 }),
      member({
        documentId: "montar",
        index: 1,
        targetQty: 100,
        completedQty: 20,
        dependencyIds: ["cortar"],
      }),
    ];
    const state = recomputeChainExitState(
      members,
      dependencyEdgesWithinChain(members),
      { montar: { documentId: "montar", qty: 30 } },
    );
    expect(state.answers.cortar).toMatchObject({
      qty: 30,
      inferred: true,
    });
    expect(state.steps.find((step) => step.documentId === "cortar")?.visible)
      .toBe(false);
  });

  it("hides duration supplier when duration consumer finishes", () => {
    const members = [
      member({
        documentId: "cortar",
        index: 0,
        sharingType: "duration",
        targetQty: 1,
      }),
      member({
        documentId: "montar",
        index: 1,
        sharingType: "duration",
        targetQty: 1,
        dependencyIds: ["cortar"],
      }),
    ];
    const finished = recomputeChainExitState(
      members,
      dependencyEdgesWithinChain(members),
      { montar: { documentId: "montar", completed: true } },
    );
    expect(finished.answers.cortar?.inferred).toBe(true);
    const partial = recomputeChainExitState(
      members,
      dependencyEdgesWithinChain(members),
      { montar: { documentId: "montar", completed: false } },
    );
    expect(partial.steps.find((step) => step.documentId === "cortar")?.visible)
      .toBe(true);
  });

  it("uses min 0 on qty supplier when duration consumer is not finished", () => {
    const members = [
      member({ documentId: "cortar", index: 0, targetQty: 10 }),
      member({
        documentId: "montar",
        index: 1,
        sharingType: "duration",
        targetQty: 1,
        dependencyIds: ["cortar"],
      }),
    ];
    const state = recomputeChainExitState(
      members,
      dependencyEdgesWithinChain(members),
      { montar: { documentId: "montar", completed: false } },
    );
    expect(state.fieldConstraints.cortar).toEqual({
      min: 0,
      max: 10,
      defaultQty: 0,
    });
  });

  it("applies the same consumer qty to parallel suppliers", () => {
    const members = [
      member({ documentId: "a", index: 0, targetQty: 10 }),
      member({ documentId: "b", index: 1, targetQty: 4 }),
      member({
        documentId: "c",
        index: 2,
        targetQty: 5,
        dependencyIds: ["a", "b"],
      }),
    ];
    const state = recomputeChainExitState(
      members,
      dependencyEdgesWithinChain(members),
      { c: { documentId: "c", qty: 2 } },
    );
    expect(state.fieldConstraints.a?.min).toBe(2);
    expect(state.fieldConstraints.b?.min).toBe(2);
  });

  it("uses the max min when two consumers constrain one supplier", () => {
    const members = [
      member({ documentId: "a", index: 0, targetQty: 10 }),
      member({
        documentId: "b",
        index: 1,
        targetQty: 5,
        dependencyIds: ["a"],
      }),
      member({
        documentId: "c",
        index: 2,
        targetQty: 10,
        dependencyIds: ["a"],
      }),
    ];
    const state = recomputeChainExitState(
      members,
      dependencyEdgesWithinChain(members),
      {
        b: { documentId: "b", qty: 2 },
        c: { documentId: "c", qty: 3 },
      },
    );
    expect(state.fieldConstraints.a?.min).toBe(5);
  });

  it("clears supplier qty when the consumer is edited", () => {
    const members = [
      member({ documentId: "cortar", index: 0, targetQty: 10 }),
      member({
        documentId: "montar",
        index: 1,
        targetQty: 5,
        dependencyIds: ["cortar"],
      }),
    ];
    const edges = dependencyEdgesWithinChain(members);
    const finished = recomputeChainExitState(members, edges, {
      montar: { documentId: "montar", qty: 5 },
    });
    expect(finished.answers.cortar?.inferred).toBeUndefined();
    expect(finished.answers.cortar?.qty).toBe(5);
    const edited = recomputeChainExitState(
      members,
      edges,
      { ...finished.answers, montar: { documentId: "montar", qty: 2 } },
      { changedMemberId: "montar" },
    );
    expect(edited.answers.cortar?.inferred).toBeUndefined();
    expect(edited.answers.cortar?.qty).toBe(2);
    expect(edited.steps.find((step) => step.documentId === "cortar")?.visible)
      .toBe(true);
  });

  it("allows the first peer to report more consumer than supplier pieces", () => {
    const members = [
      member({ documentId: "chapa", index: 0, targetQty: 100 }),
      member({
        documentId: "adesivo",
        index: 1,
        targetQty: 100,
        dependencyIds: ["chapa"],
      }),
    ];
    const state = recomputeChainExitState(
      members,
      dependencyEdgesWithinChain(members),
      {
        adesivo: { documentId: "adesivo", qty: 20 },
        chapa: { documentId: "chapa", qty: 10 },
      },
      { othersStillActive: true },
    );
    expect(state.fieldConstraints.chapa).toEqual({
      min: 0,
      max: 100,
      defaultQty: 0,
    });
    expect(state.answers.chapa?.qty).toBe(10);
    expect(() =>
      validateChainStopCoherence(
        members,
        dependencyEdgesWithinChain(members),
        [
          { documentId: "adesivo", qty: 20 },
          { documentId: "chapa", qty: 10 },
        ],
        { othersStillActive: true },
      ),
    ).not.toThrow();
  });

  it("raises the last peer supplier min from recorded line stock", () => {
    const members = [
      member({ documentId: "chapa", index: 0, targetQty: 100, completedQty: 10 }),
      member({
        documentId: "adesivo",
        index: 1,
        targetQty: 100,
        completedQty: 20,
        dependencyIds: ["chapa"],
      }),
    ];
    const state = recomputeChainExitState(
      members,
      dependencyEdgesWithinChain(members),
      { adesivo: { documentId: "adesivo", qty: 30 } },
    );
    expect(state.fieldConstraints.chapa).toEqual({
      min: 40,
      max: 90,
      defaultQty: 40,
    });
    expect(state.steps.find((step) => step.documentId === "chapa")?.visible)
      .toBe(true);
  });

  it("hides last-peer supplier when min equals remaining target", () => {
    const members = [
      member({ documentId: "chapa", index: 0, targetQty: 50, completedQty: 10 }),
      member({
        documentId: "adesivo",
        index: 1,
        targetQty: 50,
        completedQty: 20,
        dependencyIds: ["chapa"],
      }),
    ];
    const state = recomputeChainExitState(
      members,
      dependencyEdgesWithinChain(members),
      { adesivo: { documentId: "adesivo", qty: 30 } },
    );
    expect(state.answers.chapa).toMatchObject({ qty: 40, inferred: true });
    expect(state.steps.find((step) => step.documentId === "chapa")?.visible)
      .toBe(false);
  });

  it("hides supplier when this peer did not work it and stock covers the consumer", () => {
    const members = [
      member({ documentId: "chapa", index: 0, targetQty: 100, completedQty: 30 }),
      member({
        documentId: "adesivo",
        index: 1,
        targetQty: 100,
        completedQty: 20,
        dependencyIds: ["chapa"],
      }),
    ];
    const state = recomputeChainExitState(
      members,
      dependencyEdgesWithinChain(members),
      { adesivo: { documentId: "adesivo", qty: 10 } },
      { workedMemberIds: ["adesivo"], othersStillActive: true },
    );
    expect(state.steps.find((step) => step.documentId === "chapa")?.visible)
      .toBeUndefined();
    expect(state.answers.chapa).toMatchObject({ qty: 0, inferred: true });
  });
});

describe("validateChainStopCoherence", () => {
  const members = [
    member({ documentId: "cortar", index: 0, targetQty: 10 }),
    member({
      documentId: "montar",
      index: 1,
      targetQty: 5,
      dependencyIds: ["cortar"],
    }),
  ];
  const edges = dependencyEdgesWithinChain(members);

  it("accepts a coherent payload", () => {
    expect(() =>
      validateChainStopCoherence(members, edges, [
        { documentId: "montar", qty: 2 },
        { documentId: "cortar", qty: 4 },
      ]),
    ).not.toThrow();
  });

  it("rejects a supplier qty below the inferred min", () => {
    expect(() =>
      validateChainStopCoherence(members, edges, [
        { documentId: "montar", qty: 2 },
        { documentId: "cortar", qty: 1 },
      ]),
    ).toThrow(CHAIN_STOP_INCONSISTENT);
  });

  it("rejects a finished consumer with an unfinished duration supplier", () => {
    const durationMembers = [
      member({
        documentId: "cortar",
        index: 0,
        sharingType: "duration",
        targetQty: 1,
      }),
      member({
        documentId: "montar",
        index: 1,
        sharingType: "duration",
        targetQty: 1,
        dependencyIds: ["cortar"],
      }),
    ];
    expect(() =>
      validateChainStopCoherence(
        durationMembers,
        dependencyEdgesWithinChain(durationMembers),
        [
          { documentId: "montar", completed: true },
          { documentId: "cortar", completed: false },
        ],
      ),
    ).toThrow(CHAIN_STOP_INCONSISTENT);
  });

  it("rejects a last-peer total where consumers exceed suppliers", () => {
    const line = [
      member({ documentId: "chapa", index: 0, targetQty: 100, completedQty: 10 }),
      member({
        documentId: "adesivo",
        index: 1,
        targetQty: 100,
        completedQty: 20,
        dependencyIds: ["chapa"],
      }),
    ];
    expect(() =>
      validateChainStopCoherence(line, dependencyEdgesWithinChain(line), [
        { documentId: "chapa", qty: 30 },
        { documentId: "adesivo", qty: 30 },
      ]),
    ).toThrow(CHAIN_STOP_INCONSISTENT);
    expect(() =>
      validateChainStopCoherence(line, dependencyEdgesWithinChain(line), [
        { documentId: "chapa", qty: 40 },
        { documentId: "adesivo", qty: 30 },
      ]),
    ).not.toThrow();
  });
});

describe("principalDeclaredFinishFromStopQty", () => {
  it("treats duration qty marker as finish", () => {
    expect(
      principalDeclaredFinishFromStopQty({
        sharingType: "duration",
        targetQty: 1,
        completedQtyBefore: 0,
        principalStopQty: 1,
      }),
    ).toBe(true);
    expect(
      principalDeclaredFinishFromStopQty({
        sharingType: "duration",
        targetQty: 1,
        completedQtyBefore: 0,
        principalStopQty: 0,
      }),
    ).toBe(false);
  });
});

describe("chainExitMembersFromQueue", () => {
  it("maps queue members", () => {
    expect(
      chainExitMembersFromQueue([
        {
          documentId: "a",
          index: 0,
          sharingType: "qty",
          targetQty: 3,
          completedQty: 1,
          dependencyIds: ["b"],
        },
      ]),
    ).toEqual([
      {
        documentId: "a",
        index: 0,
        sharingType: "qty",
        targetQty: 3,
        completedQty: 1,
        dependencyIds: ["b"],
      },
    ]);
  });
});

describe("answer type export", () => {
  it("keeps inferred optional on answers", () => {
    const answer: ChainStopAnswer = { documentId: "a", inferred: true };
    expect(answer.inferred).toBe(true);
  });
});
