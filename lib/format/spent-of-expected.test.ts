import { describe, expect, it } from "vitest";

import { formatSpentOfExpected } from "./spent-of-expected";

describe("formatSpentOfExpected", () => {
  it("joins formatted spent and expected segments", () => {
    const result = formatSpentOfExpected(
      32 * 60,
      81 * 60,
      (key, values) => {
        if (key === "hoursMinutes") {
          return `${values.hours}h${values.minutes}m`;
        }
        if (key === "hoursOnly") return `${values.hours}h`;
        return `${values.minutes}m`;
      },
      (spent, expected) => `${spent} de ${expected}`,
    );
    expect(result).toBe("32m de 1h21m");
  });
});
