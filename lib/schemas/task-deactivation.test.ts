import { describe, expect, it } from "vitest";

import {
  DEACTIVATION_REASON_MIN_LENGTH,
  DEACTIVATION_REASON_MIN_LENGTH_KEY,
} from "./deactivation-reason";
import { taskDeactivationSchema } from "./task";

describe("taskDeactivationSchema", () => {
  it("requires reasonForDeactivation with min length", () => {
    const result = taskDeactivationSchema.safeParse({
      reasonForDeactivation: "curta",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual(["reasonForDeactivation"]);
    expect(result.error.issues[0]?.message).toBe(
      DEACTIVATION_REASON_MIN_LENGTH_KEY,
    );
  });

  it("accepts a valid reasonForDeactivation", () => {
    const reason = "x".repeat(DEACTIVATION_REASON_MIN_LENGTH);
    const data = taskDeactivationSchema.parse({
      reasonForDeactivation: reason,
    });
    expect(data.reasonForDeactivation).toBe(reason);
  });
});
