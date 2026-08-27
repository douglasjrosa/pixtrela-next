import { describe, expect, it } from "vitest";

import {
  calculateExpectedTimeFromAction,
  DEFAULT_FACTORY_ACTIONS,
  GRAMPEAR_QUADRO_ACTION_NAME,
} from "./default-actions";

describe("DEFAULT_FACTORY_ACTIONS", () => {
  it("includes the Grampear quadro backfill anchor", () => {
    expect(
      DEFAULT_FACTORY_ACTIONS.some(
        (row) => row.name === GRAMPEAR_QUADRO_ACTION_NAME,
      ),
    ).toBe(true);
  });
});

describe("calculateExpectedTimeFromAction", () => {
  it("rounds unit_time * actionUnits to the nearest second", () => {
    expect(calculateExpectedTimeFromAction(1.04, 30)).toBe(31);
    expect(calculateExpectedTimeFromAction(1.66, 10)).toBe(17);
  });

  it("returns 0 when units are not positive", () => {
    expect(calculateExpectedTimeFromAction(1.04, 0)).toBe(0);
    expect(calculateExpectedTimeFromAction(1.04, -2)).toBe(0);
  });
});
