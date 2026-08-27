import { describe, expect, it } from "vitest";

import { crmConnectionSchema } from "./schema";

describe("crmConnectionSchema", () => {
  it("accepts a non-empty secret", () => {
    expect(crmConnectionSchema.parse({ webhookSecret: "hmac" })).toEqual({
      webhookSecret: "hmac",
    });
  });

  it("rejects an empty secret", () => {
    expect(() => crmConnectionSchema.parse({ webhookSecret: "" })).toThrow();
  });
});
