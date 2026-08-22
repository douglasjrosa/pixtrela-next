import { describe, expect, it } from "vitest";

import {
  buildExchangePrintPdfFilename,
  isExchangePrintKind,
} from "./print-pdf-filename";

describe("buildExchangePrintPdfFilename", () => {
  it("builds shopping and delivery filenames with zero-padded month", () => {
    expect(buildExchangePrintPdfFilename("shopping", 8, 2026)).toBe(
      "lista-de-compras-08-2026.pdf",
    );
    expect(buildExchangePrintPdfFilename("deliveries", 8, 2026)).toBe(
      "lista-de-trocas-08-2026.pdf",
    );
  });
});

describe("isExchangePrintKind", () => {
  it("accepts supported print kinds", () => {
    expect(isExchangePrintKind("shopping")).toBe(true);
    expect(isExchangePrintKind("deliveries")).toBe(true);
    expect(isExchangePrintKind("other")).toBe(false);
  });
});
