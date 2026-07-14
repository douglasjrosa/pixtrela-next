import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  DEACTIVATION_REASON_MIN_LENGTH,
  DEACTIVATION_REASON_MIN_LENGTH_KEY,
  refineDeactivationReason,
} from "./deactivation-reason";

describe("refineDeactivationReason", () => {
  it("rejects reasons shorter than the minimum length", () => {
    const schema = z
      .object({ reason: z.string().optional() })
      .superRefine((data, ctx) => {
        refineDeactivationReason(data.reason, ctx, ["reason"]);
      });

    const result = schema.safeParse({ reason: "a".repeat(99) });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual(["reason"]);
    expect(result.error.issues[0]?.message).toBe(
      DEACTIVATION_REASON_MIN_LENGTH_KEY,
    );
  });

  it("accepts reasons with at least the minimum length", () => {
    const schema = z
      .object({ reason: z.string().optional() })
      .superRefine((data, ctx) => {
        refineDeactivationReason(data.reason, ctx, ["reason"]);
      });

    const result = schema.safeParse({
      reason: "a".repeat(DEACTIVATION_REASON_MIN_LENGTH),
    });
    expect(result.success).toBe(true);
  });

  it("trims whitespace before measuring length", () => {
    const schema = z
      .object({ reason: z.string().optional() })
      .superRefine((data, ctx) => {
        refineDeactivationReason(data.reason, ctx, ["reason"]);
      });

    const padded = `  ${"a".repeat(DEACTIVATION_REASON_MIN_LENGTH)}  `;
    expect(schema.safeParse({ reason: padded }).success).toBe(true);
    expect(schema.safeParse({ reason: "   " }).success).toBe(false);
  });
});
