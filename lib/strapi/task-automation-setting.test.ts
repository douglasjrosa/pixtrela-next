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
      },
    });

    const { loadTaskAutomationSetting } = await import("./task-automation-setting");
    await expect(loadTaskAutomationSetting()).resolves.toEqual({
      waitingStepDocumentId: "step-wait",
      producingStepDocumentId: "step-run",
      pausedStepDocumentId: "",
      finishedStepDocumentId: "step-done",
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
      }),
    ).toEqual({
      waitingStep: "step-wait",
      producingStep: null,
      pausedStep: "step-pause",
      finishedStep: null,
    });
  });
});
