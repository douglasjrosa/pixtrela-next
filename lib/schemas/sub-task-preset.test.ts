import { describe, expect, it } from "vitest";

import { SAMPLE_ACTION_ID } from "@/test/sample-subtask-preset";

import { subTaskPresetFormSchema } from "./sub-task-preset";

describe("subTaskPresetFormSchema", () => {
  it("accepts a valid preset with actionId", () => {
    const parsed = subTaskPresetFormSchema.parse({
      name: "Corte",
      sharingType: "qty",
      maxSameTimeWorkers: 2,
      actionId: SAMPLE_ACTION_ID,
    });
    expect(parsed.name).toBe("Corte");
    expect(parsed.actionId).toBe(SAMPLE_ACTION_ID);
  });

  it("rejects a preset without actionId", () => {
    expect(() =>
      subTaskPresetFormSchema.parse({
        name: "Corte",
        sharingType: "qty",
        maxSameTimeWorkers: 2,
      }),
    ).toThrow();
  });

  it("rejects empty name", () => {
    expect(() =>
      subTaskPresetFormSchema.parse({
        name: "",
        sharingType: "duration",
        maxSameTimeWorkers: 1,
        actionId: SAMPLE_ACTION_ID,
      }),
    ).toThrow();
  });
});
