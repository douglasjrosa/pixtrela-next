import { describe, expect, it } from "vitest";

import {
  KIOSK_IDENTIFY_INVALID_CODE_KEY,
  KIOSK_IDENTIFY_PASSWORD_MIN_LENGTH_KEY,
  kioskIdentifySchema,
} from "./kiosk-identify";

describe("kioskIdentifySchema", () => {
  it("accepts code and password", () => {
    expect(
      kioskIdentifySchema.parse({ code: 9876, password: "123456" }),
    ).toEqual({
      code: 9876,
      password: "123456",
    });
  });

  it("uses i18n keys for a short password", () => {
    const parsed = kioskIdentifySchema.safeParse({
      code: 1111,
      password: "12345",
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(
      parsed.error.issues.some(
        (issue) => issue.message === KIOSK_IDENTIFY_PASSWORD_MIN_LENGTH_KEY,
      ),
    ).toBe(true);
  });

  it("uses an i18n key for a non-integer code", () => {
    const parsed = kioskIdentifySchema.safeParse({
      code: 1.5,
      password: "123456",
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(
      parsed.error.issues.some(
        (issue) => issue.message === KIOSK_IDENTIFY_INVALID_CODE_KEY,
      ),
    ).toBe(true);
  });
});
