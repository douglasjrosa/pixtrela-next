import { describe, expect, it } from "vitest";

import { kioskColaboratorPasswordSchema } from "./kiosk-colaborator-password";

describe("kioskColaboratorPasswordSchema", () => {
  it("accepts matching passwords with minimum length", () => {
    const parsed = kioskColaboratorPasswordSchema.safeParse({
      password: "secret1",
      confirmPassword: "secret1",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const parsed = kioskColaboratorPasswordSchema.safeParse({
      password: "secret1",
      confirmPassword: "secret2",
    });
    expect(parsed.success).toBe(false);
  });
});
