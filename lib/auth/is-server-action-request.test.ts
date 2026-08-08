import { describe, expect, it } from "vitest";

import { isServerActionRequest } from "./is-server-action-request";

describe("isServerActionRequest", () => {
  it("detects Next.js Server Action POSTs", () => {
    expect(
      isServerActionRequest({
        method: "POST",
        headers: { get: (name) => (name === "next-action" ? "abc" : null) },
      }),
    ).toBe(true);
  });

  it("ignores GET and POSTs without Next-Action", () => {
    expect(
      isServerActionRequest({
        method: "GET",
        headers: { get: () => "abc" },
      }),
    ).toBe(false);
    expect(
      isServerActionRequest({
        method: "POST",
        headers: { get: () => null },
      }),
    ).toBe(false);
  });
});
