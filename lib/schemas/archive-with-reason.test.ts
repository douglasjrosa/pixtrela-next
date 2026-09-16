import { describe, expect, it } from "vitest";

import {
  BULK_DEACTIVATION_REASON_MIN_LENGTH,
  BULK_DEACTIVATION_REASON_MIN_LENGTH_KEY,
  DEACTIVATION_REASON_MIN_LENGTH,
  DEACTIVATION_REASON_MIN_LENGTH_KEY,
} from "./deactivation-reason";
import {
  archiveWithReasonSchema,
  parseArchiveReason,
} from "./archive-with-reason";

describe("archiveWithReasonSchema", () => {
  it("requires 30 chars for a single record", () => {
    const result = archiveWithReasonSchema(1).safeParse({
      reasonForDeactivation: "a".repeat(DEACTIVATION_REASON_MIN_LENGTH - 1),
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(
      DEACTIVATION_REASON_MIN_LENGTH_KEY,
    );
  });

  it("requires 30 chars for bulk (2+ records)", () => {
    const short = archiveWithReasonSchema(2).safeParse({
      reasonForDeactivation: "a".repeat(BULK_DEACTIVATION_REASON_MIN_LENGTH - 1),
    });
    expect(short.success).toBe(false);
    if (short.success) return;
    expect(short.error.issues[0]?.message).toBe(
      BULK_DEACTIVATION_REASON_MIN_LENGTH_KEY,
    );

    const ok = archiveWithReasonSchema(3).safeParse({
      reasonForDeactivation: "a".repeat(BULK_DEACTIVATION_REASON_MIN_LENGTH),
    });
    expect(ok.success).toBe(true);
  });

  it("parseArchiveReason returns trimmed text", () => {
    const reason = `  ${"a".repeat(DEACTIVATION_REASON_MIN_LENGTH)}  `;
    expect(parseArchiveReason(reason, 1)).toBe(
      "a".repeat(DEACTIVATION_REASON_MIN_LENGTH),
    );
  });
});
