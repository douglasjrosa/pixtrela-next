import { describe, expect, it } from "vitest";

import {
  nextTaskStepIdAfterStatusChange,
  resolveAutomatedStepId,
} from "./task-automation-step";

const mapping = {
  waitingStepId: "fila",
  producingStepId: "producao",
  pausedStepId: "producao",
  finishedStepId: "estoque",
  reviewedStepId: "expedicao",
  deliveredStepId: "entregue",
};

describe("resolveAutomatedStepId", () => {
  it("maps producing and finished to the configured steps", () => {
    expect(resolveAutomatedStepId("producing", mapping)).toBe("producao");
    expect(resolveAutomatedStepId("finished", mapping)).toBe("estoque");
  });

  it("returns null when that status has no step", () => {
    expect(
      resolveAutomatedStepId("producing", {
        ...mapping,
        producingStepId: null,
      }),
    ).toBeNull();
  });
});

describe("nextTaskStepIdAfterStatusChange", () => {
  it("moves a finished task off the production queue", () => {
    expect(
      nextTaskStepIdAfterStatusChange("fila", "finished", mapping),
    ).toBe("estoque");
  });

  it("keeps the current column when the status is unmapped", () => {
    expect(
      nextTaskStepIdAfterStatusChange("fila", "producing", {
        ...mapping,
        producingStepId: null,
      }),
    ).toBe("fila");
  });

  it("keeps the current column when settings are missing", () => {
    expect(nextTaskStepIdAfterStatusChange("fila", "finished", null)).toBe(
      "fila",
    );
  });
});
