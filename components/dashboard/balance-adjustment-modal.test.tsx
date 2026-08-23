import { describe, expect, it } from "vitest";

import { resolveDefaultCurrencyId } from "./balance-adjustment-modal";

describe("resolveDefaultCurrencyId", () => {
  const options = [
    { id: "hearts-id", label: "Corações" },
    { id: "stars-id", label: "Estrelas" },
  ];

  it("prefers the configured subtask payment currency id", () => {
    expect(resolveDefaultCurrencyId(options, "stars-id")).toBe("stars-id");
  });

  it("falls back to the first option when preferred id is missing", () => {
    expect(resolveDefaultCurrencyId(options, "missing-id")).toBe("hearts-id");
  });
});
