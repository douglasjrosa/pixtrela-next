import { describe, expect, it } from "vitest";

import { ribermaxConnectionSchema } from "./schema";

describe("ribermaxConnectionSchema", () => {
  it("accepts a url and token", () => {
    expect(
      ribermaxConnectionSchema.parse({
        baseUrl: "https://rbx.example",
        token: "secret",
      }),
    ).toEqual({
      baseUrl: "https://rbx.example",
      token: "secret",
    });
  });

  it("rejects empty fields", () => {
    expect(() =>
      ribermaxConnectionSchema.parse({ baseUrl: "", token: "secret" }),
    ).toThrow();
    expect(() =>
      ribermaxConnectionSchema.parse({
        baseUrl: "https://rbx.example",
        token: "",
      }),
    ).toThrow();
  });
});
