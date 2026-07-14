import { describe, expect, it } from "vitest";

import {
  DEACTIVATION_REASON_MIN_LENGTH,
  DEACTIVATION_REASON_MIN_LENGTH_KEY,
} from "./deactivation-reason";
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

  it("requires reasonForDisabling with min length when disabled", () => {
    const result = subTaskFormSchema.safeParse({
      ...validBase,
      activationStatus: "disabled",
      reasonForDisabling: "curta",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual(["reasonForDisabling"]);
    expect(result.error.issues[0]?.message).toBe(
      DEACTIVATION_REASON_MIN_LENGTH_KEY,
    );
  });

  it("accepts disabled subtask with valid reason", () => {
    const data = subTaskFormSchema.parse({
      ...validBase,
      activationStatus: "disabled",
      reasonForDisabling: "x".repeat(DEACTIVATION_REASON_MIN_LENGTH),
    });
    expect(data.activationStatus).toBe("disabled");
  });

  it("does not require reasonForDisabling when unlocked", () => {
    const data = subTaskFormSchema.parse({
      ...validBase,
      activationStatus: "unlocked",
    });
    expect(data.activationStatus).toBe("unlocked");
  });
});
