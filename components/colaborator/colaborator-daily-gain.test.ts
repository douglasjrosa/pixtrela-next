import { describe, expect, it } from "vitest";

import { sumTodayIncome } from "./colaborator-daily-gain";

describe("sumTodayIncome", () => {
  it("sums amounts for the given day across currencies", () => {
    const total = sumTodayIncome(
      [
        {
          currencyId: 1,
          days: [
            { date: "2026-07-20", amount: 10 },
            { date: "2026-07-19", amount: 5 },
          ],
        },
        {
          currencyId: 2,
          days: [{ date: "2026-07-20", amount: 3 }],
        },
      ],
      "2026-07-20",
    );
    expect(total).toBe(13);
  });
});
