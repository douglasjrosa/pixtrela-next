import { describe, expect, it } from "vitest";

import {
  isPrimaryCurrencyDocument,
  isProtectedCurrencyDocument,
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

  it("skips archived currencies when choosing the primary", () => {
    expect(
      primaryCurrencyDocumentId([
        { documentId: "cur-star", active: false },
        { documentId: "cur-gem", active: true },
      ]),
    ).toBe("cur-gem");
  });

  it("protects the assigned subtasks currency instead of the first row", () => {
    expect(
      isProtectedCurrencyDocument("cur-star", currencies, "cur-gem"),
    ).toBe(false);
    expect(
      isProtectedCurrencyDocument("cur-gem", currencies, "cur-gem"),
    ).toBe(true);
  });

  it("protects the last remaining active currency", () => {
    expect(
      isProtectedCurrencyDocument(
        "cur-gem",
        [
          { documentId: "cur-star", active: false },
          { documentId: "cur-gem", active: true },
        ],
        "cur-star",
      ),
    ).toBe(true);
  });
});
