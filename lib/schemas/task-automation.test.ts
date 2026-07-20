import { describe, expect, it } from "vitest";

import { taskAutomationFormSchema } from "./task-automation";

describe("taskAutomationFormSchema", () => {
  it("accepts optional step mappings", () => {
    expect(
      taskAutomationFormSchema.parse({
        waitingStepDocumentId: "step-1",
        producingStepDocumentId: "",
        pausedStepDocumentId: "step-3",
        finishedStepDocumentId: "step-4",
        reviewedStepDocumentId: "step-5",
        deliveredStepDocumentId: "",
        assignWarnMax: 4,
      }),
    ).toEqual({
      waitingStepDocumentId: "step-1",
      producingStepDocumentId: "",
      pausedStepDocumentId: "step-3",
      finishedStepDocumentId: "step-4",
      reviewedStepDocumentId: "step-5",
      deliveredStepDocumentId: "",
      assignWarnMax: 4,
    });
  });

  it("rejects non-integer assignWarnMax", () => {
    expect(
      taskAutomationFormSchema.safeParse({
        waitingStepDocumentId: "",
        producingStepDocumentId: "",
        pausedStepDocumentId: "",
        finishedStepDocumentId: "",
        reviewedStepDocumentId: "",
        deliveredStepDocumentId: "",
        assignWarnMax: 2.5,
      }).success,
    ).toBe(false);
  });
});
