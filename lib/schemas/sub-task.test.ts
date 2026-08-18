import { describe, expect, it } from "vitest";

import { subTaskFormSchema } from "./sub-task";

const validBase = {
  name: "Soldar",
  qty: 1,
  expectedTime: 300,
  sharingType: "duration" as const,
  maxSameTimeWorkers: 1,
  status: "waiting" as const,
};

describe("subTaskFormSchema", () => {
  it("accepts valid subtask", () => {
    const data = subTaskFormSchema.parse({
      ...validBase,
      activationStatus: "locked",
    });
    expect(data.name).toBe("Soldar");
    expect(data.activationStatus).toBe("locked");
  });

  it("defaults activationStatus to locked", () => {
    const data = subTaskFormSchema.parse(validBase);
    expect(data.activationStatus).toBe("locked");
  });

  it("accepts disabled subtask without a reason", () => {
    const data = subTaskFormSchema.parse({
      ...validBase,
      activationStatus: "disabled",
    });
    expect(data.activationStatus).toBe("disabled");
  });

  it("does not require a reason when unlocked", () => {
    const data = subTaskFormSchema.parse({
      ...validBase,
      activationStatus: "unlocked",
    });
    expect(data.activationStatus).toBe("unlocked");
  });
});
