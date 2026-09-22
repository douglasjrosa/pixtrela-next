import { describe, expect, it } from "vitest";

import {
  findPaymentIntervalAt,
  paymentIntervalContains,
} from "./payment-currency-interval";

const OLD_INTERVAL = {
  currencyId: "old",
  validFrom: new Date("1970-01-01T00:00:00Z"),
  validUntil: new Date("2026-09-15T12:00:00Z"),
};

const NEW_INTERVAL = {
  currencyId: "new",
  validFrom: new Date("2026-09-15T12:00:00Z"),
  validUntil: null,
};

describe("paymentIntervalContains", () => {
  it("uses a half-open range so the cutover instant belongs to the new row", () => {
    const cutover = new Date("2026-09-15T12:00:00Z");
    expect(paymentIntervalContains(OLD_INTERVAL, cutover)).toBe(false);
    expect(paymentIntervalContains(NEW_INTERVAL, cutover)).toBe(true);
  });
});

describe("findPaymentIntervalAt", () => {
  it("resolves the currency that was active at the timestamp", () => {
    const intervals = [OLD_INTERVAL, NEW_INTERVAL];
    expect(
      findPaymentIntervalAt(intervals, new Date("2026-09-01T00:00:00Z"))
        ?.currencyId,
    ).toBe("old");
    expect(
      findPaymentIntervalAt(intervals, new Date("2026-09-20T00:00:00Z"))
        ?.currencyId,
    ).toBe("new");
  });
});
