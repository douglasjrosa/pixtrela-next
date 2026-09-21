import { describe, expect, it } from "vitest";

import { settingsSubtaskDeleteErrorKey } from "./subtask-delete-error";

describe("settingsSubtaskDeleteErrorKey", () => {
  it("maps known delete failures to settings message keys", () => {
    expect(settingsSubtaskDeleteErrorKey(new Error("categoryHasFlags"))).toBe(
      "categoryHasFlags",
    );
    expect(settingsSubtaskDeleteErrorKey(new Error("categoryInUse"))).toBe(
      "categoryInUse",
    );
    expect(settingsSubtaskDeleteErrorKey(new Error("flagOccupied"))).toBe(
      "flagOccupiedError",
    );
    expect(settingsSubtaskDeleteErrorKey(new Error("other"))).toBe("error");
  });
});
