import { describe, expect, it } from "vitest";

import { subTaskPresetFormSchema } from "./sub-task-preset";

describe("subTaskPresetFormSchema", () => {
  it("accepts a valid preset", () => {
    const parsed = subTaskPresetFormSchema.parse({
      name: "Corte",
      sharingType: "qty",
      maxSameTimeWorkers: 2,
      expectedTime: 120,
    });
    expect(parsed.name).toBe("Corte");
  });

  it("rejects empty name", () => {
    expect(() =>
      subTaskPresetFormSchema.parse({
        name: "",
        sharingType: "duration",
        maxSameTimeWorkers: 1,
        expectedTime: 0,
      }),
    ).toThrow();
  });
});
