import { describe, expect, it } from "vitest";

import { SUB_TASK_NAME_REQUIRED_KEY, subTaskFormSchema } from "./sub-task";

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

  it("accepts a non-negative timeSpent", () => {
    const data = subTaskFormSchema.parse({
      ...validBase,
      timeSpent: 45,
    });
    expect(data.timeSpent).toBe(45);
  });

  it("rejects a negative timeSpent", () => {
    const parsed = subTaskFormSchema.safeParse({
      ...validBase,
      timeSpent: -1,
    });
    expect(parsed.success).toBe(false);
  });

  it("uses an i18n key when the name is empty", () => {
    const parsed = subTaskFormSchema.safeParse({
      ...validBase,
      name: "",
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(
      parsed.error.issues.some(
        (issue) => issue.message === SUB_TASK_NAME_REQUIRED_KEY,
      ),
    ).toBe(true);
  });
});
