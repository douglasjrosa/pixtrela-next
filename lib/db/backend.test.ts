import { describe, it } from "vitest";

import { getDataBackend, isDrizzleBackend } from "./backend";

describe("getDataBackend", () => {
  it("defaults to drizzle", ({ expect }) => {
    const previous = process.env.DATA_BACKEND;
    delete process.env.DATA_BACKEND;
    expect(getDataBackend()).toBe("drizzle");
    expect(isDrizzleBackend()).toBe(true);
    if (previous === undefined) delete process.env.DATA_BACKEND;
    else process.env.DATA_BACKEND = previous;
  });

  it("accepts strapi when explicitly set", ({ expect }) => {
    const previous = process.env.DATA_BACKEND;
    process.env.DATA_BACKEND = "strapi";
    expect(getDataBackend()).toBe("strapi");
    if (previous === undefined) delete process.env.DATA_BACKEND;
    else process.env.DATA_BACKEND = previous;
  });
});
