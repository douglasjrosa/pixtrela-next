import { describe, expect, it, vi } from "vitest";

const strapiFetch = vi.fn();

vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: { taskAutomationSetting: "strapi:task-automation-setting" },
  strapiFetch,
}));

describe("loadTaskAutomationSetting", () => {
  it("maps populated step relations into form values", async () => {
    strapiFetch.mockResolvedValue({
      data: {
        waitingStep: { documentId: "step-wait" },
        producingStep: { documentId: "step-run" },
        pausedStep: null,
        finishedStep: { documentId: "step-done" },
        reviewedStep: { documentId: "step-reviewed" },
        deliveredStep: null,
        assignWarnMax: 3,
      },
    });

    const { loadTaskAutomationSetting } = await import("./task-automation-setting");
    await expect(loadTaskAutomationSetting()).resolves.toEqual({
      waitingStepDocumentId: "step-wait",
      producingStepDocumentId: "step-run",
      pausedStepDocumentId: "",
      finishedStepDocumentId: "step-done",
      reviewedStepDocumentId: "step-reviewed",
      deliveredStepDocumentId: "",
      assignWarnMax: 3,
    });
  });
});

describe("toTaskAutomationSettingPayload", () => {
  it("converts empty selects to null relations", async () => {
    const { toTaskAutomationSettingPayload } = await import(
      "./task-automation-setting"
    );

    expect(
      toTaskAutomationSettingPayload({
        waitingStepDocumentId: "step-wait",
        producingStepDocumentId: "",
        pausedStepDocumentId: "step-pause",
        finishedStepDocumentId: "",
        reviewedStepDocumentId: "step-reviewed",
        deliveredStepDocumentId: "",
        assignWarnMax: 4,
      }),
    ).toEqual({
      waitingStep: "step-wait",
      producingStep: null,
      pausedStep: "step-pause",
      finishedStep: null,
      reviewedStep: "step-reviewed",
      deliveredStep: null,
      assignWarnMax: 4,
    });
  });
});
