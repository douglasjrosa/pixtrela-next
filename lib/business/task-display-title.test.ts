import { describe, expect, it } from "vitest";

import { formatTaskDisplayTitle } from "./task-display-title";

describe("formatTaskDisplayTitle", () => {
  it("prefixes the task name with qty", () => {
    expect(formatTaskDisplayTitle(1, "Beccaro - Misturadeira 25kg")).toBe(
      "1 - Beccaro - Misturadeira 25kg",
    );
  });
});
