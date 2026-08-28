import { describe, expect, it } from "vitest";

import { crmConnectionSchema } from "./schema";

describe("crmConnectionSchema", () => {
  it("accepts baseUrl and webhook secret", () => {
    expect(
      crmConnectionSchema.parse({
        baseUrl: "https://crm.example",
        webhookSecret: "hmac",
      }),
    ).toEqual({
      baseUrl: "https://crm.example",
      webhookSecret: "hmac",
    });
  });

  it("rejects an empty secret", () => {
    expect(() =>
      crmConnectionSchema.parse({
        baseUrl: "https://crm.example",
        webhookSecret: "",
      }),
    ).toThrow();
  });

  it("rejects an invalid baseUrl", () => {
    expect(() =>
      crmConnectionSchema.parse({
        baseUrl: "not-a-url",
        webhookSecret: "hmac",
      }),
    ).toThrow();
  });
});
