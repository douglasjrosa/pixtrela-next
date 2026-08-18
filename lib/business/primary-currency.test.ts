import { describe, expect, it } from "vitest";

import {
  isPrimaryCurrencyDocument,
  primaryCurrencyDocumentId,
} from "./primary-currency";

describe("primary-currency", () => {
  const currencies = [
    { documentId: "cur-star" },
    { documentId: "cur-gem" },
  ];

  it("uses the first list entry as the protected primary currency", () => {
    expect(primaryCurrencyDocumentId(currencies)).toBe("cur-star");
    expect(isPrimaryCurrencyDocument("cur-star", currencies)).toBe(true);
    expect(isPrimaryCurrencyDocument("cur-gem", currencies)).toBe(false);
  });
});
